import express from "express";
import upload, { lessonAssetUpload } from "../configs/multer.js";

import {
  educatorDashboardData,
  getEnrolledStudentsData,
  updateRoleToEducator,
  addCourse,
  getEducatorCourses,
  togglePublishCourse,
  editCourse,
  deleteCourse
} from "../controllers/educatorController.js";
import { uploadLessonAsset, uploadLessonResource } from "../controllers/lessonAssetController.js";

import { protectEducatorRoutes, protectRoute } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

/* ===============================
   Public Educator Routes
================================ */
// Used once to convert user → educator
educatorRouter.post("/update-role", updateRoleToEducator);

/* ===============================
   Protected Educator Routes
================================ */

// Dashboard
educatorRouter.get(
  "/dashboard",
  protectEducatorRoutes,
  educatorDashboardData
);

// Educator courses  
educatorRouter.get(
  "/courses",
  protectEducatorRoutes,
  getEducatorCourses
);

// Add new course
educatorRouter.post(
  "/add-course",
  protectEducatorRoutes,
  upload.single("thumbnail"),
  addCourse
);

educatorRouter.post(
  "/upload-lesson-asset",
  protectEducatorRoutes,
  lessonAssetUpload.single("file"),
  uploadLessonAsset
);

educatorRouter.post(
  "/upload-lesson-resource",
  protectEducatorRoutes,
  lessonAssetUpload.single("file"),
  uploadLessonResource
);

// Enrolled students
educatorRouter.get(
  "/enrolled-students",
  protectEducatorRoutes,
  getEnrolledStudentsData
);

// Publish / Unpublish course
educatorRouter.patch(
  "/publish-course/:courseId",
  protectEducatorRoutes,
  togglePublishCourse
);

educatorRouter.put(
  "/edit-course/:courseId",
  protectEducatorRoutes,
  upload.single("thumbnail"),
  editCourse
);

educatorRouter.delete(
  "/delete-course/:courseId",
  protectEducatorRoutes,
  deleteCourse
);


export default educatorRouter;
