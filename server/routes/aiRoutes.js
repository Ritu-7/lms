import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import {
  analyzeCodingTask,
  chatTutor,
  generateNotes,
  getAIAnalytics,
  runCodingTask,
  summarizePdf,
  summarizeVideo,
} from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.use(protectRoute);

aiRouter.post("/tutor/chat", chatTutor);
aiRouter.post("/pdf-summary", summarizePdf);
aiRouter.post("/video-summary", summarizeVideo);
aiRouter.post("/notes", generateNotes);
aiRouter.post("/coding/analyze", analyzeCodingTask);
aiRouter.post("/coding/run", runCodingTask);
aiRouter.get("/analytics", getAIAnalytics);

export default aiRouter;