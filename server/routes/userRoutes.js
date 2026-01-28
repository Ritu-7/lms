import express from "express";
import {
  getUserData,
  userEnrolledCourses,
  purchaseCourse,
  verifyRazorpayPayment,
  updateUserCourseProgress,
  getUserCourseProgress,
  addUserRating,
} from "../controllers/userController.js";

import { protectRoute } from "../middlewares/authMiddleware.js";

const userRouter = express.Router();

/* ===============================
   GET routes
================================ */
userRouter.get("/test", (req, res) => {
  res.json({ message: "The Router is connected correctly!" });
});

userRouter.get("/data", protectRoute, getUserData);
userRouter.get("/enrolled-courses", protectRoute, userEnrolledCourses);

/* ===============================
   POST routes
================================ */
userRouter.post("/purchase", protectRoute, purchaseCourse);
userRouter.post("/verify-payment", protectRoute, verifyRazorpayPayment);
userRouter.post("/update-course-progress", protectRoute, updateUserCourseProgress);
userRouter.post("/get-course-progress", protectRoute, getUserCourseProgress);
userRouter.post("/add-rating", protectRoute, addUserRating);

export default userRouter;
