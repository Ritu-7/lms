import express from 'express';
import { 
    getUserData, 
    userEnrolledCourses, 
    purchaseCourse, 
    verifyRazorpayPayment, 
    updateUserCourseProgress, 
    getUserCourseProgress, 
    addUserRating 
} from '../controllers/userController.js';

const userRouter = express.Router();

// --- 1. USER PROFILE & ENROLLMENT ---
// Base Path: /api/user/data
userRouter.get('/data', getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses);

// --- 2. RAZORPAY PAYMENT ---
// Step 1: Frontend calls this to get 'order_id'
userRouter.post('/purchase', purchaseCourse); 
// Step 2: Frontend calls this after Razorpay popup success
userRouter.post('/verify-payment', verifyRazorpayPayment);

// --- 3. COURSE PROGRESS ---
userRouter.post('/update-progress', updateUserCourseProgress);
// Note: We use :courseId as a param for cleaner GET requests
userRouter.get('/progress/:courseId', getUserCourseProgress);

// --- 4. RATINGS ---
userRouter.post('/add-rating', addUserRating);

export default userRouter;