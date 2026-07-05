import express from "express";
import {
  getUserData,
  userEnrolledCourses,
  purchaseCourse,
  verifyRazorpayPayment,
  updateUserCourseProgress,
  getUserCourseProgress,
  addUserRating,
  getCourseData,
  syncUser
} from "../controllers/userController.js";

import { protectRoute } from "../middlewares/authMiddleware.js";
import { requireFields, validateObjectIdParam, validateRating } from "../middlewares/validate.js";

const userRouter = express.Router();

const requireProgressFields = (req, res, next) => {
  const { courseId, lectureId, lessonId } = req.body || {};
  if (!courseId || (!lectureId && !lessonId)) {
    return res.status(400).json({ success: false, message: "courseId and lessonId are required" });
  }
  next();
};

/* ===============================
   GET routes
================================ */
userRouter.get("/test", (req, res) => {
  res.json({ message: "The Router is connected correctly!" });
});

userRouter.get("/data", protectRoute, getUserData);
userRouter.get("/enrolled-courses", protectRoute, userEnrolledCourses);
userRouter.get('/course/:courseId', protectRoute, validateObjectIdParam("courseId"), getCourseData);
userRouter.post("/sync", protectRoute, syncUser);
/* ===============================
   POST routes
================================ */
userRouter.post("/purchase", protectRoute, requireFields("courseId"), purchaseCourse);
userRouter.post("/verify-payment", protectRoute, requireFields("razorpay_order_id", "razorpay_payment_id", "razorpay_signature"), verifyRazorpayPayment);
userRouter.post("/update-course-progress", protectRoute, requireProgressFields, updateUserCourseProgress);
userRouter.post("/get-course-progress", protectRoute, requireFields("courseId"), getUserCourseProgress);
userRouter.post("/add-rating", protectRoute, requireFields("courseId", "rating"), validateRating, addUserRating);

export default userRouter;
