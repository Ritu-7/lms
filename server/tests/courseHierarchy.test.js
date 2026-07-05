import test from "node:test";
import assert from "node:assert/strict";
import {
  modulesToLegacyCourseContent,
  normalizeLegacyCourseContent,
  serializeCourseHierarchy,
} from "../services/courseHierarchyService.js";

test("normalizeLegacyCourseContent converts chapters and lectures into modules and lessons", () => {
  const normalized = normalizeLegacyCourseContent([
    {
      chapterId: "chapter-1",
      chapterOrder: 1,
      chapterTitle: "Intro",
      collapsed: true,
      chapterContent: [
        {
          lectureId: "lesson-1",
          lectureTitle: "Welcome",
          lectureDuration: 5,
          lectureUrl: "https://example.com/preview",
          isPreviewFree: true,
          lectureOrder: 1,
        },
      ],
    },
  ]);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].moduleId, "chapter-1");
  assert.equal(normalized[0].lessons[0].lessonId, "lesson-1");
  assert.equal(normalized[0].lessons[0].lessonTitle, "Welcome");
});

test("modulesToLegacyCourseContent preserves the legacy chapter/lecture shape", () => {
  const legacy = modulesToLegacyCourseContent([
    {
      moduleId: "module-1",
      moduleOrder: 2,
      moduleTitle: "Basics",
      lessons: [
        {
          lessonId: "lesson-1",
          lessonTitle: "Intro",
          lessonDuration: 8,
          lessonUrl: "https://example.com/video",
          isPreviewFree: false,
          lessonOrder: 1,
        },
      ],
    },
  ]);

  assert.equal(legacy[0].chapterId, "module-1");
  assert.equal(legacy[0].chapterTitle, "Basics");
  assert.equal(legacy[0].chapterContent[0].lectureId, "lesson-1");
});

test("serializeCourseHierarchy hides protected lesson URLs when requested", () => {
  const serialized = serializeCourseHierarchy(
    {
      _id: "course-1",
      courseTitle: "Test Course",
      modules: [
        {
          _id: "module-object-id",
          moduleId: "module-1",
          moduleTitle: "Basics",
          moduleOrder: 1,
          lessons: [
            {
              _id: "lesson-object-id",
              lessonId: "lesson-1",
              lessonTitle: "Paid Lesson",
              lessonDuration: 10,
              lessonUrl: "https://example.com/paid",
              isPreviewFree: false,
              lessonOrder: 1,
            },
          ],
        },
      ],
    },
    { hideRestrictedUrls: true }
  );

  assert.equal(serialized.courseContent[0].chapterContent[0].lectureUrl, "");
  assert.equal(serialized.modules[0].lessons[0].lessonUrl, "");
});

test("normalizeLegacyCourseContent preserves richer lesson fields", () => {
  const normalized = normalizeLegacyCourseContent([
    {
      chapterId: "chapter-2",
      chapterTitle: "Resources",
      chapterOrder: 2,
      chapterContent: [
        {
          lectureId: "lesson-2",
          lectureTitle: "Study Pack",
          lectureDuration: 12,
          lectureType: "pdf",
          lecturePdfUrl: "https://example.com/guide.pdf",
          lectureRichTextContent: "<p>Notes</p>",
          lectureExternalLink: "https://example.com/reference",
          lectureTranscriptPlaceholder: "Transcript coming soon",
          lectureAttachments: [
            {
              attachmentId: "attachment-1",
              attachmentLabel: "Slides",
              attachmentUrl: "https://example.com/slides.pdf",
            },
          ],
          lectureStatus: "published",
          previewMode: true,
          lectureOrder: 1,
        },
      ],
    },
  ]);

  const lesson = normalized[0].lessons[0];
  assert.equal(lesson.lessonType, "pdf");
  assert.equal(lesson.lessonPdfUrl, "https://example.com/guide.pdf");
  assert.equal(lesson.lessonTranscriptPlaceholder, "Transcript coming soon");
  assert.equal(lesson.lessonAttachments[0].attachmentLabel, "Slides");
  assert.equal(lesson.lessonStatus, "published");
  assert.equal(lesson.previewMode, true);
});

test("normalizeLegacyCourseContent preserves lesson completion rules and new lesson types", () => {
  const normalized = normalizeLegacyCourseContent([
    {
      chapterId: "chapter-3",
      chapterTitle: "Assessments",
      chapterContent: [
        {
          lectureId: "lesson-quiz",
          lectureTitle: "Quiz",
          lectureType: "quiz",
          lectureCompletionRules: {
            mode: "score",
            passingScore: 80,
          },
        },
      ],
    },
  ]);

  assert.equal(normalized[0].lessons[0].lessonType, "quiz");
  assert.equal(normalized[0].lessons[0].lessonCompletionRules.passingScore, 80);
  assert.equal(
    modulesToLegacyCourseContent([{ moduleId: "module-quiz", lessons: normalized[0].lessons }])[0].chapterContent[0].lectureType,
    "quiz"
  );
});
