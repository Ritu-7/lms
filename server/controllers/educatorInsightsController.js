import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import { decryptKey } from "../utils/encryption.js";
import AIUsageLog from "../models/AIUsageLog.js";

/**
 * GET /api/admin/educator-insights/:educatorId
 * Builds a rich data profile for a single educator from real MongoDB data,
 * then asks Gemini AI to generate performance insights and recommendations.
 */
export const getEducatorInsights = async (req, res, next) => {
  try {
    const { educatorId } = req.params;
    const adminUser = req.user;

    if (!mongoose.Types.ObjectId.isValid(educatorId)) {
      return res.status(400).json({ success: false, message: "Invalid educator ID." });
    }

    const userApiKey = decryptKey(adminUser.encryptedGeminiKey);
    if (!userApiKey) {
      return res.status(403).json({ success: false, message: "No Gemini API key configured. Add one in Settings → AI." });
    }

    // ── 1. Load educator ──────────────────────────────────────────────────
    const educator = await User.findById(educatorId).lean();
    if (!educator || educator.role !== "educator") {
      return res.status(404).json({ success: false, message: "Educator not found." });
    }

    // ── 2. Load all their courses ─────────────────────────────────────────
    const courses = await Course.find({ educator: educator._id }).lean();
    if (courses.length === 0) {
      return res.json({
        success: true,
        data: {
          educatorName: educator.name,
          totalCourses: 0,
          insights: null,
          summary: {
            totalCourses: 0,
            totalEnrollments: 0,
            avgRating: null,
            avgCompletionRate: null,
            avgQuizScore: null,
            avgAssignmentScore: null,
          },
          noCoursesMessage: "This educator has not created any courses yet.",
        },
      });
    }

    const courseIds = courses.map((c) => c._id);
    const courseIdStrings = courses.map((c) => c._id.toString());

    // ── 3. Gather progress, quiz, assignment data in parallel ─────────────
    const [allProgress, allQuizAttempts, allAssignmentSubs] = await Promise.all([
      CourseProgress.find({ courseId: { $in: courseIdStrings } }).lean(),
      QuizAttempt.find({ course: { $in: courseIds } }).lean(),
      AssignmentSubmission.find({ course: { $in: courseIds } }).lean(),
    ]);

    // ── 4. Build per-course metrics ───────────────────────────────────────
    const courseMetrics = courses.map((course) => {
      const courseIdStr = course._id.toString();
      const enrolledCount = (course.studentsEnrolled || []).length;

      // Ratings
      const ratings = (course.courseRatings || []).map((r) => r.rating).filter(Boolean);
      const avgRating = ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null;

      // Total lectures
      const chapters = course.courseContent || [];
      const totalLectures = chapters.reduce((s, ch) => s + (ch.chapterContent || []).length, 0);
      const publishedLectures = chapters.reduce(
        (s, ch) => s + (ch.chapterContent || []).filter((l) => l.lectureStatus === "published").length,
        0
      );

      // Completion rate (students with >0 completed lessons / enrolled)
      const progressForCourse = allProgress.filter((p) => p.courseId === courseIdStr);
      const studentsWithProgress = progressForCourse.filter(
        (p) => (p.completedLessons?.length || p.completedLectures?.length || 0) > 0
      ).length;
      const completionRate = enrolledCount > 0
        ? Math.round((studentsWithProgress / enrolledCount) * 100)
        : 0;

      // Quiz performance
      const quizzes = allQuizAttempts.filter((q) => q.course.toString() === courseIdStr);
      const avgQuizScore = quizzes.length > 0
        ? Math.round(quizzes.reduce((s, q) => s + (q.percentage || 0), 0) / quizzes.length)
        : null;
      const quizPassRate = quizzes.length > 0
        ? Math.round((quizzes.filter((q) => q.passed).length / quizzes.length) * 100)
        : null;

      // Assignment performance
      const assignments = allAssignmentSubs.filter(
        (a) => a.course.toString() === courseIdStr && a.maxScore > 0 && a.status !== "not_submitted"
      );
      const avgAssignmentScore = assignments.length > 0
        ? Math.round(assignments.reduce((s, a) => s + (a.totalScore / a.maxScore) * 100, 0) / assignments.length)
        : null;
      const lateSubmissions = assignments.filter((a) => a.isLate).length;

      return {
        courseTitle: course.courseTitle || "Untitled",
        category: course.category || "Uncategorized",
        isPublished: course.isPublished,
        enrolledCount,
        avgRating,
        ratingCount: ratings.length,
        totalLectures,
        publishedLectures,
        completionRate,
        avgQuizScore,
        quizPassRate,
        avgAssignmentScore,
        lateSubmissions,
        createdAt: course.createdAt,
      };
    });

    // ── 5. Aggregate educator-level summary ───────────────────────────────
    const totalEnrollments = courseMetrics.reduce((s, c) => s + c.enrolledCount, 0);
    const coursesWithRatings = courseMetrics.filter((c) => c.avgRating !== null);
    const avgRating = coursesWithRatings.length > 0
      ? Math.round((coursesWithRatings.reduce((s, c) => s + c.avgRating, 0) / coursesWithRatings.length) * 10) / 10
      : null;
    const avgCompletionRate = courseMetrics.length > 0
      ? Math.round(courseMetrics.reduce((s, c) => s + c.completionRate, 0) / courseMetrics.length)
      : null;
    const coursesWithQuiz = courseMetrics.filter((c) => c.avgQuizScore !== null);
    const avgQuizScore = coursesWithQuiz.length > 0
      ? Math.round(coursesWithQuiz.reduce((s, c) => s + c.avgQuizScore, 0) / coursesWithQuiz.length)
      : null;
    const coursesWithAssignment = courseMetrics.filter((c) => c.avgAssignmentScore !== null);
    const avgAssignmentScore = coursesWithAssignment.length > 0
      ? Math.round(coursesWithAssignment.reduce((s, c) => s + c.avgAssignmentScore, 0) / coursesWithAssignment.length)
      : null;

    const summary = {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.isPublished).length,
      totalEnrollments,
      avgRating,
      avgCompletionRate,
      avgQuizScore,
      avgAssignmentScore,
    };

    // ── 6. Build AI prompt payload ────────────────────────────────────────
    const promptPayload = {
      educator: { name: educator.name, email: educator.email },
      summary,
      courses: courseMetrics,
    };

    const systemPrompt = `You are an expert LMS analytics AI for platform administrators.
Analyze the provided educator performance data and generate actionable insights.

Return ONLY valid JSON with this exact structure:
{
  "overallAssessment": "1–2 sentence high-level assessment of this educator's performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2"],
  "coursesNeedingAttention": [
    { "courseTitle": "...", "issue": "brief reason why this course needs attention" }
  ],
  "recommendations": [
    { "title": "short action title", "detail": "specific actionable advice for the admin" }
  ],
  "performanceRating": "Excellent" | "Good" | "Needs Improvement" | "Critical"
}

Guidelines:
- coursesNeedingAttention: only include courses with real data problems (low completion, failing quizzes, 0 enrollments on published courses, etc.). Can be empty array if all courses are healthy.
- recommendations: 2–4 specific, practical suggestions for the admin to act on.
- Base ALL analysis strictly on the provided numbers. Do not invent data.`;

    // ── 7. Call Gemini ────────────────────────────────────────────────────
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: userApiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: JSON.stringify(promptPayload),
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    let responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("No response from AI");

    // Strip markdown code fences if present
    responseText = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    const aiInsights = JSON.parse(responseText);

    // ── 8. Log usage ──────────────────────────────────────────────────────
    await AIUsageLog.create({
      user: adminUser._id,
      feature: "educator_insights",
      model: "gemini-3.6-flash",
      status: "success",
      inputLength: JSON.stringify(promptPayload).length,
      outputLength: responseText.length,
      title: `Educator Insights: ${educator.name}`,
    });

    res.json({
      success: true,
      data: {
        educatorName: educator.name,
        educatorEmail: educator.email,
        summary,
        courseMetrics,
        insights: aiInsights,
      },
    });
  } catch (error) {
    // Log error usage if possible
    if (req.user) {
      await AIUsageLog.create({
        user: req.user._id,
        feature: "educator_insights",
        model: "gemini-3.6-flash",
        status: "error",
        errorMessage: error.message,
        title: "Educator Insights",
      }).catch(() => {});
    }
    next(error);
  }
};
