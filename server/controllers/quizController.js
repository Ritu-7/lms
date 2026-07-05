import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import { normalizeQuizQuestions, calculateQuizTotalPoints, evaluateQuizAttempt, computeQuizExpiresAt, canAttemptQuiz, summarizeQuizAttempt } from "../services/quizService.js";
import { notifyQuizAvailable, notifyQuizResult } from "../services/notificationService.js";

const parsePayload = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getId = (value) => value?._id?.toString?.() || value?.toString?.() || "";

const getEducator = async (req) => {
  const { userId } = req.auth();
  const educator = await User.findOne({ clerkUserId: userId });
  return { userId, educator };
};

const assertCourseOwnership = async (educatorId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return { course: null, error: "Course not found" };
  if (course.educator.toString() !== educatorId.toString()) return { course: null, error: "Not authorized" };
  return { course, error: null };
};

const canAccessQuiz = (quiz = {}, user = null) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (getId(quiz.educator) === user._id.toString()) return true;
  return user.enrolledCourses?.some((courseId) => courseId.toString() === getId(quiz.course));
};

const buildStudentQuizSummary = (quiz = {}, attempt = null, attempts = []) => ({
  ...quiz,
  attemptSummary: summarizeQuizAttempt(attempt),
  historyCount: attempts.length,
});

export const createQuiz = async (req, res) => {
  try {
    const { educator } = await getEducator(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const quizData = parsePayload(req.body.quizData, req.body);
    const { course, error } = await assertCourseOwnership(educator._id, quizData.course);
    if (error) return res.status(403).json({ success: false, message: error });

    const questions = normalizeQuizQuestions(quizData.questions);
    const quiz = await Quiz.create({
      title: quizData.title,
      description: quizData.description || "",
      instructions: quizData.instructions || "",
      course: course._id,
      module: quizData.module || null,
      lesson: quizData.lesson || null,
      educator: educator._id,
      status: quizData.status || "draft",
      startAt: quizData.startAt || null,
      dueAt: quizData.dueAt || null,
      timeLimitMinutes: Number(quizData.timeLimitMinutes || 0),
      attemptLimit: Number(quizData.attemptLimit || 1),
      passingScore: Number(quizData.passingScore || 70),
      instantEvaluation: quizData.instantEvaluation ?? true,
      reviewMode: quizData.reviewMode ?? true,
      showCorrectAnswersImmediately: quizData.showCorrectAnswersImmediately ?? false,
      shuffleQuestions: quizData.shuffleQuestions ?? false,
      questions,
      tags: Array.isArray(quizData.tags) ? quizData.tags : String(quizData.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      totalPoints: calculateQuizTotalPoints(questions),
    });

    res.status(201).json({ success: true, quiz });

    // ── Notification: quiz available (only if published) ─────────────
    if ((quizData.status || "draft") === "published") {
      const enrolledIds = (course.studentsEnrolled || []).map((id) => id.toString());
      notifyQuizAvailable(enrolledIds, course._id, quiz._id, quiz.title);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listEducatorQuizzes = async (req, res) => {
  try {
    const { educator } = await getEducator(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const quizzes = await Quiz.find({ educator: educator._id }).populate("course", "courseTitle courseThumbnail").sort({ createdAt: -1 }).lean();
    const quizIds = quizzes.map((quiz) => quiz._id);
    const attempts = await QuizAttempt.find({ quiz: { $in: quizIds } }).lean();

    const statsMap = new Map();
    for (const attempt of attempts) {
      const key = attempt.quiz.toString();
      const bucket = statsMap.get(key) || { attempts: 0, graded: 0, passed: 0 };
      bucket.attempts += 1;
      bucket.graded += ["graded", "needs_review", "submitted"].includes(attempt.status) ? 1 : 0;
      bucket.passed += attempt.passed ? 1 : 0;
      statsMap.set(key, bucket);
    }

    res.json({
      success: true,
      quizzes: quizzes.map((quiz) => ({
        ...quiz,
        stats: statsMap.get(quiz._id.toString()) || { attempts: 0, graded: 0, passed: 0 },
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { educator } = await getEducator(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    if (quiz.educator.toString() !== educator._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });

    const quizData = parsePayload(req.body.quizData, req.body);
    const questions = quizData.questions ? normalizeQuizQuestions(quizData.questions) : quiz.questions;

    Object.assign(quiz, {
      ...quizData,
      questions,
      tags: quizData.tags ? (Array.isArray(quizData.tags) ? quizData.tags : String(quizData.tags).split(",").map((tag) => tag.trim()).filter(Boolean)) : quiz.tags,
      totalPoints: calculateQuizTotalPoints(questions),
    });

    await quiz.save();
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { educator } = await getEducator(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    if (quiz.educator.toString() !== educator._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });

    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    res.json({ success: true, message: "Quiz deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentQuizzes = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const quizzes = await Quiz.find({ course: { $in: user.enrolledCourses }, status: "published" })
      .populate("course", "courseTitle courseThumbnail")
      .populate("educator", "name imageUrl email")
      .sort({ dueAt: 1, createdAt: -1 })
      .lean();

    const quizIds = quizzes.map((quiz) => quiz._id);
    const attempts = await QuizAttempt.find({ student: user._id, quiz: { $in: quizIds } }).sort({ attemptNumber: -1 }).lean();
    const attemptMap = new Map();
    const historyMap = new Map();

    for (const attempt of attempts) {
      const key = attempt.quiz.toString();
      if (!attemptMap.has(key)) attemptMap.set(key, attempt);
      const bucket = historyMap.get(key) || [];
      bucket.push(attempt);
      historyMap.set(key, bucket);
    }

    res.json({
      success: true,
      quizzes: quizzes.map((quiz) => buildStudentQuizSummary(quiz, attemptMap.get(quiz._id.toString()) || null, historyMap.get(quiz._id.toString()) || [])),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizDetails = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const quiz = await Quiz.findById(req.params.quizId).populate("course", "courseTitle courseThumbnail").populate("educator", "name imageUrl email").lean();
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    if (!canAccessQuiz(quiz, user) && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Enrollment required" });
    }

    const attempts = await QuizAttempt.find({ quiz: quiz._id, student: user._id }).sort({ attemptNumber: -1 }).lean();
    const latestAttempt = attempts[0] || null;
    res.json({
      success: true,
      quiz: {
        ...quiz,
        attemptSummary: summarizeQuizAttempt(attempts[0] || null),
        history: attempts.map((attempt) => summarizeQuizAttempt(attempt)),
        latestResponses: latestAttempt?.responses || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startQuizAttempt = async (req, res) => {
  try {
    const { userId } = req.auth();
    const student = await User.findOne({ clerkUserId: userId });
    if (!student) return res.status(404).json({ success: false, message: "User not found" });

    const quiz = await Quiz.findById(req.params.quizId).populate("course", "courseTitle");
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    if (!canAccessQuiz(quiz, student) && student.role !== "admin") return res.status(403).json({ success: false, message: "Enrollment required" });

    const existingAttempts = await QuizAttempt.countDocuments({ quiz: quiz._id, student: student._id, status: { $in: ["submitted", "graded", "needs_review", "expired"] } });
    if (!canAttemptQuiz(quiz, existingAttempts)) {
      return res.status(409).json({ success: false, message: "Attempt limit reached" });
    }

    const inProgress = await QuizAttempt.findOne({ quiz: quiz._id, student: student._id, status: "in_progress" }).sort({ attemptNumber: -1 });
    if (inProgress) {
      return res.json({ success: true, attempt: summarizeQuizAttempt(inProgress) });
    }

    const attemptNumber = existingAttempts + 1;
    const startedAt = new Date();
    const expiresAt = computeQuizExpiresAt(startedAt, quiz.timeLimitMinutes);

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      course: quiz.course._id,
      student: student._id,
      educator: quiz.educator,
      attemptNumber,
      status: "in_progress",
      startedAt,
      expiresAt,
      reviewMode: quiz.reviewMode,
      instantEvaluation: quiz.instantEvaluation,
      historySnapshot: { title: quiz.title, totalPoints: quiz.totalPoints, passingScore: quiz.passingScore },
    });

    res.json({ success: true, attempt: summarizeQuizAttempt(attempt) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuizAttempt = async (req, res) => {
  try {
    const { userId } = req.auth();
    const student = await User.findOne({ clerkUserId: userId });
    if (!student) return res.status(404).json({ success: false, message: "User not found" });

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    if (!student.enrolledCourses?.some((courseId) => courseId.toString() === getId(quiz.course)) && student.role !== "admin") {
      return res.status(403).json({ success: false, message: "Enrollment required" });
    }

    const attempt = await QuizAttempt.findOne({ quiz: quiz._id, student: student._id, status: "in_progress" }).sort({ attemptNumber: -1 });
    if (!attempt) {
      return res.status(404).json({ success: false, message: "Start an attempt before submitting" });
    }

    const payload = parsePayload(req.body.quizResponse, req.body);
    const evaluation = evaluateQuizAttempt({ quiz, responses: payload.responses || [] });
    const submittedAt = new Date();
    const timeSpentSeconds = attempt.startedAt ? Math.max(0, Math.round((submittedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000)) : 0;
    const isExpired = attempt.expiresAt ? submittedAt.getTime() > new Date(attempt.expiresAt).getTime() : false;
    const finalStatus = evaluation.needsReview ? "needs_review" : "graded";

    Object.assign(attempt, {
      status: isExpired ? "expired" : finalStatus,
      submittedAt,
      timeSpentSeconds,
      totalScore: evaluation.totalScore,
      maxScore: evaluation.maxScore,
      percentage: evaluation.percentage,
      passed: evaluation.passed,
      responses: evaluation.evaluatedResponses,
      gradedAt: isExpired ? null : new Date(),
    });

    await attempt.save();
    await Quiz.findByIdAndUpdate(quiz._id, { $inc: { attemptCount: 1, passCount: evaluation.passed ? 1 : 0 } });

    res.json({ success: true, attempt: summarizeQuizAttempt(attempt), reviewMode: quiz.reviewMode, instantEvaluation: quiz.instantEvaluation, responses: evaluation.evaluatedResponses });

    // ── Notification: quiz result ──────────────────────────────────
    notifyQuizResult(student._id, quiz._id, quiz.title, evaluation.passed, evaluation.percentage);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizHistory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const student = await User.findOne({ clerkUserId: userId });
    if (!student) return res.status(404).json({ success: false, message: "User not found" });

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

    const attempts = await QuizAttempt.find({ quiz: quiz._id, student: student._id }).sort({ attemptNumber: -1 }).lean();
    res.json({ success: true, attempts: attempts.map((attempt) => summarizeQuizAttempt(attempt)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizAttemptsForEducator = async (req, res) => {
  try {
    const { educator } = await getEducator(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
    if (quiz.educator.toString() !== educator._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });

    const attempts = await QuizAttempt.find({ quiz: quiz._id }).populate("student", "name email imageUrl").sort({ updatedAt: -1 }).lean();
    res.json({
      success: true,
      attempts: attempts.map((attempt) => ({
        ...attempt,
        summary: summarizeQuizAttempt(attempt),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewQuizAttempt = async (req, res) => {
  try {
    const { educator } = await getEducator(req);
    if (!educator) return res.status(404).json({ success: false, message: "Educator not found" });

    const attempt = await QuizAttempt.findById(req.params.attemptId).populate("quiz");
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });
    if (attempt.educator.toString() !== educator._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });

    const reviewData = parsePayload(req.body.reviewData, req.body);
    attempt.status = reviewData.status || "graded";
    attempt.totalScore = Number(reviewData.totalScore ?? attempt.totalScore);
    attempt.maxScore = Number(reviewData.maxScore ?? attempt.maxScore);
    attempt.percentage = attempt.maxScore > 0 ? Math.round((attempt.totalScore / attempt.maxScore) * 100) : 0;
    attempt.passed = reviewData.passed ?? attempt.percentage >= Number(attempt.quiz?.passingScore || 70);
    attempt.gradedAt = new Date();
    attempt.reviewedBy = educator._id;
    attempt.responses = Array.isArray(reviewData.responses) && reviewData.responses.length ? reviewData.responses : attempt.responses;
    await attempt.save();

    res.json({ success: true, attempt: summarizeQuizAttempt(attempt) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
