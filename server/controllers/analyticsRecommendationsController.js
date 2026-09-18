import User from "../models/User.js";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import CourseProgress from "../models/CourseProgress.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { decryptKey } from "../utils/encryption.js";
import { GoogleGenAI } from "@google/genai";

// ─────────────────────────────────────────────────────────────────
//  In-Memory TTL Cache (30-minute window, keyed by userId)
// ─────────────────────────────────────────────────────────────────
const recCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getCached = (key) => {
  const entry = recCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    recCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  recCache.set(key, { data, timestamp: Date.now() });
  if (recCache.size > 50) {
    const oldestKey = recCache.keys().next().value;
    recCache.delete(oldestKey);
  }
};

// ─────────────────────────────────────────────────────────────────
//  Helper — N days ago
// ─────────────────────────────────────────────────────────────────
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────
//  ENGAGEMENT Aggregation
//  - Inactive students (no CourseProgress update in 14d)
//  - Students with 0% progress enrolled > 7 days
//  - Quiz and assignment submission rates
// ─────────────────────────────────────────────────────────────────
const aggregateEngagement = async () => {
  const cutoff14d = daysAgo(14);
  const cutoff7d = daysAgo(7);

  const [
    totalActiveStudents,
    studentsWithRecentProgress,
    enrolledUsers,
    quizStats,
    assignmentStats,
  ] = await Promise.all([
    User.countDocuments({ role: "student", status: "active" }),

    // Students with any progress update in last 14 days
    CourseProgress.distinct("userId", { updatedAt: { $gte: cutoff14d } }),

    // All students enrolled in at least 1 course (via User.enrolledCourses)
    User.countDocuments({
      role: "student",
      status: "active",
      enrolledCourses: { $exists: true, $not: { $size: 0 } },
    }),

    // Submission rate proxy: quiz attempts in last 30d
    QuizAttempt.aggregate([
      { $match: { submittedAt: { $gte: daysAgo(30) } } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          uniqueStudents: { $addToSet: "$student" },
        },
      },
    ]),

    // Assignment submission rate in last 30d
    AssignmentSubmission.aggregate([
      {
        $match: {
          status: { $ne: "not_submitted" },
          updatedAt: { $gte: daysAgo(30) },
        },
      },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          uniqueStudents: { $addToSet: "$student" },
        },
      },
    ]),
  ]);

  const studentsWithRecentProgressCount = studentsWithRecentProgress.length;
  const inactiveCount = Math.max(
    0,
    totalActiveStudents - studentsWithRecentProgressCount
  );
  const inactiveRate =
    totalActiveStudents > 0
      ? Math.round((inactiveCount / totalActiveStudents) * 100)
      : 0;

  const quizData = quizStats[0] || { totalAttempts: 0, uniqueStudents: [] };
  const assignData = assignmentStats[0] || {
    totalSubmissions: 0,
    uniqueStudents: [],
  };

  const quizSubmittingStudents = quizData.uniqueStudents?.length || 0;
  const assignSubmittingStudents = assignData.uniqueStudents?.length || 0;

  return {
    totalActiveStudents,
    enrolledStudents: enrolledUsers,
    inactiveStudents_14d: inactiveCount,
    inactiveRate_pct: `${inactiveRate}%`,
    studentsActiveInProgress_14d: studentsWithRecentProgressCount,
    quizAttempts_30d: quizData.totalAttempts,
    studentsSubmittingQuizzes_30d: quizSubmittingStudents,
    quizParticipationRate_pct:
      totalActiveStudents > 0
        ? `${Math.round((quizSubmittingStudents / totalActiveStudents) * 100)}%`
        : "N/A",
    assignmentSubmissions_30d: assignData.totalSubmissions,
    studentsSubmittingAssignments_30d: assignSubmittingStudents,
    assignmentParticipationRate_pct:
      totalActiveStudents > 0
        ? `${Math.round(
            (assignSubmittingStudents / totalActiveStudents) * 100
          )}%`
        : "N/A",
    // Note: login frequency cannot be derived from existing collections (no lastLoginAt field)
    loginFrequency: "N/A — field not tracked in current schema",
  };
};

// ─────────────────────────────────────────────────────────────────
//  COMPLETION Aggregation
//  - Completion rate per course (top 10 by enrollment)
//  - Students with 0% progress (abandoned)
//  - Average lesson depth reached
// ─────────────────────────────────────────────────────────────────
const aggregateCompletion = async () => {
  const publishedCourses = await Course.find({ isPublished: true })
    .select("courseTitle category courseContent studentsEnrolled")
    .lean();

  // Sort by enrollment count descending, take top 10
  const sorted = publishedCourses
    .filter((c) => (c.studentsEnrolled || []).length > 0)
    .sort(
      (a, b) =>
        (b.studentsEnrolled || []).length - (a.studentsEnrolled || []).length
    )
    .slice(0, 10);

  const courseIds = sorted.map((c) => c._id.toString());

  const allProgressDocs = await CourseProgress.find({
    courseId: { $in: courseIds },
  }).lean();

  const progressByCourse = {};
  allProgressDocs.forEach((doc) => {
    if (!progressByCourse[doc.courseId]) progressByCourse[doc.courseId] = [];
    progressByCourse[doc.courseId].push(doc);
  });

  const courseStats = sorted.map((course) => {
    const totalLectures = (course.courseContent || []).reduce(
      (sum, ch) => sum + (ch.chapterContent || []).length,
      0
    );
    const enrolledCount = (course.studentsEnrolled || []).length;
    const docs = progressByCourse[course._id.toString()] || [];

    const fullyCompleted = docs.filter(
      (d) =>
        totalLectures > 0 &&
        (d.completedLectures || d.completedLessons || []).length >= totalLectures
    ).length;

    const zeroProgress = docs.filter(
      (d) =>
        (d.completedLectures || d.completedLessons || []).length === 0
    ).length;

    // Students enrolled but with no progress doc at all
    const noProgressDoc = enrolledCount - docs.length;

    const avgLessonsCompleted =
      docs.length > 0
        ? Math.round(
            docs.reduce(
              (sum, d) =>
                sum + (d.completedLectures || d.completedLessons || []).length,
              0
            ) / docs.length
          )
        : 0;

    const completionRate =
      enrolledCount > 0
        ? Math.round((fullyCompleted / enrolledCount) * 100)
        : 0;

    const abandonmentRate =
      enrolledCount > 0
        ? Math.round(((zeroProgress + noProgressDoc) / enrolledCount) * 100)
        : 0;

    return {
      course: course.courseTitle,
      category: course.category || "Uncategorized",
      enrolled: enrolledCount,
      totalLectures,
      completionRate_pct: `${completionRate}%`,
      abandonmentRate_pct: `${abandonmentRate}%`,
      avgLessonsCompleted,
      fullyCompletedStudents: fullyCompleted,
      studentsWithNoProgress: zeroProgress + noProgressDoc,
    };
  });

  const overall =
    courseStats.length > 0
      ? Math.round(
          courseStats.reduce(
            (sum, c) => sum + parseInt(c.completionRate_pct),
            0
          ) / courseStats.length
        )
      : 0;

  return {
    platformAvgCompletionRate_pct: `${overall}%`,
    coursesAnalyzed: courseStats.length,
    perCourse: courseStats,
  };
};

// ─────────────────────────────────────────────────────────────────
//  EDUCATOR PERFORMANCE Aggregation
//  - Grading turnaround (avg days submittedAt → gradedAt)
//  - Avg course rating per educator
//  - Enrollment → completion ratio per educator
//  - Stale courses (no new purchases in 60d, rating < 3.5)
// ─────────────────────────────────────────────────────────────────
const aggregateEducatorPerformance = async () => {
  const cutoff60d = daysAgo(60);

  // Grading turnaround for graded assignments
  const gradingTurnaround = await AssignmentSubmission.aggregate([
    {
      $match: {
        status: { $in: ["graded", "returned"] },
        submittedAt: { $ne: null },
        gradedAt: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$educator",
        avgTurnaroundMs: {
          $avg: { $subtract: ["$gradedAt", "$submittedAt"] },
        },
        gradedCount: { $sum: 1 },
        ungradedCount: { $sum: 0 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "educatorInfo",
      },
    },
    { $unwind: { path: "$educatorInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        educatorName: { $ifNull: ["$educatorInfo.name", "Unknown"] },
        avgTurnaroundDays: {
          $round: [
            { $divide: ["$avgTurnaroundMs", 1000 * 60 * 60 * 24] },
            1,
          ],
        },
        gradedCount: 1,
      },
    },
    { $sort: { avgTurnaroundDays: -1 } },
    { $limit: 10 },
  ]);

  // Ungraded submissions (pending grading)
  const ungradedCount = await AssignmentSubmission.countDocuments({
    status: { $in: ["submitted", "late_submitted"] },
  });

  // Educator course ratings + enrollment/completion
  const educatorCourses = await Course.find({ isPublished: true })
    .select("courseTitle educator courseRatings studentsEnrolled courseContent")
    .populate("educator", "name")
    .lean();

  const educatorMap = {};
  for (const course of educatorCourses) {
    const edId = course.educator?._id?.toString();
    const edName = course.educator?.name || "Unknown";
    if (!edId) continue;

    if (!educatorMap[edId]) {
      educatorMap[edId] = {
        name: edName,
        totalEnrolled: 0,
        totalRatings: 0,
        ratingSum: 0,
        courseCount: 0,
      };
    }

    const enrolled = (course.studentsEnrolled || []).length;
    const ratings = course.courseRatings || [];
    const ratingSum = ratings.reduce((s, r) => s + (r.rating || 0), 0);

    educatorMap[edId].totalEnrolled += enrolled;
    educatorMap[edId].totalRatings += ratings.length;
    educatorMap[edId].ratingSum += ratingSum;
    educatorMap[edId].courseCount += 1;
  }

  const educatorSummary = Object.values(educatorMap)
    .map((e) => ({
      name: e.name,
      courseCount: e.courseCount,
      totalEnrolled: e.totalEnrolled,
      avgRating:
        e.totalRatings > 0
          ? (e.ratingSum / e.totalRatings).toFixed(2)
          : "No ratings yet",
    }))
    .sort((a, b) => b.totalEnrolled - a.totalEnrolled)
    .slice(0, 8);

  // Stale courses: published, no purchases in 60d, avg rating < 3.5 (or no ratings)
  const recentPurchasedCourseIds = await Purchase.distinct("course", {
    createdAt: { $gte: cutoff60d },
    status: "completed",
  });

  const staleCourses = await Course.find({
    isPublished: true,
    _id: { $nin: recentPurchasedCourseIds },
  })
    .select("courseTitle category courseRatings educator updatedAt")
    .populate("educator", "name")
    .lean();

  const staleFiltered = staleCourses
    .map((c) => {
      const ratings = c.courseRatings || [];
      const avgRating =
        ratings.length > 0
          ? (ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length).toFixed(2)
          : null;
      return {
        title: c.courseTitle,
        educator: c.educator?.name || "Unknown",
        avgRating: avgRating || "No ratings",
        ratingCount: ratings.length,
        daysSinceUpdate: Math.floor(
          (Date.now() - new Date(c.updatedAt)) / (1000 * 60 * 60 * 24)
        ),
      };
    })
    .filter(
      (c) => c.avgRating === "No ratings" || parseFloat(c.avgRating) < 3.5
    )
    .slice(0, 5);

  return {
    ungradedAssignments: ungradedCount,
    gradingTurnaround: gradingTurnaround.map((g) => ({
      educator: g.educatorName,
      avgTurnaroundDays: g.avgTurnaroundDays,
      submissionsGraded: g.gradedCount,
    })),
    educatorSummary,
    staleOrLowRatedCourses: staleFiltered,
    staleCount: staleFiltered.length,
  };
};

// ─────────────────────────────────────────────────────────────────
//  GROWTH Aggregation
//  - Monthly enrollment trend (last 6 months)
//  - Category-level demand (enrollments by course category)
//  - Signup → paid conversion rate
//  - Revenue trend
// ─────────────────────────────────────────────────────────────────
const aggregateGrowth = async () => {
  const sixMonthsAgo = daysAgo(182);
  const now = new Date();

  // Monthly enrollment + revenue trend
  const monthlyTrend = await Purchase.aggregate([
    {
      $match: {
        status: "completed",
        createdAt: { $gte: sixMonthsAgo, $lte: now },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        enrollments: { $sum: 1 },
        revenue: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const formattedTrend = monthlyTrend.map((m) => ({
    month: `${MONTH_NAMES[m._id.month]} '${String(m._id.year).slice(-2)}`,
    enrollments: m.enrollments,
    revenue: m.revenue.toFixed(2),
  }));

  // Category demand: enrollments by course category
  const categoryDemand = await Purchase.aggregate([
    { $match: { status: "completed" } },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "courseData",
      },
    },
    { $unwind: { path: "$courseData", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$courseData.category", "Uncategorized"] },
        enrollments: { $sum: 1 },
        revenue: { $sum: "$amount" },
      },
    },
    { $sort: { enrollments: -1 } },
    { $limit: 10 },
  ]);

  // Signup → paid conversion
  const [totalStudents, studentsWithPurchase] = await Promise.all([
    User.countDocuments({ role: "student", status: "active" }),
    Purchase.distinct("user", { status: "completed" }),
  ]);

  const conversionRate =
    totalStudents > 0
      ? Math.round((studentsWithPurchase.length / totalStudents) * 100)
      : 0;

  // New signups in last 30d
  const newSignups30d = await User.countDocuments({
    role: "student",
    createdAt: { $gte: daysAgo(30) },
  });

  const newPaid30d = await Purchase.countDocuments({
    status: "completed",
    createdAt: { $gte: daysAgo(30) },
  });

  const recentConversionRate =
    newSignups30d > 0 ? Math.round((newPaid30d / newSignups30d) * 100) : 0;

  return {
    monthlyEnrollmentTrend: formattedTrend,
    categoryDemand: categoryDemand.map((c) => ({
      category: c._id,
      enrollments: c.enrollments,
      revenue: Number(c.revenue).toFixed(2),
    })),
    signupToPaidConversion_overall_pct: `${conversionRate}%`,
    signupToPaidConversion_last30d_pct: `${recentConversionRate}%`,
    newSignups_30d: newSignups30d,
    newPaidEnrollments_30d: newPaid30d,
    totalStudents,
    paidStudents: studentsWithPurchase.length,
  };
};

// ─────────────────────────────────────────────────────────────────
//  Sufficiency Check
//  Returns true if there is genuinely not enough data to generate
//  meaningful recommendations across all 4 categories.
// ─────────────────────────────────────────────────────────────────
const isDataInsufficient = (engagement, completion, educator, growth) => {
  const hasStudents = engagement.totalActiveStudents > 0;
  const hasCourses = completion.coursesAnalyzed > 0;
  const hasPurchases = growth.paidStudents > 0;
  return !hasStudents && !hasCourses && !hasPurchases;
};

// ─────────────────────────────────────────────────────────────────
//  Prompt Builder
// ─────────────────────────────────────────────────────────────────
const buildRecommendationPrompt = (engagement, completion, educator, growth) => `
You are an expert learning platform strategist. Analyze the following real data from a LearnSphere LMS and generate platform recommendations across 4 categories.

=== ENGAGEMENT ===
Total Active Students: ${engagement.totalActiveStudents}
Students Enrolled in Courses: ${engagement.enrolledStudents}
Inactive Students (14d no progress): ${engagement.inactiveStudents_14d}
Inactive Rate: ${engagement.inactiveRate_pct}
Students Active in Progress (14d): ${engagement.studentsActiveInProgress_14d}
Quiz Attempts (30d): ${engagement.quizAttempts_30d}
Students Submitting Quizzes (30d): ${engagement.studentsSubmittingQuizzes_30d}
Quiz Participation Rate: ${engagement.quizParticipationRate_pct}
Assignment Submissions (30d): ${engagement.assignmentSubmissions_30d}
Students Submitting Assignments (30d): ${engagement.studentsSubmittingAssignments_30d}
Assignment Participation Rate: ${engagement.assignmentParticipationRate_pct}
Login Frequency: ${engagement.loginFrequency}

=== COMPLETION (Top Courses by Enrollment) ===
Platform Avg Completion Rate: ${completion.platformAvgCompletionRate_pct}
Courses Analyzed: ${completion.coursesAnalyzed}
${completion.perCourse
  .map(
    (c) =>
      `  - "${c.course}" (${c.category}): ${c.enrolled} enrolled, ${c.completionRate_pct} complete, ${c.abandonmentRate_pct} abandoned, avg ${c.avgLessonsCompleted}/${c.totalLectures} lessons completed`
  )
  .join("\n") || "  No course data"}

=== EDUCATOR PERFORMANCE ===
Ungraded Assignments (platform-wide): ${educator.ungradedAssignments}
Stale/Low-Rated Courses (no recent purchases + avg rating < 3.5): ${educator.staleCount}
${educator.staleOrLowRatedCourses
  .map((c) => `  - "${c.title}" by ${c.educator}: rating ${c.avgRating}, ${c.daysSinceUpdate} days since last update`)
  .join("\n") || "  None identified"}

Grading Turnaround by Educator (slowest first):
${educator.gradingTurnaround
  .map((g) => `  - ${g.educator}: avg ${g.avgTurnaroundDays} days (${g.submissionsGraded} graded)`)
  .join("\n") || "  No graded assignments yet"}

Educator Enrollment Summary (top by enrollment):
${educator.educatorSummary
  .map((e) => `  - ${e.name}: ${e.courseCount} courses, ${e.totalEnrolled} enrolled, avg rating ${e.avgRating}`)
  .join("\n") || "  No educator data"}

=== GROWTH ===
Total Students: ${growth.totalStudents}
Paid Students: ${growth.paidStudents}
Overall Signup → Paid Conversion: ${growth.signupToPaidConversion_overall_pct}
Last 30d Signup → Paid Conversion: ${growth.signupToPaidConversion_last30d_pct}
New Signups (30d): ${growth.newSignups_30d}
New Paid Enrollments (30d): ${growth.newPaidEnrollments_30d}

Monthly Enrollment Trend (last 6 months):
${growth.monthlyEnrollmentTrend
  .map((m) => `  - ${m.month}: ${m.enrollments} enrollments, $${m.revenue} revenue`)
  .join("\n") || "  No purchase history"}

Category Demand (by enrollments):
${growth.categoryDemand
  .map((c) => `  - ${c.category}: ${c.enrollments} enrollments, $${c.revenue} revenue`)
  .join("\n") || "  No category data"}

---

Generate actionable platform recommendations. Return ONLY valid JSON — no markdown fences, no extra text.

Required schema:
{
  "dataInsufficient": false,
  "recommendations": [
    {
      "title": "string",
      "category": "Engagement" | "Completion" | "Educator" | "Growth",
      "priority": "High" | "Medium" | "Low",
      "reason": "2-3 sentences explaining why this matters, referencing specific numbers from the data above",
      "supporting_metrics": { "metric_name": "value" },
      "suggested_action": "Specific, concrete step the admin should take (not vague advice)",
      "impact_estimate": "string or null — only include if directly derivable from the data; never invent"
    }
  ]
}

STRICT RULES:
1. Generate at least 1 recommendation per category (Engagement, Completion, Educator, Growth) — unless that category genuinely has zero data, in which case omit it.
2. Maximum 3 recommendations per category, 12 total.
3. Sort recommendations High → Medium → Low within each category.
4. "reason" MUST cite specific numbers from the data above. Never use placeholder phrases like "the data shows".
5. "supporting_metrics" must contain only values present in the data above. Do not invent metrics.
6. "impact_estimate" must be null if you cannot derive it mathematically from the provided data.
7. If ALL four categories have zero data (no students, no courses, no purchases), set "dataInsufficient": true and "recommendations": [].
8. Do not fabricate data. If a metric is listed as "N/A", do not mention it in a recommendation.
`.trim();

// ─────────────────────────────────────────────────────────────────
//  Schema Validator — defensive parsing
// ─────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ["Engagement", "Completion", "Educator", "Growth"];
const VALID_PRIORITIES = ["High", "Medium", "Low"];

const validateAndNormaliseRecommendations = (parsed) => {
  if (!parsed || typeof parsed !== "object") throw new Error("Response is not an object");

  const dataInsufficient = !!parsed.dataInsufficient;
  const rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

  const recommendations = rawRecs
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      title: typeof r.title === "string" && r.title.trim() ? r.title.trim() : "Untitled Recommendation",
      category: VALID_CATEGORIES.includes(r.category) ? r.category : "Engagement",
      priority: VALID_PRIORITIES.includes(r.priority) ? r.priority : "Low",
      reason: typeof r.reason === "string" ? r.reason.trim() : "",
      supporting_metrics:
        r.supporting_metrics && typeof r.supporting_metrics === "object"
          ? r.supporting_metrics
          : {},
      suggested_action: typeof r.suggested_action === "string" ? r.suggested_action.trim() : "",
      impact_estimate:
        typeof r.impact_estimate === "string" && r.impact_estimate.trim()
          ? r.impact_estimate.trim()
          : null,
    }))
    // Enforce max 3 per category
    .reduce((acc, rec) => {
      const countInCategory = acc.filter((r) => r.category === rec.category).length;
      if (countInCategory < 3) acc.push(rec);
      return acc;
    }, [])
    // Sort: High first, then Medium, then Low
    .sort((a, b) => VALID_PRIORITIES.indexOf(a.priority) - VALID_PRIORITIES.indexOf(b.priority));

  return { dataInsufficient, recommendations };
};

// ─────────────────────────────────────────────────────────────────
//  Controller — GET /api/admin/analytics/recommendations
// ─────────────────────────────────────────────────────────────────
export const getAnalyticsRecommendations = async (req, res) => {
  try {
    const user = req.user;
    const bust = req.query.bust === "true";

    // Cache check
    const cacheKey = `recs:${user._id}`;
    if (!bust) {
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }
    }

    // Resolve Gemini API key
    const userApiKey = decryptKey(user.encryptedGeminiKey);
    const activeKey = userApiKey || process.env.GEMINI_API_KEY || "";

    if (!activeKey) {
      return res.status(403).json({
        success: false,
        message: "NO_API_KEY",
        detail: "No Gemini API key configured. Please add your key in Admin Settings.",
      });
    }

    // Run all 4 aggregations in parallel
    const [engagement, completion, educator, growth] = await Promise.all([
      aggregateEngagement(),
      aggregateCompletion(),
      aggregateEducatorPerformance(),
      aggregateGrowth(),
    ]);

    // Check if there's genuinely not enough data
    if (isDataInsufficient(engagement, completion, educator, growth)) {
      const result = {
        recommendations: [],
        dataInsufficient: true,
        generatedAt: new Date().toISOString(),
      };
      setCache(cacheKey, result);
      return res.json({ success: true, data: result, cached: false });
    }

    // Build prompt and call Gemini
    const prompt = buildRecommendationPrompt(engagement, completion, educator, growth);

    const ai = new GoogleGenAI({ apiKey: activeKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction:
          "You are a precise analytics AI for an LMS admin dashboard. Output only valid JSON. Never add markdown fences. Every recommendation must be grounded in the real data provided.",
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    });

    // Extract raw text
    let rawText = "";
    if (response.text) {
      rawText = response.text;
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = response.candidates[0].content.parts[0].text;
    }

    if (!rawText || !rawText.trim()) {
      return res.status(502).json({
        success: false,
        message: "The AI service returned an empty response. Please try again.",
      });
    }

    // Strip markdown fences if any
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(stripped);
    } catch {
      return res.status(502).json({
        success: false,
        message:
          "The AI returned an unreadable response. Please try again in a moment.",
      });
    }

    // Validate and normalise
    let validated;
    try {
      validated = validateAndNormaliseRecommendations(parsed);
    } catch (validationErr) {
      return res.status(502).json({
        success: false,
        message: "The AI response had an unexpected format. Please try again.",
      });
    }

    const result = {
      ...validated,
      generatedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result);
    return res.json({ success: true, data: result, cached: false });
  } catch (error) {
    console.error("Recommendations error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate recommendations. Please try again.",
    });
  }
};
