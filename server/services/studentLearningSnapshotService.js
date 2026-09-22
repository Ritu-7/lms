import Course from "../models/Course.js";
import CourseProgress from "../models/CourseProgress.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Certificate from "../models/Certificate.js";
import PersonalNote from "../models/PersonalNote.js";
import StudyBookmark from "../models/StudyBookmark.js";
import AIUsageLog from "../models/AIUsageLog.js";
import { getRecordedLessonIds } from "./progressEngineService.js";

const clip = (value, max = 280) => {
  const text = String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
};

const toId = (value) => value?._id?.toString?.() || value?.toString?.() || "";

const lessonFromRecord = (lecture = {}, chapter = {}, chapterIndex = 0, lessonIndex = 0) => {
  if (!lecture || typeof lecture !== "object") return null;
  const lessonId = lecture.lectureId || lecture.lessonId || lecture._id?.toString?.();
  if (!lessonId && !lecture.lectureTitle && !lecture.lessonTitle) return null;
  const resources = [
    ...(lecture.lectureResources || []),
    ...(lecture.lessonResources || []),
    ...(lecture.lectureAttachments || []),
    ...(lecture.lessonAttachments || []),
  ];
  const pdfUrl = lecture.lessonPdfUrl || lecture.lecturePdfUrl || "";
  return {
    lessonId: String(lessonId || `${chapter.chapterId || chapter.moduleId || chapterIndex}-${lessonIndex}`),
    title: lecture.lectureTitle || lecture.lessonTitle || `Lesson ${lessonIndex + 1}`,
    chapterTitle: chapter.chapterTitle || chapter.moduleTitle || `Module ${chapterIndex + 1}`,
    chapterId: String(chapter.chapterId || chapter.moduleId || chapterIndex + 1),
    type: lecture.lectureType || lecture.lessonType || "video",
    excerpt: clip(
      [
        lecture.lectureRichTextContent,
        lecture.lessonRichTextContent,
        lecture.lectureTranscriptPlaceholder,
        lecture.lessonTranscriptPlaceholder,
        lecture.lessonSummary,
        pdfUrl ? `PDF materials: ${pdfUrl}` : "",
        resources.map((resource) => resource.title || resource.name || resource.url).filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(" "),
      700
    ),
    hasPdf: Boolean(pdfUrl),
    resourceTitles: resources
      .map((resource) => resource.title || resource.name)
      .filter(Boolean)
      .slice(0, 6),
    order: Number(lecture.lessonOrder || lecture.lectureOrder || lessonIndex + 1),
  };
};

export const flattenCourseLessons = (course = {}) => {
  const fromModules = [];
  (Array.isArray(course.modules) ? course.modules : []).forEach((module, chapterIndex) => {
    (module?.lessons || []).forEach((lecture, lessonIndex) => {
      const lesson = lessonFromRecord(lecture, module, chapterIndex, lessonIndex);
      if (lesson) fromModules.push(lesson);
    });
  });
  if (fromModules.length) return fromModules;

  const lessons = [];
  (Array.isArray(course.courseContent) ? course.courseContent : []).forEach((chapter, chapterIndex) => {
    (chapter.chapterContent || []).forEach((lecture, lessonIndex) => {
      const lesson = lessonFromRecord(lecture, chapter, chapterIndex, lessonIndex);
      if (lesson) lessons.push(lesson);
    });
  });
  return lessons;
};

export const buildPublishedCatalog = (courses = []) =>
  (Array.isArray(courses) ? courses : []).map((course) => {
    const lessons = flattenCourseLessons(course);
    return {
      courseId: toId(course._id),
      title: course.courseTitle || "Untitled course",
      category: course.category || "",
      features: Array.isArray(course.courseFeatures) ? course.courseFeatures.filter(Boolean) : [],
      description: clip(course.courseDescription, 220),
      lessons: lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        title: lesson.title,
        chapterTitle: lesson.chapterTitle,
      })),
    };
  });

export const buildStudentLearningSnapshot = async (user) => {
  const enrolledIds = Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [];
  const clerkUserId = user.clerkUserId;

  const [
    enrolledCourses,
    catalogCourses,
    progressDocs,
    quizzes,
    quizAttempts,
    assignments,
    submissions,
    certificates,
    notes,
    bookmarks,
    codingLogs,
  ] = await Promise.all([
    enrolledIds.length
      ? Course.find({ _id: { $in: enrolledIds } })
          .select("courseTitle courseDescription category courseFeatures courseContent modules isPublished")
          .populate({ path: "modules", populate: { path: "lessons" } })
          .lean()
      : [],
    Course.find({ isPublished: true })
      .select("courseTitle courseDescription category courseFeatures courseContent modules isPublished")
      .populate({ path: "modules", populate: { path: "lessons" } })
      .lean(),
    CourseProgress.find({ userId: clerkUserId }).lean(),
    enrolledIds.length
      ? Quiz.find({ course: { $in: enrolledIds }, status: "published" })
          .select("title tags course dueAt passingScore questions")
          .lean()
      : [],
    QuizAttempt.find({ student: user._id }).sort({ submittedAt: -1, updatedAt: -1 }).limit(80).lean(),
    enrolledIds.length
      ? Assignment.find({ course: { $in: enrolledIds }, status: "published" })
          .select("title tags course dueDate totalPoints")
          .lean()
      : [],
    AssignmentSubmission.find({ student: user._id }).sort({ updatedAt: -1 }).limit(80).lean(),
    Certificate.find({ user: user._id, status: "active" }).populate("course", "courseTitle").lean(),
    PersonalNote.find({ user: user._id }).sort({ updatedAt: -1 }).limit(20).lean(),
    StudyBookmark.find({ user: user._id }).sort({ updatedAt: -1 }).limit(20).lean(),
    AIUsageLog.find({
      user: user._id,
      $or: [{ sourceType: "code" }, { feature: { $in: ["coding_run", "coding_hint", "coding_assistant"] } }],
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
  ]);

  const progressByCourse = new Map(
    progressDocs.map((doc) => [String(doc.courseId), doc])
  );

  const enrollments = enrolledCourses.map((course) => {
    const courseId = toId(course._id);
    const lessons = flattenCourseLessons(course);
    const progress = progressByCourse.get(courseId);
    const completed = new Set(getRecordedLessonIds(progress).map(String));
    const completedLessons = lessons.filter((lesson) => completed.has(lesson.lessonId));
    const incompleteLessons = lessons.filter((lesson) => !completed.has(lesson.lessonId));
    const total = lessons.length || 1;
    const progressPct = Math.min(100, Math.round((completedLessons.length / total) * 100));
    return {
      courseId,
      title: course.courseTitle || "Untitled course",
      category: course.category || "",
      features: Array.isArray(course.courseFeatures) ? course.courseFeatures.filter(Boolean) : [],
      description: clip(course.courseDescription, 180),
      totalLessons: lessons.length,
      completedCount: completedLessons.length,
      progressPct,
      lastProgressAt: progress?.updatedAt || null,
      incompleteLessons: incompleteLessons.slice(0, 8).map((lesson) => ({
        lessonId: lesson.lessonId,
        title: lesson.title,
        chapterTitle: lesson.chapterTitle,
      })),
      completedLessons: completedLessons.slice(-8).map((lesson) => ({
        lessonId: lesson.lessonId,
        title: lesson.title,
        chapterTitle: lesson.chapterTitle,
      })),
      lessons,
    };
  });

  const attemptsByQuiz = new Map();
  for (const attempt of quizAttempts) {
    const key = toId(attempt.quiz);
    if (!attemptsByQuiz.has(key)) attemptsByQuiz.set(key, attempt);
  }

  const quizSummaries = quizzes.map((quiz) => {
    const attempt = attemptsByQuiz.get(toId(quiz._id));
    const weakResponses = (attempt?.responses || []).filter((item) => item.isCorrect === false);
    return {
      quizId: toId(quiz._id),
      title: quiz.title,
      courseId: toId(quiz.course),
      tags: Array.isArray(quiz.tags) ? quiz.tags : [],
      dueAt: quiz.dueAt || null,
      passingScore: quiz.passingScore || 70,
      percentage: attempt?.percentage ?? null,
      passed: Boolean(attempt?.passed),
      status: attempt?.status || "not_started",
      submittedAt: attempt?.submittedAt || null,
      weakItems: weakResponses.slice(0, 6).map((item) => ({
        questionId: item.questionId,
        feedback: item.feedback || "",
        explanation: clip(item.explanation, 140),
      })),
    };
  });

  const submissionByAssignment = new Map(submissions.map((item) => [toId(item.assignment), item]));
  const assignmentSummaries = assignments.map((assignment) => {
    const submission = submissionByAssignment.get(toId(assignment._id));
    return {
      assignmentId: toId(assignment._id),
      title: assignment.title,
      courseId: toId(assignment.course),
      tags: Array.isArray(assignment.tags) ? assignment.tags : [],
      dueDate: assignment.dueDate || null,
      status: submission?.status || "not_submitted",
      totalScore: submission?.totalScore ?? null,
      maxScore: submission?.maxScore || assignment.totalPoints || null,
    };
  });

  const weakQuizAreas = quizSummaries
    .filter((quiz) => quiz.percentage !== null && quiz.percentage < (quiz.passingScore || 70))
    .map((quiz) => ({
      quizId: quiz.quizId,
      title: quiz.title,
      courseId: quiz.courseId,
      percentage: quiz.percentage,
      tags: quiz.tags,
    }));

  return {
    profile: {
      name: user.name || "Student",
      email: user.email || "",
      learningGoals: user.learningGoals || "",
      targetRole: user.targetRole || "",
    },
    enrollments,
    quizzes: quizSummaries,
    assignments: assignmentSummaries,
    certificates: certificates.map((item) => ({
      certificateId: item.certificateId,
      courseTitle: item.course?.courseTitle || item.courseTitle || "",
      issueDate: item.issueDate,
    })),
    activity: {
      notes: notes.map((item) => ({
        lessonTitle: item.lessonTitle,
        courseId: toId(item.course),
        updatedAt: item.updatedAt,
        excerpt: clip(item.noteText, 120),
      })),
      bookmarks: bookmarks.map((item) => ({
        lessonTitle: item.lessonTitle,
        courseId: toId(item.course),
        updatedAt: item.updatedAt,
      })),
      lastProgressAt: enrollments
        .map((item) => item.lastProgressAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null,
    },
    codingPractice: {
      runCount: user.codingPractice?.runCount || 0,
      lastLanguage: user.codingPractice?.lastLanguage || "",
      lastSuccess: Boolean(user.codingPractice?.lastSuccess),
      lastRunAt: user.codingPractice?.lastRunAt || null,
      recentSessions: codingLogs.map((item) => ({
        title: item.title,
        status: item.status,
        createdAt: item.createdAt,
        language: item.metadata?.language || "",
      })),
    },
    weakQuizAreas,
    catalog: buildPublishedCatalog(catalogCourses),
    generatedAt: new Date().toISOString(),
  };
};

export const buildCourseChatContext = (course = {}, notes = [], currentLessonId = "") => {
  const lessons = flattenCourseLessons(course).map((lesson) => ({
    lessonId: lesson.lessonId,
    title: lesson.title,
    chapterTitle: lesson.chapterTitle,
    excerpt: lesson.excerpt,
    hasPdf: Boolean(lesson.hasPdf),
    resourceTitles: lesson.resourceTitles || [],
    type: lesson.type,
  }));
  const current = lessons.find((lesson) => lesson.lessonId === String(currentLessonId));
  const ordered = current
    ? [current, ...lessons.filter((lesson) => lesson.lessonId !== current.lessonId)]
    : lessons;
  return {
    courseTitle: course.courseTitle,
    courseDescription: clip(course.courseDescription, 500),
    currentLessonId: current?.lessonId || "",
    lessons: ordered.slice(0, 40),
    studentNotes: (Array.isArray(notes) ? notes : []).map((note) => ({
      lessonId: note.lessonId,
      lessonTitle: note.lessonTitle,
      section: note.positionLabel || note.positionType || "lesson",
      excerpt: clip(note.noteText, 240),
    })),
  };
};

export const compactSnapshotForPrompt = (snapshot) => ({
  profile: snapshot.profile,
  enrollments: (snapshot.enrollments || []).map((course) => ({
    courseId: course.courseId,
    title: course.title,
    category: course.category,
    features: course.features,
    progressPct: course.progressPct,
    completedCount: course.completedCount,
    totalLessons: course.totalLessons,
    incompleteLessons: course.incompleteLessons,
    completedLessons: course.completedLessons,
  })),
  quizzes: snapshot.quizzes,
  assignments: snapshot.assignments,
  certificates: snapshot.certificates,
  activity: snapshot.activity,
  codingPractice: snapshot.codingPractice,
  weakQuizAreas: snapshot.weakQuizAreas,
});
