import express from "express";
import { protectRoute, protectEducatorRoutes } from "../middlewares/authMiddleware.js";
import { validateObjectIdParam } from "../middlewares/validate.js";
import upload, { lessonAssetUpload } from "../configs/multer.js";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentDetails,
  getAssignmentSubmissions,
  getStudentAssignments,
  listEducatorAssignments,
  reviewAssignmentSubmission,
  submitAssignment,
  updateAssignment,
  uploadAssignmentAssets,
} from "../controllers/assignmentController.js";

const assignmentRouter = express.Router();

assignmentRouter.get("/me", protectRoute, getStudentAssignments);

assignmentRouter.get("/educator/list", protectEducatorRoutes, listEducatorAssignments);
assignmentRouter.get("/educator/:assignmentId/submissions", protectEducatorRoutes, validateObjectIdParam("assignmentId"), getAssignmentSubmissions);
assignmentRouter.post("/educator/upload", protectEducatorRoutes, lessonAssetUpload.array("files", 10), uploadAssignmentAssets);
assignmentRouter.post("/educator", protectEducatorRoutes, lessonAssetUpload.array("files", 10), createAssignment);
assignmentRouter.put("/educator/:assignmentId", protectEducatorRoutes, validateObjectIdParam("assignmentId"), lessonAssetUpload.array("files", 10), updateAssignment);
assignmentRouter.delete("/educator/:assignmentId", protectEducatorRoutes, validateObjectIdParam("assignmentId"), deleteAssignment);
assignmentRouter.patch("/educator/submissions/:submissionId/review", protectEducatorRoutes, validateObjectIdParam("submissionId"), upload.none(), reviewAssignmentSubmission);

assignmentRouter.get("/:assignmentId", protectRoute, validateObjectIdParam("assignmentId"), getAssignmentDetails);
assignmentRouter.post("/:assignmentId/submit", protectRoute, validateObjectIdParam("assignmentId"), lessonAssetUpload.array("files", 10), submitAssignment);

export default assignmentRouter;
