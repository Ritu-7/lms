const DEFAULT_COMPLETION_RULES = {
  video: {
    mode: "manual",
    requiredWatchPercent: 90,
    allowManualOverride: true,
  },
  pdf: {
    mode: "manual",
    allowManualOverride: true,
  },
  quiz: {
    mode: "score",
    passingScore: 70,
    allowManualOverride: true,
  },
  assignment: {
    mode: "submission",
    requiredSubmissionStates: ["submitted", "graded", "approved"],
    allowManualOverride: true,
  },
};

const LEGACY_PROGRESS_FIELDS = ["completedLectures", "completedLessons", "completedLessonIds"];

const flatten = (value) => (Array.isArray(value) ? value.flat(Infinity) : []);

export const normalizeCompletionRules = (lessonType = "video", rules = {}) => ({
  ...DEFAULT_COMPLETION_RULES[lessonType],
  ...rules,
});

export const getLessonId = (lesson = {}, index = 0) =>
  lesson.lessonId || lesson.lectureId || lesson._id?.toString?.() || `${index + 1}`;

export const getLessonType = (lesson = {}) =>
  lesson.lessonType || lesson.lectureType || lesson.contentType || "video";

export const getLessonCompletionRules = (lesson = {}) =>
  normalizeCompletionRules(
    getLessonType(lesson),
    lesson.lessonCompletionRules || lesson.lectureCompletionRules || lesson.completionRules || {}
  );

export const getCourseLessons = (course = {}) => {
  if (Array.isArray(course.modules) && course.modules.length > 0) {
    return course.modules.flatMap((module) =>
      flatten(module?.lessons).map((lesson, index) => ({
        ...lesson,
        lessonId: getLessonId(lesson, index),
        lessonType: getLessonType(lesson),
      }))
    );
  }

  if (Array.isArray(course.courseContent) && course.courseContent.length > 0) {
    return course.courseContent.flatMap((chapter) =>
      flatten(chapter?.chapterContent).map((lesson, index) => ({
        ...lesson,
        lessonId: getLessonId(lesson, index),
        lessonType: getLessonType(lesson),
      }))
    );
  }

  return [];
};

export const getCompletionEvidence = (completionData = {}) => ({
  completed: Boolean(completionData.completed),
  manual: Boolean(completionData.manual),
  watchPercent: Number(completionData.watchPercent || 0),
  score: Number(completionData.score || 0),
  submissionStatus: String(completionData.submissionStatus || "").toLowerCase(),
  submitted: Boolean(completionData.submitted),
});

export const canCompleteLesson = (lesson = {}, completionData = {}) => {
  const lessonType = getLessonType(lesson);
  const rules = getLessonCompletionRules(lesson);
  const evidence = getCompletionEvidence(completionData);

  if (!completionData || Object.keys(completionData).length === 0) {
    return Boolean(rules.allowManualOverride);
  }

  if (evidence.manual) return Boolean(rules.allowManualOverride);
  if (evidence.completed) return true;

  switch (lessonType) {
    case "video":
      return evidence.watchPercent >= Number(rules.requiredWatchPercent || 90) || evidence.completed;
    case "pdf":
      return Boolean(evidence.completed || evidence.submitted);
    case "quiz":
      return evidence.score >= Number(rules.passingScore || 70) || evidence.completed;
    case "assignment":
      return Boolean(evidence.submitted) || (rules.requiredSubmissionStates || []).includes(evidence.submissionStatus);
    default:
      return Boolean(rules.allowManualOverride);
  }
};

const toIdSet = (values = []) => new Set(flatten(values).filter(Boolean).map(String));

export const getRecordedLessonIds = (progressRecord = {}, legacyProgress = []) => {
  const ids = LEGACY_PROGRESS_FIELDS.flatMap((field) => progressRecord?.[field] || []);
  return Array.from(toIdSet([...ids, ...legacyProgress]));
};

export const buildProgressSnapshot = ({ course = {}, progressRecord = null, legacyProgress = [] } = {}) => {
  const lessons = getCourseLessons(course);
  const totalLessons = lessons.length;
  const lessonIndex = new Map(lessons.map((lesson) => [String(getLessonId(lesson)), lesson]));
  const recordedLessonIds = getRecordedLessonIds(progressRecord, legacyProgress);
  const completedLessonIds = recordedLessonIds.filter((lessonId) => lessonIndex.has(String(lessonId)));
  const completedSet = new Set(completedLessonIds.map(String));
  const totalCompleted = completedSet.size;
  const completionPercentage = totalLessons > 0 ? Math.min(Math.round((totalCompleted / totalLessons) * 100), 100) : 0;

  const completionByType = lessons.reduce((summary, lesson) => {
    const lessonType = getLessonType(lesson);
    summary[lessonType] = summary[lessonType] || { total: 0, completed: 0 };
    summary[lessonType].total += 1;
    if (completedSet.has(String(getLessonId(lesson)))) {
      summary[lessonType].completed += 1;
    }
    return summary;
  }, {});

  return {
    completedLessons: completedLessonIds,
    completedLectures: completedLessonIds,
    totalLessons,
    completedCount: totalCompleted,
    completionPercentage,
    completionByType,
  };
};

export const normalizeProgressRecord = (progressRecord = null, legacyProgress = []) => {
  const completedLessons = getRecordedLessonIds(progressRecord, legacyProgress);

  return {
    completedLessons,
    completedLectures: completedLessons,
  };
};
