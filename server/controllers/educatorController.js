import { clerkClient } from "@clerk/express";
import Course from "../models/Course.js";
import { v2 as cloudinary } from "cloudinary";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import fs from "fs";

/* ===============================
   Update role to educator
================================ */

export const updateRoleToEducator = async (req, res) => {
  try {
    const auth = req.auth();

    if (!auth?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 1️⃣ Clerk
    await clerkClient.users.updateUserMetadata(auth.userId, {
      publicMetadata: { role: "educator" },
    });

    // 2️⃣ MongoDB
    const user = await User.findOneAndUpdate(
      { clerkUserId: auth.userId },
      { role: "educator" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in MongoDB",
      });
    }

    res.json({
      success: true,
      message: "You are now an educator",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ===============================
   Add Course
================================ */
export const addCourse = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseData } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ success: false, message: "Course thumbnail is required" });
    }

    const educator = await User.findOne({ clerkUserId: userId });
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    const parsedCourseData =
      typeof courseData === "string" ? JSON.parse(courseData) : courseData;

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);
    fs.unlinkSync(imageFile.path);

    const course = await Course.create({
      ...parsedCourseData,
      educator: educator._id,
      courseThumbnail: imageUpload.secure_url,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: "Course added successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   Educator Dashboard
================================ */
export const educatorDashboardData = async (req, res) => {
  try {
    const { userId } = req.auth();

    const educator = await User.findOne({ clerkUserId: userId });
    if (!educator) return res.status(404).json({ success: false });

    const courses = await Course.find({ educator: educator._id });
    const courseIds = courses.map((c) => c._id);

    // ✅ FIX: Change 'courseId' to 'course' to match your database schema
    const purchases = await Purchase.find({
      course: { $in: courseIds }, 
      status: { $in: ["completed", "success"] },
    });

    // ✅ FIX: Use Number() to ensure the total is a math calculation, not a string
    const totalEarnings = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const enrolledStudents = courses.flatMap((course) =>
      (course.studentsEnrolled || []).map((student) => ({
        courseTitle: course.courseTitle,
        student,
      }))
    );

    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalEarnings,
        totalEnrolledStudents: enrolledStudents.length,
        enrolledStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   Also fix Enrolled Students Data
================================ */
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const educator = await User.findOne({ clerkUserId: userId });

    const courses = await Course.find({ educator: educator._id });
    const courseIds = courses.map((c) => c._id);

    const purchases = await Purchase.find({
      course: { $in: courseIds }, // Matches your DB field 'course'
      status: { $in: ["completed", "success"] },
    })
    .populate("user", "name email imageUrl") // ✅ Matches your DB field 'user'
    .populate("course", "courseTitle");

    res.json({
      success: true,
      enrolledStudentsData: purchases.map((p) => ({
        // ✅ CRITICAL: We map 'p.user' to the 'student' key the frontend expects
        student: p.user, 
        courseTitle: p.course?.courseTitle || "Untitled Course",
        purchaseDate: p.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ===============================
   Publish / Unpublish Course
================================ */
export const togglePublishCourse = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId } = req.params;

    const educator = await User.findOne({ clerkUserId: userId });
    const course = await Course.findById(courseId);

    if (!course || course.educator.toString() !== educator._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    course.isPublished = !course.isPublished;
    await course.save();

    res.json({
      success: true,
      message: course.isPublished ? "Course published" : "Course unpublished",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   Get Educator Courses
================================ */
export const getEducatorCourses = async (req, res) => {
  try {
    const { userId } = req.auth();

    const educator = await User.findOne({ clerkUserId: userId });
    if (!educator) {
      return res.status(404).json({ success: false, message: "Educator not found" });
    }

    // ✅ FIX: Ensure we find courses belonging to this educator
    // If you want to be extra safe, you can .populate('studentsEnrolled') 
    // but just ensuring the field exists is usually enough.
    const courses = await Course.find({ educator: educator._id });
    
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   Edit Course
================================ */
export const editCourse = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId } = req.params;

    const educator = await User.findOne({ clerkUserId: userId });
    const course = await Course.findById(courseId);

    if (!course || course.educator.toString() !== educator._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (req.file) {
      if (!req.file.path) {
        return res.status(400).json({ success: false, message: "Invalid file path for thumbnail" });
      }
      const upload = await cloudinary.uploader.upload(req.file.path);
      fs.unlinkSync(req.file.path);
      course.courseThumbnail = upload.secure_url;
    }

    const updates = req.body.courseData
      ? JSON.parse(req.body.courseData)
      : req.body;

    Object.assign(course, updates);
    await course.save();

    res.json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   Delete Course
================================ */
export const deleteCourse = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId } = req.params;

    const educator = await User.findOne({ clerkUserId: userId });
    const course = await Course.findById(courseId);

    if (!course || course.educator.toString() !== educator._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Course.findByIdAndDelete(courseId);

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
