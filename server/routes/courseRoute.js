import express from 'express';
import { getAllCourse, getCourseId } from '../controllers/courseController.js';
const CourseRouter = express.Router();

CourseRouter.get('/all', getAllCourse);
CourseRouter.get('/course/:id', getCourseId);
export default CourseRouter;