import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import CourseProgress from "../models/CourseProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import { decryptKey } from "../utils/encryption.js";
import { GoogleGenAI } from "@google/genai";

// ─────────────────────────────────────────────────────────────────
//  In-Memory TTL Cache (30-minute window per admin + dateRange)
// ─────────────────────────────────────────────────────────────────
const insightsCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getCached = (key) => {
  const entry = insightsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    insightsCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  insightsCache.set(key, { data, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (insightsCache.size > 50) {
    const oldestKey = insightsCache.keys().next().value;
    insightsCache.delete(oldestKey);
  }
};

// ─────────────────────────────────────────────────────────────────
//  Date Range Helpers
// ─────────────────────────────────────────────────────────────────
const getDateRange = (range) => {
  const now = new Date();
  const from = new Date(now);
  switch (range) {
    case "30d":
      from.setDate(now.getDate() - 30);
      break;
    case "90d":
      from.setDate(now.getDate() - 90);
      break;
    case "6m":
    default:
      from.setMonth(now.getMonth() - 6);
      break;
  }
  return { from, to: now };
};

const getMonthlyBuckets = (from, to) => {
  const buckets = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    buckets.push({
      label: cursor.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      from: new Date(cursor),
      to: new Date(next),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
};

// ─────────────────────────────────────────────────────────────────
//  Data Aggregation
// ─────────────────────────────────────────────────────────────────
const aggregatePlatformMetrics = async (from, to) => {
  const [
    newStudents,
    newEducators,
    suspendedUsers,
    purchasesInRange,
    allCourses,
    courseProgressDocs,
    quizAttempts,
    assignmentSubmissions,
  ] = await Promise.all([
    // New student signups in range
    User.countDocuments({ role: "student", createdAt: { $gte: from, $lte: to } }),

    // New educator signups in range
    User.countDocuments({ role: "educator", createdAt: { $gte: from, $lte: to } }),

    // Suspended accounts
    User.countDocuments({ status: "suspended" }),

    // Purchases in range
    Purchase.find({ createdAt: { $gte: from, $lte: to } })
      .populate("course", "courseTitle category")
      .lean(),

    // All published courses for completion rate computation
    Course.find({ isPublished: true }).select("courseTitle studentsEnrolled courseContent").lean(),

    // All course progress documents
    CourseProgress.find({ updatedAt: { $gte: from, $lte: to } }).lean(),

    // Quiz attempts in range
    QuizAttempt.aggregate([
      { $match: { submittedAt: { $gte: from, $lte: to }, status: { $in: ["submitted", "graded"] } } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          totalPassed: { $sum: { $cond: ["$passed", 1, 0] } },
          avgPercentage: { $avg: "$percentage" },
        },
      },
    ]),

    // Assignment submission stats in range
    AssignmentSubmission.aggregate([
      { $match: { updatedAt: { $gte: from, $lte: to }, status: { $ne: "not_submitted" } } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          totalGraded: { $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] } },
          avgScore: { $avg: { $cond: [{ $gt: ["$maxScore", 0] }, { $divide: ["$totalScore", "$maxScore"] }, null] } },
        },
      },
    ]),
  ]);

  // Revenue breakdown
  const completedPurchases = purchasesInRange.filter((p) =>
    ["completed", "success", "paid"].includes(p.status)
  );
  const totalRevenue = completedPurchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalEnrollments = completedPurchases.length;
  const failedPayments = purchasesInRange.filter((p) => p.status === "failed").length;

  // Revenue by course (top 5)
  const revByCourse = {};
  completedPurchases.forEach((p) => {
    const title = p.course?.courseTitle || "Unknown";
    revByCourse[title] = (revByCourse[title] || 0) + Number(p.amount || 0);
  });
  const topCoursesByRevenue = Object.entries(revByCourse)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, rev]) => ({ name, revenue: rev.toFixed(2) }));

  // Monthly enrollment trend
  const buckets = getMonthlyBuckets(from, to);
  const enrollmentByMonth = buckets.map((bucket) => ({
    month: bucket.label,
    enrollments: completedPurchases.filter(
      (p) => new Date(p.createdAt) >= bucket.from && new Date(p.createdAt) < bucket.to
    ).length,
  }));

  // Course completion rate (approximate)
  const courseCompletionStats = allCourses.slice(0, 10).map((course) => {
    const totalLessons = (course.courseContent || []).reduce(
      (sum, ch) => sum + (ch.chapterContent || []).length,
      0
    );
    const enrolledCount = (course.studentsEnrolled || []).length;
    const progressDocs = courseProgressDocs.filter(
      (doc) => doc.courseId === course._id.toString()
    );
    const completedCount = progressDocs.filter(
      (doc) => totalLessons > 0 && (doc.completedLessons || []).length >= totalLessons
    ).length;
    const completionRate =
      enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0;
    return {
      course: course.courseTitle,
      enrolled: enrolledCount,
      completionRate: `${completionRate}%`,
    };
  });

  // Quiz stats
  const quizStats = quizAttempts[0] || { totalAttempts: 0, totalPassed: 0, avgPercentage: 0 };
  const quizPassRate =
    quizStats.totalAttempts > 0
      ? Math.round((quizStats.totalPassed / quizStats.totalAttempts) * 100)
      : 0;

  // Assignment stats
  const assignStats = assignmentSubmissions[0] || {
    totalSubmissions: 0,
    totalGraded: 0,
    avgScore: 0,
  };
  const gradingRate =
    assignStats.totalSubmissions > 0
      ? Math.round((assignStats.totalGraded / assignStats.totalSubmissions) * 100)
      : 0;

  return {
    period: { from: from.toISOString(), to: to.toISOString() },
    users: {
      newStudents,
      newEducators,
      suspendedAccounts: suspendedUsers,
    },
    revenue: {
      total: totalRevenue.toFixed(2),
      enrollments: totalEnrollments,
      failedPayments,
      topCoursesByRevenue,
      enrollmentByMonth,
    },
    courseCompletion: courseCompletionStats,
    quizPerformance: {
      totalAttempts: quizStats.totalAttempts,
      passRate: `${quizPassRate}%`,
      avgScore: `${Math.round(quizStats.avgPercentage || 0)}%`,
    },
    assignments: {
      totalSubmissions: assignStats.totalSubmissions,
      gradingRate: `${gradingRate}%`,
      avgScore: assignStats.avgScore
        ? `${Math.round(assignStats.avgScore * 100)}%`
        : "N/A",
    },
  };
};

// ─────────────────────────────────────────────────────────────────
//  Prompt Builder
// ─────────────────────────────────────────────────────────────────
const buildInsightPrompt = (metrics, dateRange) => `
You are an expert learning platform analyst. Analyze the following real platform data for a LearnSphereAI LMS and generate structured insights.

ANALYSIS PERIOD: ${dateRange === "30d" ? "Last 30 days" : dateRange === "90d" ? "Last 90 days" : "Last 6 months"}

=== USER GROWTH ===
New Students: ${metrics.users.newStudents}
New Educators: ${metrics.users.newEducators}
Suspended Accounts: ${metrics.users.suspendedAccounts}

=== REVENUE & ENROLLMENTS ===
Total Revenue: $${metrics.revenue.total}
Total Enrollments: ${metrics.revenue.enrollments}
Failed Payments: ${metrics.revenue.failedPayments}
Top Courses by Revenue:
${metrics.revenue.topCoursesByRevenue.map((c) => `  - ${c.name}: $${c.revenue}`).join("\n") || "  No data"}

Monthly Enrollment Trend:
${metrics.revenue.enrollmentByMonth.map((m) => `  - ${m.month}: ${m.enrollments} enrollments`).join("\n") || "  No data"}

=== COURSE COMPLETION ===
${metrics.courseCompletion.map((c) => `  - "${c.course}": ${c.enrolled} enrolled, ${c.completionRate} completion`).join("\n") || "  No data"}

=== QUIZ PERFORMANCE ===
Total Attempts: ${metrics.quizPerformance.totalAttempts}
Pass Rate: ${metrics.quizPerformance.passRate}
Average Score: ${metrics.quizPerformance.avgScore}

=== ASSIGNMENT SUBMISSIONS ===
Total Submissions: ${metrics.assignments.totalSubmissions}
Grading Rate: ${metrics.assignments.gradingRate}
Average Score: ${metrics.assignments.avgScore}

---

Based on this data, provide actionable insights. Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence overview of platform health and key trends in this period",
  "anomalies": [
    { "title": "string", "detail": "string explaining what is unusual and why", "severity": "low|medium|high" }
  ],
  "recommendations": [
    { "title": "string", "action": "string — specific, actionable step the admin can take", "priority": "low|medium|high" }
  ],
  "dataInsufficient": false
}

Rules:
- If total enrollments < 5 AND total quiz attempts < 5 AND no revenue, set dataInsufficient to true and leave other arrays empty.
- Anomalies should flag real outliers: drops, spikes, high failure rates, low completion, ungraded assignments.
- Recommendations must be concrete (e.g. "Send a re-engagement email to students with 0% completion" not "improve engagement").
- Limit anomalies to max 4, recommendations to max 5.
- Do not invent data — base everything strictly on the numbers provided.
`.trim();

// ─────────────────────────────────────────────────────────────────
//  Controller
// ─────────────────────────────────────────────────────────────────
export const getAnalyticsInsights = async (req, res) => {
  try {
    const user = req.user;
    const { dateRange = "6m", bust = false } = req.body || {};

    // Validate dateRange
    const validRanges = ["30d", "90d", "6m"];
    const resolvedRange = validRanges.includes(dateRange) ? dateRange : "6m";

    // Check cache (skip if bust=true is explicitly sent)
    const cacheKey = `${user._id}:${resolvedRange}`;
    if (!bust) {
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }
    }

    // Resolve Gemini API key — admin's own key or server fallback
    const userApiKey = decryptKey(user.encryptedGeminiKey);
    const activeKey = userApiKey || process.env.GEMINI_API_KEY || "";

    if (!activeKey) {
      return res.status(403).json({
        success: false,
        message: "NO_API_KEY",
        detail: "No Gemini API key configured. Please add your key in Admin Settings.",
      });
    }

    // Aggregate metrics
    const { from, to } = getDateRange(resolvedRange);
    const metrics = await aggregatePlatformMetrics(from, to);

    // Build prompt and call Gemini
    const prompt = buildInsightPrompt(metrics, resolvedRange);

    const ai = new GoogleGenAI({ apiKey: activeKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction:
          "You are a precise analytics AI for an LMS admin dashboard. Output only valid JSON. Never add markdown fences.",
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    });

    // Extract text
    let rawText = "";
    if (response.text) {
      rawText = response.text;
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = response.candidates[0].content.parts[0].text;
    }

    // Parse JSON — strip fences if any
    const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      return res.status(502).json({
        success: false,
        message: "AI returned an unreadable response. Please try again.",
      });
    }

    // Normalise
    const result = {
      summary: parsed.summary || "",
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      dataInsufficient: !!parsed.dataInsufficient,
      generatedAt: new Date().toISOString(),
      dateRange: resolvedRange,
    };

    // Cache and return
    setCache(cacheKey, result);
    return res.json({ success: true, data: result, cached: false });
  } catch (error) {
    console.error("AI Insights error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI insights.",
    });
  }
};
