import crypto from "crypto";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Quiz from "../models/Quiz.js";
import Assignment from "../models/Assignment.js";
import AIUsageLog from "../models/AIUsageLog.js";
import { decryptKey } from "../utils/encryption.js";
import {
  generateCourseStructure,
  generateLessonContent,
  generateQuizQuestions,
  generateAssignmentDetails,
  generateFromPdfText,
  generateFromYouTubeTranscript,
  retryWithBackoff,
} from "../services/aiService.js";

const logUsage = async (user, feature, model, status, inputLength = 0, outputLength = 0, errorMessage = "") => {
  try {
    if (!user?._id) return;
    await AIUsageLog.create({ user: user._id, feature, model, status, inputLength, outputLength, errorMessage });
  } catch { /* never break primary flow */ }
};

const getUser = (req) => req.user; // injected by protectEducatorRoutes

// Validate and sanitize a generated course draft
const validateDraft = (draft) => {
  if (!draft || typeof draft !== "object") throw new Error("AI returned an invalid course structure.");
  if (!draft.courseTitle || typeof draft.courseTitle !== "string") throw new Error("Missing courseTitle in AI response.");
  if (!Array.isArray(draft.modules) || draft.modules.length === 0) throw new Error("No modules in AI response.");
  draft.modules.forEach((mod, mi) => {
    if (!mod.moduleTitle) throw new Error(`Module ${mi + 1} is missing a title.`);
    if (!Array.isArray(mod.lessons) || mod.lessons.length === 0) throw new Error(`Module ${mi + 1} has no lessons.`);
  });
  return draft;
};

// ─────────────────────────────────────────────────────────────
//  POST /api/ai/course/generate
// ─────────────────────────────────────────────────────────────
export const generateCourse = async (req, res) => {
  const user = getUser(req);
  const {
    topic, level = "Beginner", numModules = 3, lessonsPerModule = 3,
    targetAudience = "", instructions = "", model = "gemini-3.5-flash",
  } = req.body || {};

  if (!topic || !String(topic).trim()) {
    return res.status(400).json({ success: false, message: "Topic is required." });
  }

  const userApiKey = decryptKey(user?.encryptedGeminiKey);

  try {
    const draft = await retryWithBackoff(
      () => generateCourseStructure({
        topic: String(topic).slice(0, 200),
        level,
        numModules: Math.min(Math.max(Number(numModules) || 3, 1), 10),
        lessonsPerModule: Math.min(Math.max(Number(lessonsPerModule) || 3, 1), 8),
        targetAudience: String(targetAudience || "").slice(0, 500),
        instructions: String(instructions || "").slice(0, 1000),
        model,
        userApiKey,
      }),
      1
    );

    const validated = validateDraft(draft);
    await logUsage(user, "ai_course_generate", model, "success", String(topic).length, JSON.stringify(validated).length);
    return res.json({ success: true, draft: validated });
  } catch (err) {
    await logUsage(user, "ai_course_generate", model, "error", String(topic).length, 0, err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/ai/course/from-pdf
// ─────────────────────────────────────────────────────────────
export const generateCourseFromPdf = async (req, res) => {
  const user = getUser(req);
  const { pdfText, numModules = 3, lessonsPerModule = 3, level = "Beginner", targetAudience = "", model = "gemini-3.5-flash" } = req.body || {};

  if (!pdfText || !String(pdfText).trim()) {
    return res.status(400).json({ success: false, message: "PDF text is required." });
  }

  const userApiKey = decryptKey(user?.encryptedGeminiKey);

  try {
    const draft = await retryWithBackoff(
      () => generateFromPdfText({ pdfText, numModules: Math.min(Number(numModules) || 3, 8), lessonsPerModule: Math.min(Number(lessonsPerModule) || 3, 6), level, targetAudience, model, userApiKey }),
      1
    );
    const validated = validateDraft(draft);
    await logUsage(user, "ai_course_from_pdf", model, "success", String(pdfText).length, JSON.stringify(validated).length);
    return res.json({ success: true, draft: validated });
  } catch (err) {
    await logUsage(user, "ai_course_from_pdf", model, "error", String(pdfText).length, 0, err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/ai/lesson/generate
// ─────────────────────────────────────────────────────────────
export const generateLesson = async (req, res) => {
  const user = getUser(req);
  const { courseTitle, moduleTitle, lessonTitle, level, action = "generate", existingContent = "", model = "gemini-3.5-flash" } = req.body || {};

  if (!lessonTitle) return res.status(400).json({ success: false, message: "lessonTitle is required." });

  const userApiKey = decryptKey(user?.encryptedGeminiKey);

  try {
    const result = await retryWithBackoff(
      () => generateLessonContent({ courseTitle, moduleTitle, lessonTitle, level, action, existingContent: String(existingContent).slice(0, 5000), model, userApiKey }),
      1
    );
    await logUsage(user, "ai_lesson_generate", model, "success", lessonTitle.length, JSON.stringify(result).length);
    return res.json({ success: true, lesson: result });
  } catch (err) {
    await logUsage(user, "ai_lesson_generate", model, "error", lessonTitle.length, 0, err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/ai/lesson/from-youtube
// ─────────────────────────────────────────────────────────────
export const generateLessonFromYoutube = async (req, res) => {
  const user = getUser(req);
  const { transcript, videoTitle = "", model = "gemini-3.5-flash" } = req.body || {};

  if (!transcript || !String(transcript).trim()) {
    return res.status(400).json({ success: false, message: "Transcript text is required." });
  }

  const userApiKey = decryptKey(user?.encryptedGeminiKey);

  try {
    const result = await retryWithBackoff(
      () => generateFromYouTubeTranscript({ transcript, videoTitle, model, userApiKey }),
      1
    );
    await logUsage(user, "ai_lesson_youtube", model, "success", String(transcript).length, JSON.stringify(result).length);
    return res.json({ success: true, lesson: result });
  } catch (err) {
    await logUsage(user, "ai_lesson_youtube", model, "error", String(transcript).length, 0, err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/ai/quiz/generate
// ─────────────────────────────────────────────────────────────
export const generateQuiz = async (req, res) => {
  const user = getUser(req);
  const { topic, courseTitle, lessonTitle, numQuestions = 5, difficulty = "medium", level = "Beginner", model = "gemini-3.5-flash" } = req.body || {};

  if (!topic) return res.status(400).json({ success: false, message: "topic is required." });

  const userApiKey = decryptKey(user?.encryptedGeminiKey);

  try {
    const result = await retryWithBackoff(
      () => generateQuizQuestions({ topic, courseTitle, lessonTitle, numQuestions: Math.min(Number(numQuestions) || 5, 20), difficulty, level, model, userApiKey }),
      1
    );
    await logUsage(user, "ai_quiz_generate", model, "success", topic.length, JSON.stringify(result).length);
    return res.json({ success: true, quiz: result });
  } catch (err) {
    await logUsage(user, "ai_quiz_generate", model, "error", topic.length, 0, err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/ai/assignment/generate
// ─────────────────────────────────────────────────────────────
export const generateAssignment = async (req, res) => {
  const user = getUser(req);
  const { topic, courseTitle, moduleTitle, level = "Beginner", model = "gemini-3.5-flash" } = req.body || {};

  if (!topic) return res.status(400).json({ success: false, message: "topic is required." });

  const userApiKey = decryptKey(user?.encryptedGeminiKey);

  try {
    const result = await retryWithBackoff(
      () => generateAssignmentDetails({ topic, courseTitle, moduleTitle, level, model, userApiKey }),
      1
    );
    await logUsage(user, "ai_assignment_generate", model, "success", topic.length, JSON.stringify(result).length);
    return res.json({ success: true, assignment: result });
  } catch (err) {
    await logUsage(user, "ai_assignment_generate", model, "error", topic.length, 0, err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/ai/course/save-draft
//  Saves validated AI draft → real DB records (all in draft/unpublished state)
// ─────────────────────────────────────────────────────────────
export const saveDraftCourse = async (req, res) => {
  const user = getUser(req);
  const { draft } = req.body || {};

  if (!draft) return res.status(400).json({ success: false, message: "Draft data is required." });

  try {
    validateDraft(draft);
  
    // 1. Create the Course document (unpublished, draft)
    const course = await Course.create({
      courseTitle: String(draft.courseTitle || "Untitled Course").slice(0, 200),
      courseDescription: String(draft.courseDescription || "").slice(0, 5000),
      category: String(draft.category || "Other"),
      courseFeatures: Array.isArray(draft.courseFeatures) ? draft.courseFeatures.slice(0, 20) : [],
      coursePrice: 0,
      discount: 0,
      isPublished: false,
      educator: user._id,
      generatedByAI: true,
      aiGenerationStatus: "draft",
      aiGeneratedAt: new Date(),
      prerequisites: Array.isArray(draft.prerequisites) ? draft.prerequisites : [],
      learningObjectives: Array.isArray(draft.learningObjectives) ? draft.learningObjectives : [],
    });

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // 2. Create Modules, Lessons, Quizzes, Assignments
    const savedModuleIds = [];

    for (let mi = 0; mi < draft.modules.length; mi++) {
      const modData = draft.modules[mi];

      const moduleDoc = await Module.create({
        moduleId: crypto.randomUUID(),
        moduleTitle: String(modData.moduleTitle || `Module ${mi + 1}`).slice(0, 200),
        moduleOrder: mi + 1,
        course: course._id,
        lessons: [],
      });

    const savedLessonIds = [];

    for (let li = 0; li < (modData.lessons || []).length; li++) {
      const lessonData = modData.lessons[li];
      const lessonDoc = await Lesson.create({
        lessonId: crypto.randomUUID(),
        lessonTitle: String(lessonData.lessonTitle || `Lesson ${li + 1}`).slice(0, 200),
        lessonType: "rich_text",
        lessonRichTextContent: String(lessonData.lessonContent || "").slice(0, 50000),
        lessonTranscriptPlaceholder: String(lessonData.lessonSummary || ""),
        lessonDuration: Number(lessonData.estimatedMinutes || 15),
        lessonOrder: li + 1,
        lessonStatus: "draft",
        course: course._id,
        module: moduleDoc._id,
      });
      savedLessonIds.push(lessonDoc._id);
    }

    // Update module with lesson refs
    moduleDoc.lessons = savedLessonIds;
    await moduleDoc.save();

    // Create Quiz for this module
    if (modData.quiz && Array.isArray(modData.quiz.questions) && modData.quiz.questions.length > 0) {
      const questions = modData.quiz.questions.map((q, qi) => ({
        questionId: crypto.randomUUID(),
        prompt: String(q.prompt || "").slice(0, 1000),
        questionType: "mcq",
        options: Array.isArray(q.options) ? q.options.map((o) => ({
          optionId: o.optionId || String(qi),
          label: String(o.label || ""),
          isCorrect: Boolean(o.isCorrect),
        })) : [],
        explanation: String(q.explanation || ""),
        points: Number(q.points || 1),
        order: qi + 1,
      }));

      await Quiz.create({
        title: String(modData.quiz.title || `Module ${mi + 1} Quiz`).slice(0, 200),
        description: String(modData.quiz.description || ""),
        course: course._id,
        module: moduleDoc._id,
        educator: user._id,
        status: "draft",
        questions,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
      });
    }

    // Create Assignment for this module
    if (modData.assignment) {
      const rubric = Array.isArray(modData.assignment.rubric)
        ? modData.assignment.rubric.map((r) => ({
            rubricId: r.rubricId || crypto.randomUUID(),
            title: String(r.title || "").slice(0, 200),
            description: String(r.description || ""),
            maxScore: Number(r.maxScore || 25),
            order: Number(r.order || 1),
          }))
        : [];

      await Assignment.create({
        title: String(modData.assignment.title || `Module ${mi + 1} Assignment`).slice(0, 200),
        description: String(modData.assignment.description || ""),
        instructions: String(modData.assignment.instructions || "").slice(0, 20000),
        course: course._id,
        module: moduleDoc._id,
        educator: user._id,
        status: "draft",
        dueDate,
        rubric,
        totalPoints: Number(modData.assignment.totalPoints || 100),
      });
    }

    savedModuleIds.push(moduleDoc._id);
  }

  // Create Final Assessment quiz if present
  if (draft.finalAssessment && Array.isArray(draft.finalAssessment.questions) && draft.finalAssessment.questions.length > 0) {
    const faQuestions = draft.finalAssessment.questions.map((q, qi) => ({
      questionId: crypto.randomUUID(),
      prompt: String(q.prompt || "").slice(0, 1000),
      questionType: "mcq",
      options: Array.isArray(q.options) ? q.options.map((o) => ({
        optionId: o.optionId || String(qi),
        label: String(o.label || ""),
        isCorrect: Boolean(o.isCorrect),
      })) : [],
      explanation: String(q.explanation || ""),
      points: Number(q.points || 1),
      order: qi + 1,
    }));

    await Quiz.create({
      title: String(draft.finalAssessment.title || "Final Assessment").slice(0, 200),
      description: String(draft.finalAssessment.description || "Comprehensive assessment covering all course topics."),
      course: course._id,
      educator: user._id,
      status: "draft",
      questions: faQuestions,
      totalPoints: faQuestions.reduce((sum, q) => sum + q.points, 0),
      passingScore: 70,
    });
  }

  // Update course with module refs
  course.modules = savedModuleIds;
  await course.save();

  await logUsage(user, "ai_course_save_draft", "", "success", JSON.stringify(draft).length, 0);

    return res.status(201).json({
      success: true,
      message: "Course draft saved successfully. You can now review and publish it.",
      courseId: course._id,
      courseTitle: course.courseTitle,
      modulesCreated: savedModuleIds.length,
    });
  } catch (err) {
    console.error("Save Draft Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to save draft." });
  }
};
