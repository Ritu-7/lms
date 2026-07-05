import express from "express";
import { protectEducatorRoutes, protectRoute } from "../middlewares/authMiddleware.js";
import { validateObjectIdParam } from "../middlewares/validate.js";
import {
  createQuiz,
  deleteQuiz,
  getQuizAttemptsForEducator,
  getQuizDetails,
  getQuizHistory,
  getStudentQuizzes,
  listEducatorQuizzes,
  reviewQuizAttempt,
  startQuizAttempt,
  submitQuizAttempt,
  updateQuiz,
} from "../controllers/quizController.js";

const quizRouter = express.Router();

quizRouter.get("/me", protectRoute, getStudentQuizzes);
quizRouter.get("/:quizId", protectRoute, validateObjectIdParam("quizId"), getQuizDetails);
quizRouter.get("/:quizId/history", protectRoute, validateObjectIdParam("quizId"), getQuizHistory);
quizRouter.post("/:quizId/start", protectRoute, validateObjectIdParam("quizId"), startQuizAttempt);
quizRouter.post("/:quizId/submit", protectRoute, validateObjectIdParam("quizId"), submitQuizAttempt);

quizRouter.get("/educator/list", protectEducatorRoutes, listEducatorQuizzes);
quizRouter.get("/educator/:quizId/attempts", protectEducatorRoutes, validateObjectIdParam("quizId"), getQuizAttemptsForEducator);
quizRouter.post("/educator", protectEducatorRoutes, createQuiz);
quizRouter.put("/educator/:quizId", protectEducatorRoutes, validateObjectIdParam("quizId"), updateQuiz);
quizRouter.delete("/educator/:quizId", protectEducatorRoutes, validateObjectIdParam("quizId"), deleteQuiz);
quizRouter.patch("/educator/attempts/:attemptId/review", protectEducatorRoutes, validateObjectIdParam("attemptId"), reviewQuizAttempt);

export default quizRouter;
