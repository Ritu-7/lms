import express from 'express';

import { 
    educatorDashboardData, 
    getEnrolledStudentsData, 
    updateRoleToEducator, 
    addCourse, 
    getEducatorCourses 
} from '../controllers/educatorController.js';
import upload from '../configs/multer.js';

import { protectEducatorRoutes } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router();

// 1. Public Educator Routes (Update role usually happens first)
educatorRouter.get('/update-role', updateRoleToEducator);

// 2. Protected Educator Routes (Requires role: 'educator')

educatorRouter.post('/add-course', upload.single('image'), protectEducatorRoutes, addCourse);
educatorRouter.get('/courses', protectEducatorRoutes, getEducatorCourses);
educatorRouter.get('/dashboard', protectEducatorRoutes, educatorDashboardData);
educatorRouter.get('/enrolled-students', protectEducatorRoutes, getEnrolledStudentsData);

export default educatorRouter;