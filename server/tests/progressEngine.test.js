import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProgressSnapshot,
  canCompleteLesson,
  getCourseLessons,
  normalizeProgressRecord,
} from "../services/progressEngineService.js";

test("buildProgressSnapshot calculates progress from completed lesson ids", () => {
  const course = {
    modules: [
      {
        lessons: [
          { lessonId: "video-1", lessonType: "video" },
          { lessonId: "pdf-1", lessonType: "pdf" },
          { lessonId: "quiz-1", lessonType: "quiz", lessonCompletionRules: { passingScore: 80 } },
        ],
      },
    ],
  };

  const snapshot = buildProgressSnapshot({
    course,
    progressRecord: { completedLectures: ["video-1", "pdf-1"], completedLessons: ["video-1"] },
    legacyProgress: ["video-1", "pdf-1"],
  });

  assert.equal(snapshot.totalLessons, 3);
  assert.equal(snapshot.completedCount, 2);
  assert.equal(snapshot.completionPercentage, 67);
  assert.deepEqual(snapshot.completedLessons, ["video-1", "pdf-1"]);
  assert.equal(snapshot.completionByType.video.completed, 1);
});

test("normalizeProgressRecord keeps legacy aliases in sync", () => {
  const progress = normalizeProgressRecord({ completedLectures: ["a"], completedLessons: ["b"] }, ["c"]);
  assert.deepEqual(progress.completedLessons, ["a", "b", "c"]);
  assert.deepEqual(progress.completedLectures, ["a", "b", "c"]);
});

test("canCompleteLesson validates quiz and assignment completion rules", () => {
  assert.equal(canCompleteLesson({ lessonType: "quiz", lessonCompletionRules: { passingScore: 80 } }, { score: 85 }), true);
  assert.equal(canCompleteLesson({ lessonType: "assignment" }, { submissionStatus: "submitted" }), true);
  assert.equal(canCompleteLesson({ lessonType: "video" }, { watchPercent: 92 }), true);
});

test("getCourseLessons supports both module and legacy chapter structures", () => {
  const lessons = getCourseLessons({
    courseContent: [
      {
        chapterContent: [{ lectureId: "legacy-lesson", lectureType: "pdf" }],
      },
    ],
  });

  assert.equal(lessons.length, 1);
  assert.equal(lessons[0].lessonType, "pdf");
  assert.equal(lessons[0].lessonId, "legacy-lesson");
});