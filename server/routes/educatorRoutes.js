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
import { getVideoDuration } from "../controllers/videoDurationController.js";

import { protectEducatorRoutes, protectRoute } from "../middlewares/authMiddleware.js";

const educatorRouter = express.Router();

const handleLessonAssetUpload = (req, res, next) => {
  lessonAssetUpload.single("file")(req, res, (error) => {
    if (!error) return next();

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large. Maximum upload size is 50 MB.",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type for lesson uploads.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Upload failed",
    });
  });
};

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
  handleLessonAssetUpload,
  uploadLessonAsset
);

educatorRouter.post(
  "/upload-lesson-resource",
  protectEducatorRoutes,
  handleLessonAssetUpload,
  uploadLessonResource
);

educatorRouter.get(
  "/video-duration",
  protectEducatorRoutes,
  getVideoDuration
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
