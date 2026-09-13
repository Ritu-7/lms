import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Purchase from "../models/Purchase.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Clamp a value between 0 and 100. */
const clamp = (v) => Math.min(100, Math.max(0, Math.round(v)));

/** Return date N days ago. */
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────
// Scoring sub-functions (each returns 0–100)
// ─────────────────────────────────────────────

/** Completion Rate score (25% weight). */
function scoreCompletion(completionRate) {
  // completionRate: 0–1 fraction
  return clamp(completionRate * 100);
}

/** Quiz Performance score (20% weight). */
function scoreQuiz(passRate, avgPercentage) {
  // passRate: 0–1,  avgPercentage: 0–100
  const combined = passRate * 50 + (avgPercentage / 100) * 50;
  return clamp(combined * 100 / 100);
}

/** Assignment Engagement score (15% weight). */
function scoreAssignment(submissionRate, avgScore) {
  // submissionRate: 0–1,  avgScore: 0–100
  const combined = submissionRate * 60 + (avgScore / 100) * 40;
  return clamp(combined * 100);
}

/** Learner Activity score — 30-day active learners (20% weight). */
function scoreActivity(activeRatio) {
  // activeRatio: active-in-30d / total enrolled  (0–1)
  return clamp(activeRatio * 100);
}

/** Ratings score (10% weight). */
function scoreRatings(avgRating, ratingCount) {
  if (ratingCount === 0) return 50; // neutral when no ratings yet
  // avgRating: 1–5
  const normalized = ((avgRating - 1) / 4) * 100;
  // Confidence boost for more ratings (up to +5 pts at 20+ ratings)
  const confidence = Math.min(ratingCount / 20, 1) * 5;
  return clamp(normalized + confidence);
}

/** Content Completeness score (10% weight). */
function scoreContent(publishedLectures, totalLectures) {
  if (totalLectures === 0) return 0;
  const ratio = publishedLectures / totalLectures;
  // Also reward having "enough" lectures (>= 10 is full marks on quantity)
  const quantityBonus = Math.min(totalLectures / 10, 1) * 20;
  return clamp(ratio * 80 + quantityBonus);
}

// ─────────────────────────────────────────────
// Problem Detector
// ─────────────────────────────────────────────

function detectProblems(metrics) {
  const problems = [];

  if (metrics.enrolledCount === 0) {
    problems.push({
      code: "NO_ENROLLMENTS",
      severity: "critical",
      title: "No Enrollments",
      reason: "This course has never been purchased or enrolled in.",
      suggestions: [
        "Improve the course title and thumbnail for better discoverability.",
        "Offer a limited-time discount or a free preview lecture.",
        "Ask the educator to promote the course on social media.",
      ],
    });
    return problems; // most other metrics are meaningless with 0 enrollments
  }

  if (metrics.completionRate < 0.30) {
    problems.push({
      code: "LOW_COMPLETION",
      severity: metrics.completionRate < 0.10 ? "critical" : "warning",
      title: "Low Completion Rate",
      reason: `Only ${Math.round(metrics.completionRate * 100)}% of enrolled learners have completed the course (benchmark: ≥30%).`,
      suggestions: [
        "Break long lectures into shorter segments (aim for < 10 min each).",
        "Add milestone checkpoints with encouragement messages.",
        "Send re-engagement email notifications to inactive learners.",
        "Review drop-off points and simplify those sections.",
      ],
    });
  }

  if (metrics.dropOffLecture) {
    problems.push({
      code: "HIGH_DROP_OFF",
      severity: "warning",
      title: "Learner Drop-Off Hotspot",
      reason: `A significant portion of learners stop progressing around "${metrics.dropOffLecture}" — this lecture may be too difficult, too long, or poorly explained.`,
      suggestions: [
        "Re-record or restructure the problematic lecture.",
        "Add a supplemental resource or FAQ for that topic.",
        "Consider splitting it into two smaller lectures.",
        "Add a prerequisite check or warmup quiz before that section.",
      ],
    });
  }

  if (metrics.quizAttemptCount > 0 && metrics.quizAvgPercentage < 50) {
    problems.push({
      code: "POOR_QUIZ_PERFORMANCE",
      severity: "warning",
      title: "Poor Quiz Performance",
      reason: `Average quiz score is ${Math.round(metrics.quizAvgPercentage)}% (benchmark: ≥50%). Learners may not be grasping core concepts.`,
      suggestions: [
        "Review quiz questions for ambiguity or excessive difficulty.",
        "Add review summaries before each quiz.",
        "Lower passing thresholds or add remedial quizzes for struggling learners.",
        "Provide detailed answer explanations for every question.",
      ],
    });
  }

  if (metrics.assignmentCount > 0 && metrics.assignmentSubmissionRate < 0.40) {
    problems.push({
      code: "LOW_ASSIGNMENT_ENGAGEMENT",
      severity: "warning",
      title: "Low Assignment Submission Rate",
      reason: `Only ${Math.round(metrics.assignmentSubmissionRate * 100)}% of learners submit assignments (benchmark: ≥40%).`,
      suggestions: [
        "Send assignment due-date reminders via notifications.",
        "Ensure assignment instructions are clear and concise.",
        "Consider reducing assignment difficulty or word count.",
        "Make at least one early assignment optional to build the habit.",
      ],
    });
  }

  if (metrics.activeRatio < 0.10 && metrics.enrolledCount >= 5) {
    problems.push({
      code: "STALE_COURSE",
      severity: "warning",
      title: "Low Learner Activity (Last 30 Days)",
      reason: `Only ${Math.round(metrics.activeRatio * 100)}% of enrolled learners were active in the last 30 days.`,
      suggestions: [
        "Publish a new announcement to re-engage students.",
        "Add fresh content or updated lectures to renew interest.",
        "Send a re-engagement notification campaign.",
        "Promote course in relevant communities.",
      ],
    });
  }

  if (metrics.ratingCount >= 3 && metrics.avgRating < 3.5) {
    problems.push({
      code: "LOW_RATINGS",
      severity: metrics.avgRating < 2.5 ? "critical" : "warning",
      title: "Low Learner Ratings",
      reason: `Average rating is ${metrics.avgRating.toFixed(1)}/5 from ${metrics.ratingCount} reviews (benchmark: ≥3.5).`,
      suggestions: [
        "Read all reviews carefully and address common complaints.",
        "Improve production quality of video lectures.",
        "Add a Q&A section and respond to student questions promptly.",
        "Update outdated content that learners flag as irrelevant.",
      ],
    });
  }

  if (metrics.publishedLectures < 5) {
    problems.push({
      code: "SPARSE_CONTENT",
      severity: "warning",
      title: "Sparse Course Content",
      reason: `The course only has ${metrics.publishedLectures} published lecture(s). Learners expect comprehensive content.`,
      suggestions: [
        "Ask the educator to add more published lectures.",
        "Ensure all draft lectures are reviewed and published.",
        "Add supplemental resources, readings, or bonus lectures.",
      ],
    });
  }

  return problems;
}

// ─────────────────────────────────────────────
// Per-course analyzer
// ─────────────────────────────────────────────

async function analyzeCourse(course) {
  const courseId = course._id;
  const courseIdStr = courseId.toString();

  // ── 1. Content Completeness ──────────────────
  let totalLectures = 0;
  let publishedLectures = 0;
  let lectureList = []; // [{id, title, order}] for drop-off detection

  if (Array.isArray(course.courseContent)) {
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        chapter.chapterContent.forEach((lec) => {
          totalLectures++;
          const lTitle = lec.lectureTitle || `Lecture ${totalLectures}`;
          lectureList.push({ id: lec.lectureId || String(totalLectures), title: lTitle });
          if (lec.lectureStatus === "published") publishedLectures++;
        });
      }
    });
  }

  // ── 2. Enrollments ───────────────────────────
  const enrolledCount = Array.isArray(course.studentsEnrolled)
    ? course.studentsEnrolled.length
    : 0;

  // ── 3. Ratings ───────────────────────────────
  const ratings = Array.isArray(course.courseRatings) ? course.courseRatings : [];
  const ratingCount = ratings.length;
  const avgRating =
    ratingCount > 0
      ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount
      : 0;

  // ── 4. Course Progress ────────────────────────
  const progressDocs = await CourseProgress.find({ courseId: courseIdStr }).lean();
  const totalProgressDocs = progressDocs.length;

  // Completion rate: learners who completed all published lectures
  let completedCount = 0;
  const lectureCounts = {}; // lectureId → how many learners completed it

  progressDocs.forEach((doc) => {
    const completed = [
      ...(doc.completedLessons || []),
      ...(doc.completedLectures || []),
    ];
    // Count per-lecture completions for drop-off detection
    completed.forEach((lid) => {
      lectureCounts[lid] = (lectureCounts[lid] || 0) + 1;
    });
    // Consider a learner "completed" if they finished ≥90% of published lectures
    if (publishedLectures > 0 && completed.length >= publishedLectures * 0.9) {
      completedCount++;
    }
  });

  const completionRate =
    enrolledCount > 0 ? completedCount / enrolledCount : 0;

  // Drop-off detection: find the last lecture where >30% of enrolled learners
  // stopped progressing (i.e., completed count drops significantly after it)
  let dropOffLecture = null;
  if (lectureList.length > 1 && enrolledCount >= 3) {
    for (let i = 0; i < lectureList.length - 1; i++) {
      const currId = lectureList[i].id;
      const nextId = lectureList[i + 1].id;
      const currCount = lectureCounts[currId] || 0;
      const nextCount = lectureCounts[nextId] || 0;
      if (currCount > 0 && nextCount < currCount * 0.6) {
        dropOffLecture = lectureList[i + 1].title;
        break;
      }
    }
  }

  // 30-day active learners
  const thirtyDaysAgo = daysAgo(30);
  const activeProgressDocs = await CourseProgress.countDocuments({
    courseId: courseIdStr,
    updatedAt: { $gte: thirtyDaysAgo },
  });
  const activeRatio = enrolledCount > 0 ? activeProgressDocs / enrolledCount : 0;

  // ── 5. Quiz Performance ───────────────────────
  const quizAttempts = await QuizAttempt.find({
    course: courseId,
    status: { $in: ["submitted", "graded"] },
  })
    .select("passed percentage")
    .lean();

  const quizAttemptCount = quizAttempts.length;
  let quizPassRate = 0;
  let quizAvgPercentage = 0;

  if (quizAttemptCount > 0) {
    const passedCount = quizAttempts.filter((a) => a.passed).length;
    quizPassRate = passedCount / quizAttemptCount;
    quizAvgPercentage =
      quizAttempts.reduce((s, a) => s + (a.percentage || 0), 0) /
      quizAttemptCount;
  }

  // ── 6. Assignment Engagement ──────────────────
  const assignmentSubs = await AssignmentSubmission.find({
    course: courseId,
  })
    .select("status totalScore maxScore")
    .lean();

  const assignmentCount = assignmentSubs.length;
  let assignmentSubmissionRate = 0;
  let assignmentAvgScore = 0;

  if (assignmentCount > 0 && enrolledCount > 0) {
    const submitted = assignmentSubs.filter(
      (s) => s.status !== "not_submitted"
    ).length;
    assignmentSubmissionRate = submitted / enrolledCount;

    const scored = assignmentSubs.filter(
      (s) => s.maxScore > 0 && s.status !== "not_submitted"
    );
    if (scored.length > 0) {
      assignmentAvgScore =
        (scored.reduce(
          (sum, s) => sum + (s.totalScore / s.maxScore) * 100,
          0
        ) /
          scored.length);
    }
  }

  // ── 7. Compute sub-scores ─────────────────────
  const subScores = {
    completion: { score: scoreCompletion(completionRate), weight: 0.25 },
    quiz: { score: scoreQuiz(quizPassRate, quizAvgPercentage), weight: 0.20 },
    assignment: {
      score: scoreAssignment(assignmentSubmissionRate, assignmentAvgScore),
      weight: 0.15,
    },
    activity: { score: scoreActivity(activeRatio), weight: 0.20 },
    ratings: { score: scoreRatings(avgRating, ratingCount), weight: 0.10 },
    content: {
      score: scoreContent(publishedLectures, totalLectures),
      weight: 0.10,
    },
  };

  const healthScore = clamp(
    Object.values(subScores).reduce(
      (sum, { score, weight }) => sum + score * weight,
      0
    )
  );

  // ── 8. Metrics object ─────────────────────────
  const metrics = {
    enrolledCount,
    completionRate,
    dropOffLecture,
    quizAttemptCount,
    quizPassRate,
    quizAvgPercentage,
    assignmentCount,
    assignmentSubmissionRate,
    assignmentAvgScore,
    activeRatio,
    ratingCount,
    avgRating,
    publishedLectures,
    totalLectures,
  };

  const problems = detectProblems(metrics);

  return {
    courseId: courseIdStr,
    courseTitle: course.courseTitle || "Untitled Course",
    category: course.category || "Uncategorized",
    courseThumbnail: course.courseThumbnail || null,
    educator: course.educator || null,
    isPublished: course.isPublished,
    healthScore,
    subScores,
    metrics,
    problems,
    problemCount: problems.length,
    severity:
      healthScore >= 70
        ? "healthy"
        : healthScore >= 40
        ? "warning"
        : "critical",
    createdAt: course.createdAt,
  };
}

// ─────────────────────────────────────────────
// Controller: GET /api/admin/course-health
// ─────────────────────────────────────────────

export const getCourseHealthScores = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      severity, // "healthy" | "warning" | "critical"
      category,
      search,
      sort = "score_asc", // score_asc | score_desc | title_asc | enrollments_desc
    } = req.query;

    // Fetch all courses (populate educator name)
    const query = {};
    if (category) query.category = category;
    if (search) query.courseTitle = { $regex: search, $options: "i" };

    const courses = await Course.find(query)
      .populate("educator", "name email imageUrl")
      .lean();

    // Analyze all courses (in parallel batches of 10 for safety)
    const BATCH_SIZE = 10;
    const results = [];
    for (let i = 0; i < courses.length; i += BATCH_SIZE) {
      const batch = courses.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(analyzeCourse));
      results.push(...batchResults);
    }

    // Filter by severity
    const filtered = severity
      ? results.filter((r) => r.severity === severity)
      : results;

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "score_desc":
          return b.healthScore - a.healthScore;
        case "title_asc":
          return a.courseTitle.localeCompare(b.courseTitle);
        case "enrollments_desc":
          return b.metrics.enrolledCount - a.metrics.enrolledCount;
        case "score_asc":
        default:
          return a.healthScore - b.healthScore;
      }
    });

    // Paginate
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const start = (pageNum - 1) * limitNum;
    const paginated = sorted.slice(start, start + limitNum);

    // Platform-level summary
    const totalCourses = results.length;
    const avgPlatformScore =
      totalCourses > 0
        ? Math.round(results.reduce((s, r) => s + r.healthScore, 0) / totalCourses)
        : 0;
    const criticalCount = results.filter((r) => r.severity === "critical").length;
    const warningCount = results.filter((r) => r.severity === "warning").length;
    const healthyCount = results.filter((r) => r.severity === "healthy").length;

    // Categories list for filter dropdown
    const categories = [...new Set(courses.map((c) => c.category).filter(Boolean))].sort();

    res.json({
      success: true,
      summary: {
        totalCourses,
        avgPlatformScore,
        criticalCount,
        warningCount,
        healthyCount,
      },
      categories,
      pagination: {
        total: filtered.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filtered.length / limitNum),
      },
      scores: paginated,
    });
  } catch (error) {
    console.error("getCourseHealthScores error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Controller: GET /api/admin/course-health/:courseId
// ─────────────────────────────────────────────

export const getCourseHealthDetail = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId)
      .populate("educator", "name email imageUrl")
      .lean();

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const result = await analyzeCourse(course);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("getCourseHealthDetail error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
