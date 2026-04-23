import "dotenv/config";
import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import Purchase from "../models/Purchase.js";
import Razorpay from "razorpay";
import mongoose from "mongoose";

// --- Sync User Data ---
export const syncUser = async (req, res) => {
    try {
        const { clerkUserId, name, email, imageUrl } = req.body;
        const user = await User.findOneAndUpdate(
            { clerkUserId }, 
            { name, email, imageUrl }, 
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
      user = await User.create({
        clerkUserId: auth.userId,
        name: "User",
        email: "",
        imageUrl: "",
        role: "student",
        enrolledCourses: [],
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Get Enrolled Courses ---
export const userEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findOne({ clerkUserId: userId }).populate("enrolledCourses");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, enrolledCourses: user.enrolledCourses });
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
    const course = await Course.findById(courseId); // Defining 'course' here

    if (!user || !course) {
      return res.status(404).json({ success: false, message: "User or Course not found" });
    }

    const amount = Math.round((course.coursePrice - (course.discount * course.coursePrice) / 100) * 100);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: process.env.CURRENCY || "INR",
      receipt: `${userId.slice(-5)}_${courseId.slice(-5)}`,
      notes: { courseId: course._id.toString(), userId: user._id.toString() },
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Purchase Error:", error.message);
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

    await Purchase.create({
      course: courseId,
      user: user._id,
      amount: orderInfo.amount / 100,
      status: "completed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    await User.findByIdAndUpdate(user._id, { $addToSet: { enrolledCourses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $addToSet: { studentsEnrolled: user._id } });

    res.json({ success: true, message: "Enrolled Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Progress & Ratings ---
export const updateUserCourseProgress = async (req, res) => {
  try {
    const { userId } = typeof req.auth === 'function' ? req.auth() : req.auth;
    const { courseId, lectureId } = req.body;
    const userData = await User.findOne({ clerkUserId: userId });

    if (!userData.courseProgressData) userData.courseProgressData = {};
    if (!userData.courseProgressData[courseId]) userData.courseProgressData[courseId] = [];
    if (userData.courseProgressData[courseId].includes(lectureId)) return res.json({ success: true });

    userData.courseProgressData[courseId].push(lectureId);
    userData.markModified('courseProgressData');
    await userData.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserCourseProgress = async (req, res) => {
  try {
    const { userId } = typeof req.auth === 'function' ? req.auth() : req.auth;
    const { courseId } = req.body;
    const user = await User.findOne({ clerkUserId: userId });
    const progress = user.courseProgressData ? user.courseProgressData[courseId] : [];
    res.json({ success: true, progressData: { completedLectures: progress } });
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
    await User.findOneAndUpdate({ clerkUserId: userId }, { role });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- Get Single Course Data (For Course Details Page) ---
export const getCourseData = async (req, res) => {
    try {
        const { courseId } = req.params;
        const courseData = await Course.findById(courseId).lean();

        if (!courseData) {
            return res.status(404).json({ 
                success: false, 
                message: "Course not found." 
            });
        }

        res.json({ 
            success: true, 
            courseData 
        });

    } catch (error) {
        console.error("Error fetching course data:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Server error while fetching course details." 
        });
    }
};