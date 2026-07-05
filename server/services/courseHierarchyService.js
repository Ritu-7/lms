import { randomUUID } from "crypto";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import {
  normalizeResourceCollection,
  resourceToLegacyAttachment,
  resourceToLessonFields,
  resourceToLegacyLectureFields,
} from "./resourceService.js";

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

const normalizeId = (value) => value || randomUUID();

const toPositiveNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};

const isValidLessonType = (value) => ["video", "pdf", "image", "zip", "code", "rich_text", "external_link", "quiz", "assignment"].includes(value);

const inferLessonType = (lesson = {}) => {
  const explicit = lesson.lessonType || lesson.contentType || lesson.lectureType;
  if (isValidLessonType(explicit)) return explicit;

  const resources = normalizeResourceCollection(
    lesson.lessonResources,
    lesson.resources,
    lesson.lessonAttachments,
    lesson.attachments,
    lesson.lectureResources,
    lesson.lectureAttachments
  );

  if (resources.length) {
    const primary = resources[0];
    if (isValidLessonType(primary.resourceType)) {
      return primary.resourceType;
    }
  }

  if (lesson.lessonPdfUrl || lesson.lecturePdfUrl || lesson.pdfUrl) return "pdf";
  if (lesson.lessonRichTextContent || lesson.lectureRichTextContent || lesson.richTextContent) return "rich_text";
  if (lesson.lessonExternalLink || lesson.lectureExternalLink || lesson.externalLink) return "external_link";
  return "video";
};

export const normalizeLessonRecord = (lesson = {}, index = 0) => {
  const lessonResources = normalizeResourceCollection(
    lesson.lessonResources,
    lesson.resources,
    lesson.lessonAttachments,
    lesson.attachments,
    lesson.lectureResources,
    lesson.lectureAttachments
  );
  const lessonType = inferLessonType({ ...lesson, lessonResources });

  const lessonVideoUrl = lesson.lessonVideoUrl || lesson.lectureUrl || lesson.videoUrl || "";
  const lessonPdfUrl = lesson.lessonPdfUrl || lesson.lecturePdfUrl || lesson.pdfUrl || "";
  const lessonRichTextContent =
    lesson.lessonRichTextContent || lesson.lectureRichTextContent || lesson.richTextContent || "";
  const lessonExternalLink = lesson.lessonExternalLink || lesson.lectureExternalLink || lesson.externalLink || "";
  const transcriptPlaceholder =
    lesson.lessonTranscriptPlaceholder ||
    lesson.lectureTranscriptPlaceholder ||
    lesson.transcriptPlaceholder ||
    lesson.transcript ||
    "";
  const legacyAttachments = lessonResources.map((resource) => resourceToLegacyAttachment(resource));

  return {
    lessonId: normalizeId(lesson.lessonId || lesson.lectureId),
    lessonTitle: lesson.lessonTitle || lesson.lectureTitle || `Lesson ${index + 1}`,
    lessonDuration: toPositiveNumber(lesson.lessonDuration || lesson.lectureDuration, 0),
    lessonType,
    lessonCompletionRules: lesson.lessonCompletionRules || lesson.lectureCompletionRules || lesson.completionRules || {},
    lessonVideoUrl,
    lessonPdfUrl,
    lessonRichTextContent,
    lessonExternalLink,
    lessonTranscriptPlaceholder: transcriptPlaceholder,
    lessonResources,
    lessonAttachments: legacyAttachments,
    isPreviewFree: Boolean(lesson.isPreviewFree || lesson.previewMode),
    lessonStatus: lesson.lessonStatus || lesson.lectureStatus || lesson.status || "draft",
    previewMode: Boolean(lesson.previewMode || lesson.isPreviewFree),
    lessonOrder: toPositiveNumber(lesson.lessonOrder || lesson.lectureOrder, index + 1),
  };
};

const getPrimaryLessonUrl = (lesson) => {
  if (!lesson) return "";
  const primaryResource = Array.isArray(lesson.lessonResources) && lesson.lessonResources.length ? lesson.lessonResources[0] : null;
  if (primaryResource?.resourceUrl) {
    return primaryResource.resourceUrl;
  }
  switch (lesson.lessonType) {
    case "pdf":
      return lesson.lessonPdfUrl || "";
    case "image":
    case "zip":
    case "code":
    case "rich_text":
      return "";
    case "external_link":
      return lesson.lessonExternalLink || "";
    case "video":
    default:
      return lesson.lessonUrl || lesson.lessonVideoUrl || lesson.lessonPdfUrl || lesson.lessonExternalLink || "";
  }
};

export const normalizeLegacyCourseContent = (courseContent = []) => {
  if (!Array.isArray(courseContent)) return [];

  return courseContent.map((chapter, chapterIndex) => {
    const lessons = Array.isArray(chapter?.chapterContent) ? chapter.chapterContent : [];

    return {
      moduleId: normalizeId(chapter?.chapterId),
      moduleTitle: chapter?.chapterTitle || `Module ${chapterIndex + 1}`,
      moduleOrder: toPositiveNumber(chapter?.chapterOrder, chapterIndex + 1),
      collapsed: Boolean(chapter?.collapsed),
      lessons: lessons.map((lesson, lessonIndex) => normalizeLessonRecord(lesson, lessonIndex)),
    };
  });
};

const serializeLesson = (lesson = {}, index = 0) => {
  const normalized = normalizeLessonRecord(lesson, index);
  const primaryUrl = getPrimaryLessonUrl(normalized) || lesson.lectureUrl || "";
  const serializedResources = normalized.lessonResources.map((resource) => ({
    ...resource,
    ...resourceToLessonFields(resource),
    ...resourceToLegacyLectureFields(resource),
    attachmentId: resource.resourceId,
    attachmentLabel: resource.resourceTitle,
    attachmentUrl: resource.resourceUrl,
    attachmentFileName: resource.resourceFileName,
    attachmentMimeType: resource.resourceMimeType,
    attachmentSize: resource.resourceSize,
    attachmentResourceType: resource.resourceStorageType || "auto",
  }));

  return {
    _id: lesson._id,
    lessonId: normalized.lessonId,
    lessonTitle: normalized.lessonTitle,
    lessonDuration: normalized.lessonDuration,
    lessonType: normalized.lessonType,
    contentType: normalized.lessonType,
    lessonCompletionRules: normalized.lessonCompletionRules,
    lessonVideoUrl: normalized.lessonVideoUrl,
    lessonPdfUrl: normalized.lessonPdfUrl,
    lessonRichTextContent: normalized.lessonRichTextContent,
    lessonExternalLink: normalized.lessonExternalLink,
    lessonTranscriptPlaceholder: normalized.lessonTranscriptPlaceholder,
    lessonResources: serializedResources,
    resources: serializedResources,
    lessonAttachments: serializedResources,
    lessonUrl: primaryUrl,
    isPreviewFree: normalized.isPreviewFree,
    previewMode: normalized.previewMode,
    lessonStatus: normalized.lessonStatus,
    status: normalized.lessonStatus,
    lessonOrder: normalized.lessonOrder,
    lectureId: normalized.lessonId,
    lectureTitle: normalized.lessonTitle,
    lectureDuration: normalized.lessonDuration,
    lectureUrl: primaryUrl,
    lectureType: normalized.lessonType,
    lectureCompletionRules: normalized.lessonCompletionRules,
    lectureVideoUrl: normalized.lessonVideoUrl,
    lecturePdfUrl: normalized.lessonPdfUrl,
    lectureRichTextContent: normalized.lessonRichTextContent,
    lectureExternalLink: normalized.lessonExternalLink,
    lectureTranscriptPlaceholder: normalized.lessonTranscriptPlaceholder,
    lectureResources: serializedResources,
    lectureAttachments: serializedResources,
    lectureStatus: normalized.lessonStatus,
    lectureOrder: normalized.lessonOrder,
  };
};

export const modulesToLegacyCourseContent = (modules = []) => {
  if (!Array.isArray(modules)) return [];

  return modules.map((module, moduleIndex) => {
    const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
    return {
      chapterId: module?.moduleId || module?._id?.toString() || normalizeId(),
      chapterOrder: toPositiveNumber(module?.moduleOrder, moduleIndex + 1),
      chapterTitle: module?.moduleTitle || `Module ${moduleIndex + 1}`,
      collapsed: Boolean(module?.collapsed),
      chapterContent: lessons.map((lesson, lessonIndex) => serializeLesson(lesson, lessonIndex)),
    };
  });
};

export const normalizeLegacyCourseData = (courseData = []) => normalizeLegacyCourseContent(courseData);

export const sanitizeCourseContent = (courseContent = [], { hideRestrictedUrls = false } = {}) =>
  normalizeLegacyCourseContent(courseContent).map((chapter) => ({
    ...chapter,
    chapterContent: chapter.lessons.map((lesson, index) => {
      const serialized = serializeLesson(lesson, index);
      if (!hideRestrictedUrls || serialized.isPreviewFree) {
        return serialized;
      }

      return {
        ...serialized,
        lectureUrl: "",
        lessonUrl: "",
        lessonVideoUrl: serialized.lessonType === "video" ? "" : serialized.lessonVideoUrl,
        lessonPdfUrl: serialized.lessonType === "pdf" ? "" : serialized.lessonPdfUrl,
        lessonResources: serialized.lessonResources.map((resource) => ({
          ...resource,
          resourceUrl: "",
        })),
        resources: serialized.lessonResources.map((resource) => ({
          ...resource,
          resourceUrl: "",
        })),
        lessonAttachments: serialized.lessonResources.map((resource) => ({
          ...resource,
          attachmentUrl: "",
        })),
        lessonExternalLink: serialized.lessonType === "external_link" ? "" : serialized.lessonExternalLink,
      };
    }),
  }));

export const createHierarchyForCourse = async (courseId, courseContent = []) => {
  const modules = normalizeLegacyCourseContent(courseContent);
  const createdModuleIds = [];
  const createdLessonIds = [];

  try {
    for (const moduleData of modules) {
      const moduleDoc = await Module.create({
        moduleId: moduleData.moduleId,
        moduleTitle: moduleData.moduleTitle,
        moduleOrder: moduleData.moduleOrder,
        collapsed: moduleData.collapsed,
        course: courseId,
        lessons: [],
      });

      createdModuleIds.push(moduleDoc._id);

      const lessonIds = [];
      for (const lessonData of moduleData.lessons) {
        const lessonResources = normalizeResourceCollection(
          lessonData.lessonResources,
          lessonData.resources,
          lessonData.lessonAttachments
        );
        const lessonDoc = await Lesson.create({
          lessonId: lessonData.lessonId,
          lessonTitle: lessonData.lessonTitle,
          lessonDuration: lessonData.lessonDuration,
          lessonType: lessonData.lessonType,
          lessonCompletionRules: lessonData.lessonCompletionRules,
          lessonVideoUrl: lessonData.lessonVideoUrl,
          lessonPdfUrl: lessonData.lessonPdfUrl,
          lessonRichTextContent: lessonData.lessonRichTextContent,
          lessonExternalLink: lessonData.lessonExternalLink,
          lessonTranscriptPlaceholder: lessonData.lessonTranscriptPlaceholder,
          lessonResources,
          lessonAttachments: lessonResources.map((resource) => resourceToLegacyAttachment(resource)),
          isPreviewFree: lessonData.isPreviewFree,
          previewMode: lessonData.previewMode,
          lessonStatus: lessonData.lessonStatus,
          lessonOrder: lessonData.lessonOrder,
          course: courseId,
          module: moduleDoc._id,
        });

        createdLessonIds.push(lessonDoc._id);
        lessonIds.push(lessonDoc._id);
      }

      moduleDoc.lessons = lessonIds;
      await moduleDoc.save();
    }

    return {
      modules: createdModuleIds,
      legacyCourseContent: modulesToLegacyCourseContent(modules),
      createdModuleIds,
      createdLessonIds,
    };
  } catch (error) {
    if (createdLessonIds.length) {
      await Lesson.deleteMany({ _id: { $in: createdLessonIds } });
    }
    if (createdModuleIds.length) {
      await Module.deleteMany({ _id: { $in: createdModuleIds } });
    }
    throw error;
  }
};

export const replaceHierarchyForCourse = async (course, courseContent = []) => {
  const previousModuleIds = Array.isArray(course.modules) ? course.modules.map((id) => id.toString()) : [];
  const { createdModuleIds, createdLessonIds, legacyCourseContent } = await createHierarchyForCourse(
    course._id,
    courseContent
  );

  course.modules = createdModuleIds;
  course.courseContent = legacyCourseContent;
  course.markModified("modules");
  course.markModified("courseContent");
  await course.save();

  if (previousModuleIds.length) {
    try {
      await Module.deleteMany({
        course: course._id,
        _id: { $nin: createdModuleIds },
      });
      await Lesson.deleteMany({
        course: course._id,
        module: { $nin: createdModuleIds },
      });
    } catch {
      // Best-effort cleanup; the new hierarchy is already persisted.
    }
  }

  return {
    modules: createdModuleIds,
    lessons: createdLessonIds,
    courseContent: legacyCourseContent,
  };
};

export const serializeCourseHierarchy = (courseDoc, { hideRestrictedUrls = false } = {}) => {
  const course = clone(courseDoc) || {};
  const populatedModules = Array.isArray(course.modules) && course.modules.length ? course.modules : [];
  const normalizedModules = populatedModules.map((module, index) => {
    const lessons = Array.isArray(module.lessons) ? module.lessons : [];
    return {
      _id: module._id,
      moduleId: module.moduleId || module._id?.toString(),
      moduleTitle: module.moduleTitle || `Module ${index + 1}`,
      moduleOrder: toPositiveNumber(module.moduleOrder, index + 1),
      collapsed: Boolean(module.collapsed),
      lessons: lessons.map((lesson, lessonIndex) => {
        const serialized = serializeLesson(lesson, lessonIndex);
        if (!hideRestrictedUrls || serialized.isPreviewFree) {
          return serialized;
        }

        return {
          ...serialized,
          lectureUrl: "",
          lessonUrl: "",
          lessonVideoUrl: serialized.lessonType === "video" ? "" : serialized.lessonVideoUrl,
          lessonPdfUrl: serialized.lessonType === "pdf" ? "" : serialized.lessonPdfUrl,
          lessonResources: serialized.lessonResources.map((resource) => ({
            ...resource,
            resourceUrl: "",
          })),
          resources: serialized.lessonResources.map((resource) => ({
            ...resource,
            resourceUrl: "",
          })),
          lessonAttachments: serialized.lessonResources.map((resource) => ({
            ...resource,
            attachmentUrl: "",
          })),
          lessonExternalLink: serialized.lessonType === "external_link" ? "" : serialized.lessonExternalLink,
        };
      }),
    };
  });

  const legacyCourseContent = normalizedModules.length
    ? modulesToLegacyCourseContent(normalizedModules)
    : sanitizeCourseContent(course.courseContent || [], { hideRestrictedUrls });

  return {
    ...course,
    modules: normalizedModules,
    courseContent: legacyCourseContent,
  };
};
