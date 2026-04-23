import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import Purchase from "../models/Purchase.js"; // Import Purchase model
import Razorpay from "razorpay";
import mongoose from "mongoose"; // Import mongoose



export const syncUser = async (req, res) => {
    try {
        const { clerkUserId, name, email, imageUrl } = req.body;

        // findOneAndUpdate with upsert: true will:
        // 1. Find the user by clerkUserId
        // 2. Update their name, email, and imageUrl
        // 3. If they don't exist, create a new document
        const user = await User.findOneAndUpdate(
            { clerkUserId }, 
            { name, email, imageUrl }, 
            { upsert: true, new: true }
        );

        res.json({ success: true, user });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
/* ===============================
   Get current user profile
================================ */
export const getUserData = async (req, res) => {
  try {
    const auth = req.auth();

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ ALWAYS search by clerkUserId
    let user = await User.findOne({ clerkUserId: auth.userId });

    // Safety net (only if webhook failed)
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

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("getUserData error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ===============================
   Get enrolled courses
================================ */
export const userEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.auth();

    const user = await User.findOne({ clerkUserId: userId })
      .populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      enrolledCourses: user.enrolledCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===============================
   Create Razorpay order
================================ */
export const purchaseCourse = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId } = req.body;

    // Input Validation: courseId
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid Course ID" });
    }

    // Find User
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find Course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if course is published
    if (!course.isPublished) {
      return res.status(400).json({ success: false, message: "Course is not published yet" });
    }

    // Check if user is already enrolled
    if (user.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ success: false, message: "You are already enrolled in this course" });
    }

    // Calculate Amount
    const amount =
      (course.coursePrice -
        (course.discount * course.coursePrice) / 100) *
      100; // Amount in paisa for Razorpay

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount,
      currency: process.env.CURRENCY || "INR",
      receipt: `${userId.slice(-5)}_${courseId.slice(-5)}`, // Unique receipt ID
      notes: { courseId: course._id.toString(), userId: user._id.toString() }, // Store actual MongoDB IDs
    });

    // Respond with order details
    res.json({ success: true, order });
  } catch (error) {
    console.error("purchaseCourse error:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

/* ===============================
   Verify payment & enroll
================================ */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body; // Destructure all Razorpay fields

    // Basic validation for incoming data
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed: missing Razorpay data" });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Verify the payment signature
    // Dynamically import crypto for potential serverless environment or cleaner import
    const crypto = await import('crypto'); 
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed: invalid signature" });
    }

    // Fetch order details from Razorpay
    const orderInfo = await razorpay.orders.fetch(razorpay_order_id);

    // Ensure order status is 'paid'
    if (orderInfo.status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not completed or failed" });
    }
    
    // Extract courseId and user's MongoDB ID from notes
    const courseId = orderInfo.notes.courseId;
    const userMongoIdFromNotes = orderInfo.notes.userId; // This is the user's MongoDB _id, not Clerk userId

    // Find the actual user object from MongoDB using the Clerk userId (for current authenticated user)
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "Authenticated user not found in DB" });
    }

    // Double-check if user is already enrolled before proceeding with enrollment
    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ success: false, message: "You are already enrolled in this course" });
    }

    // Create a new purchase record
    const purchase = await Purchase.create({
      course: courseId,
      user: user._id, // Use actual MongoDB user ID
      amount: orderInfo.amount / 100, // Convert paisa back to currency (assuming currency in paisa)
      status: "completed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    // Enroll the user in the course (add course to user's enrolledCourses)
    await User.findByIdAndUpdate(user._id, { $addToSet: { enrolledCourses: courseId } });

    // Add user to Course's studentsEnrolled list
    await Course.findByIdAndUpdate(courseId, { $addToSet: { studentsEnrolled: user._id } });

    res.json({ success: true, message: "Payment successful and enrolled", purchaseId: purchase._id });
  } catch (error) {
    console.error("verifyRazorpayPayment error:", error); // Log the error for debugging
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

/* ===============================
   Update course progress
================================ */
// userController.js 

// userController.js

export const updateUserCourseProgress = async (req, res) => {
  try {
    // 1. Get userId safely (Clerk is moving req.auth to a function)
    const { userId } = typeof req.auth === 'function' ? req.auth() : req.auth;
    const { courseId, lectureId } = req.body;

    // 2. IMPORTANT: Change findById to findOne using the clerkUserId string
    const userData = await User.findOne({ clerkUserId: userId });

    if (!userData) {
      return res.status(404).json({ success: false, message: 'User Not Found' });
    }

    // 3. Initialize nested objects if they don't exist
    if (!userData.courseProgressData) {
        userData.courseProgressData = {};
    }

    if (!userData.courseProgressData[courseId]) {
        userData.courseProgressData[courseId] = [];
    }

    // 4. Prevent duplicate lecture entries
    if (userData.courseProgressData[courseId].includes(lectureId)) {
        return res.json({ success: true, message: 'Lecture already completed' });
    }

    // 5. Update and Save
    userData.courseProgressData[courseId].push(lectureId);

    // Tell Mongoose the Object type has changed
    userData.markModified('courseProgressData');

    await userData.save();

    res.json({ success: true, message: 'Progress Updated' });

  } catch (error) {
    console.error("Update Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
    Get course progress
================================ */
export const getUserCourseProgress = async (req, res) => {
  try {
    const { userId } = typeof req.auth === 'function' ? req.auth() : req.auth;
    const { courseId } = req.body;

    // Consistency: Always use findOne for Clerk IDs
    const userData = await User.findOne({ clerkUserId: userId });
    
    if (!userData) {
      return res.status(404).json({ success: false, message: 'User Not Found' });
    }

    const progress = userData.courseProgressData ? userData.courseProgressData[courseId] : [];
    
    res.json({ 
      success: true, 
      progressData: { completedLectures: progress || [] } 
    });
  } catch (error) {
    console.error("Fetch Progress Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   Add / update rating
================================ */
export const addUserRating = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId, rating } = req.body;

    const course = await Course.findById(courseId);

    const index = course.courseRatings.findIndex(
      (r) => r.userId === userId
    );

    if (index > -1) {
      course.courseRatings[index].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();

    res.json({ success: true, message: "Rating added" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ===============================
   Update user role (MongoDB)
================================ */
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { role } = req.body;

    if (!["student", "educator"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { role }
    );

    res.json({ success: true, message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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