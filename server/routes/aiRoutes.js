import express from "express";
import { protectRoute, protectEducatorRoutes } from "../middlewares/authMiddleware.js";
import {
  analyzeCodingTask,
  chatTutor,
  generateNotes,
  getAIAnalytics,
  runCodingTask,
  summarizePdf,
  summarizeVideo,
  getKeyStatus,
  saveKey,
  deleteKey,
  testKey,
} from "../controllers/aiController.js";
import {
  generateCourse,
  generateCourseFromPdf,
  generateLesson,
  generateLessonFromYoutube,
  generateQuiz,
  generateAssignment,
  saveDraftCourse,
} from "../controllers/courseGenerationController.js";

const aiRouter = express.Router();

aiRouter.use(protectRoute);

aiRouter.post("/tutor/chat", chatTutor);
aiRouter.post("/pdf-summary", summarizePdf);
aiRouter.post("/video-summary", summarizeVideo);
aiRouter.post("/notes", generateNotes);
aiRouter.post("/coding/analyze", analyzeCodingTask);
aiRouter.post("/coding/run", runCodingTask);
aiRouter.get("/analytics", getAIAnalytics);

// BYOK Key Management
aiRouter.get("/key/status", getKeyStatus);
aiRouter.post("/key", saveKey);
aiRouter.delete("/key", deleteKey);
aiRouter.post("/key/test", testKey);

// AI Course Generation (educator-only)
aiRouter.post("/course/generate", protectEducatorRoutes, generateCourse);
aiRouter.post("/course/save-draft", protectEducatorRoutes, saveDraftCourse);
aiRouter.post("/course/from-pdf", protectEducatorRoutes, generateCourseFromPdf);
aiRouter.post("/lesson/generate", protectEducatorRoutes, generateLesson);
aiRouter.post("/lesson/from-youtube", protectEducatorRoutes, generateLessonFromYoutube);
aiRouter.post("/quiz/generate", protectEducatorRoutes, generateQuiz);
aiRouter.post("/assignment/generate", protectEducatorRoutes, generateAssignment);

export default aiRouter;