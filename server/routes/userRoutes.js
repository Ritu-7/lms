import express from 'express';
import { 
    getUserData, 
    userEnrolledCourses, 
    purchaseCourse, 
    verifyRazorpayPayment, 
    updateUserCourseProgress, 
    getUserCourseProgress, 
    addUserRating,
    updateUserRole
} from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/data', getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses);
userRouter.post('/purchase', purchaseCourse); 
userRouter.post('/verify-payment', verifyRazorpayPayment);
userRouter.post('/update-progress', updateUserCourseProgress);
userRouter.get('/progress/:courseId', getUserCourseProgress);
userRouter.post('/add-rating', addUserRating);
userRouter.post('/update-role', updateUserRole);

export default userRouter;