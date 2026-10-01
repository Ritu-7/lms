import test from "node:test";
import assert from "node:assert/strict";
import {
  flattenCourseLessons,
  buildPublishedCatalog,
  compactSnapshotForPrompt,
  buildCourseChatContext,
} from "../services/studentLearningSnapshotService.js";
import {
  collectStudentEvidenceSkills,
  normalizeSkillGapResult,
  matchGapSkill,
} from "../services/studentSkillGapService.js";
import { pickAdaptiveNext, sanitizeQuizQuestion, difficultyLabel } from "../services/adaptiveQuizService.js";

const sampleCourse = {
  _id: "course-1",
  courseTitle: "React Fundamentals",
  category: "Frontend",
  courseFeatures: ["React", "Hooks"],
  isPublished: true,
  courseContent: [
    {
      chapterTitle: "State",
      chapterId: "ch-1",
      chapterContent: [
        {
          lectureId: "l-1",
          lectureTitle: "useState",
          lectureType: "video",
          lectureRichTextContent: "useState stores component state.",
        },
        {
          lectureId: "l-2",
          lectureTitle: "useEffect",
          lectureType: "pdf",
          lessonPdfUrl: "https://example.com/hooks.pdf",
        },
      ],
    },
  ],
};

test("flattenCourseLessons extracts lesson ids and excerpts from legacy chapters", () => {
  const lessons = flattenCourseLessons(sampleCourse);
  assert.equal(lessons.length, 2);
  assert.equal(lessons[0].lessonId, "l-1");
  assert.match(lessons[0].excerpt, /useState/);
  assert.equal(lessons[1].hasPdf, true);
});

test("buildPublishedCatalog only copies real course and lesson identifiers", () => {
  const catalog = buildPublishedCatalog([sampleCourse]);
  assert.equal(catalog[0].courseId, "course-1");
  assert.deepEqual(catalog[0].lessons.map((item) => item.lessonId), ["l-1", "l-2"]);
});

test("compactSnapshotForPrompt drops bulky lesson bodies while keeping metrics", () => {
  const compact = compactSnapshotForPrompt({
    profile: { name: "Ada", learningGoals: "hooks" },
    enrollments: [{
      courseId: "course-1",
      title: "React Fundamentals",
      progressPct: 50,
      completedCount: 1,
      totalLessons: 2,
      incompleteLessons: [{ lessonId: "l-2", title: "useEffect" }],
      completedLessons: [{ lessonId: "l-1", title: "useState" }],
      lessons: [{ excerpt: "should not ship" }],
    }],
    quizzes: [{ quizId: "q1", percentage: 40 }],
    assignments: [],
    certificates: [],
    activity: { notes: [] },
    codingPractice: { runCount: 3, lastLanguage: "javascript" },
    weakQuizAreas: [{ title: "Hooks quiz", percentage: 40 }],
  });
  assert.equal(compact.enrollments[0].progressPct, 50);
  assert.equal(compact.enrollments[0].lessons, undefined);
  assert.equal(compact.weakQuizAreas[0].percentage, 40);
});

test("buildCourseChatContext scopes notes and prefers the current lesson", () => {
  const context = buildCourseChatContext(sampleCourse, [{
    lessonId: "l-2",
    lessonTitle: "useEffect",
    noteText: "Remember cleanup functions.",
  }], "l-2");
  assert.equal(context.lessons[0].lessonId, "l-2");
  assert.equal(context.studentNotes[0].excerpt.includes("cleanup"), true);
});

test("collectStudentEvidenceSkills only uses completed progress, passed quizzes, and real coding runs", () => {
  const skills = collectStudentEvidenceSkills({
    enrollments: [
      { title: "React Fundamentals", progressPct: 100, completedCount: 4, features: ["React"], category: "Frontend", courseId: "c1" },
      { title: "Unfinished", progressPct: 10, completedCount: 0, features: ["Secret"], category: "Backend" },
    ],
    quizzes: [{ title: "Hooks", passed: true, percentage: 90, tags: ["Hooks"], courseId: "c1" }],
    assignments: [{ status: "graded", totalScore: 8, maxScore: 10, title: "Lab", tags: ["Forms"] }],
    certificates: [{ courseTitle: "React Fundamentals", issueDate: "2026-01-01" }],
    codingPractice: { lastLanguage: "javascript", runCount: 2, lastSuccess: true, recentSessions: [] },
  });
  const names = skills.map((item) => item.skill);
  assert.ok(names.includes("React"));
  assert.ok(names.includes("javascript"));
  assert.equal(names.includes("Secret"), false);
});

test("normalizeSkillGapResult drops invented courses and skills the student already has", () => {
  const catalog = buildPublishedCatalog([sampleCourse]);
  const result = normalizeSkillGapResult({
    target: "Frontend engineer",
    gaps: [
      {
        skill: "React",
        whyMissing: "should be filtered",
        recommendedResources: [{ courseId: "course-1", lessonId: "l-1", reason: "covers React" }],
      },
      {
        skill: "TypeScript",
        whyMissing: "No TS course completed",
        recommendedResources: [
          { courseId: "invented", lessonId: "x", reason: "fake" },
          { courseId: "course-1", lessonId: "l-1", reason: "JS foundation" },
        ],
      },
    ],
  }, catalog, [{ skill: "React", source: "completed course" }]);

  assert.equal(result.gaps.length, 1);
  assert.equal(result.gaps[0].skill, "TypeScript");
  assert.equal(result.gaps[0].recommendedResources[0].courseId, "course-1");
  assert.equal(result.gaps[0].recommendedResources.some((item) => item.courseId === "invented"), false);
});

test("matchGapSkill resolves exact and partial names", () => {
  assert.equal(matchGapSkill("hooks", ["React Hooks"]), "React Hooks");
  assert.equal(matchGapSkill("missing", ["React"]), "");
});

test("pickAdaptiveNext raises difficulty after a correct answer and stays on related weak concepts after a miss", () => {
  const remaining = [
    { questionId: "easy", prompt: "What is JSX syntax basics", difficulty: "easy", points: 1 },
    { questionId: "hard-hooks", prompt: "Explain useEffect cleanup hooks", difficulty: "hard", points: 3 },
    { questionId: "med", prompt: "Describe component props", difficulty: "medium", points: 2 },
  ];
  const harder = pickAdaptiveNext(remaining, {
    lastCorrect: true,
    lastQuestion: { prompt: "useState basics", difficulty: "medium", points: 2 },
  });
  assert.equal(harder.questionId, "hard-hooks");

  const weaker = pickAdaptiveNext(remaining, {
    lastCorrect: false,
    lastQuestion: { prompt: "useEffect cleanup", difficulty: "hard", points: 3 },
  });
  assert.equal(weaker.questionId, "hard-hooks");
});

test("sanitizeQuizQuestion never leaks the correct answer", () => {
  const sanitized = sanitizeQuizQuestion({
    questionId: "q1",
    prompt: "Pick hooks",
    questionType: "mcq",
    points: 2,
    difficulty: "medium",
    options: [{ optionId: "a", label: "useState", isCorrect: true }],
    correctAnswer: "useState",
  });
  assert.equal(sanitized.options[0].isCorrect, undefined);
  assert.equal(sanitized.correctAnswer, undefined);
  assert.equal(difficultyLabel({ points: 3 }), "hard");
});
