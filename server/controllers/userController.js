import "dotenv/config";
import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import Purchase from "../models/Purchase.js";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { resolveUserRole } from "../utils/roleUtils.js";
import { serializeCourseHierarchy } from "../services/courseHierarchyService.js";
import { notifyEnrollment, notifyPaymentSuccess, notifyNewEnrollmentToEducator, notifyCertificate } from "../services/notificationService.js";
import {
  buildProgressSnapshot,
  canCompleteLesson,
  getCourseLessons,
  getLessonId,
  normalizeProgressRecord,
} from "../services/progressEngineService.js";
import { issueCertificateForCourseCompletion, listCertificatesForUser } from "../services/certificateService.js";
import { getStudyLibraryForUser } from "../services/studyLibraryService.js";

// --- Sync User Data ---
export const syncUser = async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { name, email, imageUrl } = req.body;
    const existingUser = await User.findOne({ clerkUserId });
    const role = resolveUserRole({ clerkUserId, email, existingRole: existingUser?.role });
        const user = await User.findOneAndUpdate(
            { clerkUserId }, 
      { name, email, imageUrl, role }, 
            { upsert: true, new: true }
        );
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// --- Get Current User Profile ---
export const getUserData = async (req, res) => {
  try {
    const auth = req.auth();
    if (!auth || !auth.userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    let user = await User.findOne({ clerkUserId: auth.userId });
    if (!user) {
      const role = resolveUserRole({ clerkUserId: auth.userId, email: "", existingRole: undefined });
      user = await User.create({
        clerkUserId: auth.userId,
        name: "User",
        email: "",
        imageUrl: "",
        role,
        enrolledCourses: [],
      });
    }
    const [certificates, studyLibrary] = await Promise.all([
      listCertificatesForUser(user._id),
      getStudyLibraryForUser(user._id),
    ]);
    res.json({ success: true, user: { ...user.toObject(), certificates, studyLibrary } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Get Enrolled Courses ---
export const userEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findOne({ clerkUserId: userId }).populate({
      path: "enrolledCourses",
      populate: { path: "modules", populate: { path: "lessons" } },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      enrolledCourses: user.enrolledCourses.map((course) => serializeCourseHierarchy(course)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Create Razorpay Order (FIXED) ---
export const purchaseCourse = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId } = req.body;

    const user = await User.findOne({ clerkUserId: userId });
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({ success: false, message: "User or Course not found" });
    }
    if (!course.isPublished) return res.status(409).json({ success: false, message: "Course is not available for purchase" });
    if (user.enrolledCourses.some((id) => id.equals(course._id))) return res.status(409).json({ success: false, message: "You are already enrolled in this course" });

    // Amount in paisa
    const amount = Math.round((course.coursePrice - (course.discount * course.coursePrice) / 100) * 100);

    // Initializing Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: process.env.CURRENCY || "INR",
      receipt: `rcpt_${userId.slice(-5)}`,
      notes: { courseId: course._id.toString(), userId: user._id.toString() },
    });

    await Purchase.findOneAndUpdate(
      { razorpayOrderId: order.id },
      { course: course._id, user: user._id, amount: amount / 100, status: "pending", razorpayOrderId: order.id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, order });
  } catch (error) {
    // Isse Render logs mein poora stack trace dikhega
    console.error("DETAILED PURCHASE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Verify Payment & Enroll ---
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const crypto = await import('crypto'); 
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    if (hmac.digest('hex') !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    const orderInfo = await razorpay.orders.fetch(razorpay_order_id);
    if (orderInfo.status !== "paid") return res.status(400).json({ success: false, message: "Payment failed" });
    
    const courseId = orderInfo.notes.courseId;
    const user = await User.findOne({ clerkUserId: userId });

    await Purchase.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: user._id },
      { course: courseId, user: user._id, amount: orderInfo.amount / 100, status: "completed", razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(user._id, { $addToSet: { enrolledCourses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { studentsEnrolled: user._id } });

    // ── Notifications ────────────────────────────────────────────────────
    const courseDoc = await Course.findById(courseId).populate("educator", "name").lean();
    const courseTitle = courseDoc?.courseTitle || "a course";
    const enrollAmount = orderInfo.amount / 100;
    notifyEnrollment(user._id, courseId, courseTitle);
    notifyPaymentSuccess(user._id, courseId, courseTitle, enrollAmount);
    if (courseDoc?.educator) {
      notifyNewEnrollmentToEducator(courseDoc.educator._id, user.name || "A student", courseId, courseTitle);
    }

    res.json({ success: true, message: "Enrolled Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Progress & Ratings ---
export const updateUserCourseProgress = async (req, res) => {
  try {
    const { userId } = typeof req.auth === 'function' ? req.auth() : req.auth;
    const { courseId, lectureId, lessonId, completionData = {} } = req.body;
    const targetLessonId = lessonId || lectureId;
    const userData = await User.findOne({ clerkUserId: userId });
    if (!userData) return res.status(404).json({ success: false, message: "User not found" });
    if (!userData.enrolledCourses.some((id) => id.toString() === courseId)) return res.status(403).json({ success: false, message: "Enrollment required" });

    const course = await Course.findById(courseId).populate({ path: "modules", populate: { path: "lessons" } });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const lesson = getCourseLessons(course).find((entry) => String(getLessonId(entry)) === String(targetLessonId));
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    if (!canCompleteLesson(lesson, completionData)) {
      return res.status(422).json({ success: false, message: "Lesson completion rules were not satisfied" });
    }

    await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      {
        $addToSet: {
          completedLessons: String(targetLessonId),
          completedLectures: String(targetLessonId),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Maintain the legacy embedded shape until all existing deployments are migrated.
    if (!userData.courseProgressData) userData.courseProgressData = {};
    if (!userData.courseProgressData[courseId]) userData.courseProgressData[courseId] = [];
    if (!userData.courseProgressData[courseId].includes(String(targetLessonId))) userData.courseProgressData[courseId].push(String(targetLessonId));
    userData.markModified("courseProgressData");
    await userData.save();

    const progressRecord = await CourseProgress.findOne({ userId, courseId });
    const progressSummary = buildProgressSnapshot({ course, progressRecord, legacyProgress: userData.courseProgressData?.[courseId] || [] });
    const certificate = await issueCertificateForCourseCompletion({ user: userData, course, progressSummary });

    // ── Notification: certificate earned ─────────────────────────────────
    if (certificate) {
      notifyCertificate(userData._id, courseId, course.courseTitle || "a course", certificate.certificateId);
    }

    res.json({
      success: true,
      progressData: normalizeProgressRecord(progressRecord, userData.courseProgressData?.[courseId] || []),
      progressSummary,
      certificate: certificate ? {
        certificateId: certificate.certificateId,
        issueDate: certificate.issueDate,
        verificationUrl: certificate.verificationUrl,
        downloadUrl: `/api/certificates/${certificate.certificateId}/download`,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserCourseProgress = async (req, res) => {
  try {
    const { userId } = typeof req.auth === 'function' ? req.auth() : req.auth;
    const { courseId } = req.body;
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.enrolledCourses.some((id) => id.toString() === courseId)) return res.status(403).json({ success: false, message: "Enrollment required" });
    let record = await CourseProgress.findOne({ userId, courseId });
    const legacyProgress = user.courseProgressData?.[courseId] || [];
    if (!record && legacyProgress.length) {
      record = await CourseProgress.create({
        userId,
        courseId,
        completedLessons: legacyProgress,
        completedLectures: legacyProgress,
      });
    }

    const course = await Course.findById(courseId).populate({ path: "modules", populate: { path: "lessons" } });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const progressData = buildProgressSnapshot({ course, progressRecord: record, legacyProgress });
    await issueCertificateForCourseCompletion({ user, course, progressSummary: progressData });
    res.json({ success: true, progressData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addUserRating = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId, rating } = req.body;
    const course = await Course.findById(courseId);
    const index = course.courseRatings.findIndex((r) => r.userId === userId);
    if (index > -1) course.courseRatings[index].rating = rating;
    else course.courseRatings.push({ userId, rating });
    await course.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { role } = req.body;
    const currentUser = await User.findOne({ clerkUserId: userId });
    const resolvedRole = resolveUserRole({ clerkUserId: userId, email: currentUser?.email, existingRole: role || currentUser?.role });
    await User.findOneAndUpdate({ clerkUserId: userId }, { role: resolvedRole });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- Get Single Course Data (For Course Details Page) ---
export const getCourseData = async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = await User.findOne({ clerkUserId: req.clerkUserId });
        if (!user?.enrolledCourses.some((id) => id.toString() === courseId)) {
          return res.status(403).json({ success: false, message: "Enrollment required" });
        }
        const courseData = await Course.findById(courseId)
          .populate({ path: "modules", populate: { path: "lessons" } })
          .lean();

        if (!courseData) {
            return res.status(404).json({ 
                success: false, 
                message: "Course not found." 
            });
        }

        res.json({ 
            success: true, 
            courseData: serializeCourseHierarchy(courseData) 
        });

    } catch (error) {
        console.error("Error fetching course data:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching course details." 
        });
    }
};
