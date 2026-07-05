import { randomUUID } from "crypto";
import { RESOURCE_TYPES } from "../models/Resource.js";

const CODE_MIME_TYPES = new Set([
  "application/json",
  "application/javascript",
  "application/x-javascript",
  "application/ecmascript",
  "application/typescript",
  "application/x-typescript",
  "text/javascript",
  "text/typescript",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/x-python",
  "text/x-java-source",
  "text/x-c",
  "text/x-c++",
  "text/x-csharp",
  "text/x-shellscript",
  "application/x-sh",
  "application/x-python-code",
]);

const EXTENSION_MAP = new Map([
  ["mp4", "video"],
  ["mov", "video"],
  ["webm", "video"],
  ["mkv", "video"],
  ["pdf", "pdf"],
  ["png", "image"],
  ["jpg", "image"],
  ["jpeg", "image"],
  ["webp", "image"],
  ["gif", "image"],
  ["svg", "image"],
  ["bmp", "image"],
  ["zip", "zip"],
  ["rar", "zip"],
  ["7z", "zip"],
  ["tar", "zip"],
  ["gz", "zip"],
  ["js", "code"],
  ["jsx", "code"],
  ["ts", "code"],
  ["tsx", "code"],
  ["mjs", "code"],
  ["cjs", "code"],
  ["json", "code"],
  ["md", "code"],
  ["txt", "code"],
  ["py", "code"],
  ["java", "code"],
  ["c", "code"],
  ["cpp", "code"],
  ["cs", "code"],
  ["php", "code"],
  ["rb", "code"],
  ["go", "code"],
  ["rs", "code"],
  ["sh", "code"],
  ["html", "code"],
  ["htm", "code"],
  ["css", "code"],
  ["scss", "code"],
  ["sql", "code"],
]);

const slugLike = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toPositiveNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};

export const isValidResourceType = (value) => RESOURCE_TYPES.includes(value);

export const inferResourceTypeFromMime = (mime = "", fileName = "") => {
  const normalizedMime = String(mime || "").toLowerCase();
  if (normalizedMime.startsWith("video/")) return "video";
  if (normalizedMime.startsWith("image/")) return "image";
  if (normalizedMime === "application/pdf") return "pdf";
  if (
    normalizedMime === "application/zip" ||
    normalizedMime === "application/x-zip-compressed" ||
    normalizedMime === "multipart/x-zip" ||
    normalizedMime === "application/x-7z-compressed" ||
    normalizedMime === "application/x-rar-compressed"
  ) {
    return "zip";
  }

  if (CODE_MIME_TYPES.has(normalizedMime) || normalizedMime.startsWith("text/")) {
    return "code";
  }

  const extension = String(fileName || "")
    .split("?")[0]
    .split(".")
    .pop()
    .toLowerCase();

  if (EXTENSION_MAP.has(extension)) {
    return EXTENSION_MAP.get(extension);
  }

  return "video";
};

export const normalizeResourceType = (resource = {}) => {
  const explicit =
    resource.resourceType || resource.type || resource.contentType || resource.lessonType || resource.lectureType;

  if (isValidResourceType(explicit)) {
    return explicit;
  }

  if (resource.resourceUrl || resource.url || resource.externalLink || resource.link) {
    return "external_link";
  }

  return inferResourceTypeFromMime(
    resource.resourceMimeType || resource.mimeType || resource.attachmentMimeType || "",
    resource.resourceFileName || resource.fileName || resource.name || resource.attachmentFileName || ""
  );
};

const normalizeDateValue = (value) => {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export const normalizeResourceRecord = (resource = {}, index = 0) => {
  const resourceType = normalizeResourceType(resource);
  const resourceUrl =
    resource.resourceUrl ||
    resource.url ||
    resource.link ||
    resource.externalLink ||
    resource.attachmentUrl ||
    resource.lectureUrl ||
    resource.lessonVideoUrl ||
    resource.lessonPdfUrl ||
    resource.lessonExternalLink ||
    "";

  const resourceTitle =
    resource.resourceTitle ||
    resource.title ||
    resource.label ||
    resource.name ||
    resource.attachmentLabel ||
    resource.lectureTitle ||
    `Resource ${index + 1}`;

  return {
    resourceId: resource.resourceId || resource.id || resource._id?.toString() || randomUUID(),
    resourceTitle,
    resourceType,
    resourceUrl,
    resourceFileName:
      resource.resourceFileName || resource.fileName || resource.filename || resource.attachmentFileName || "",
    resourceMimeType:
      resource.resourceMimeType || resource.mimeType || resource.type || resource.attachmentMimeType || "",
    resourceSize: toPositiveNumber(resource.resourceSize || resource.size || resource.attachmentSize, 0),
    resourceDuration: toPositiveNumber(resource.resourceDuration || resource.duration, 0),
    resourceThumbnail:
      resource.resourceThumbnail || resource.thumbnailUrl || resource.thumbnail || resource.previewImage || "",
    resourceTranscriptPlaceholder:
      resource.resourceTranscriptPlaceholder ||
      resource.transcriptPlaceholder ||
      resource.lessonTranscriptPlaceholder ||
      resource.lectureTranscriptPlaceholder ||
      "",
    resourceUploadDate: normalizeDateValue(resource.resourceUploadDate || resource.uploadDate || resource.createdAt),
    resourceOrder: toPositiveNumber(resource.resourceOrder || resource.order || resource.attachmentOrder, index + 1),
    resourcePublicId: resource.resourcePublicId || resource.publicId || "",
    resourceStorageType: resource.resourceStorageType || resource.storageType || "auto",
  };
};

export const normalizeResourceCollection = (...resourceGroups) => {
  const flat = resourceGroups.flatMap((group) => (Array.isArray(group) ? group : []));
  const seen = new Map();

  flat.forEach((resource, index) => {
    const normalized = normalizeResourceRecord(resource, index);
    const key = slugLike(
      normalized.resourceId || `${normalized.resourceType}-${normalized.resourceUrl}-${normalized.resourceTitle}`
    );

    if (!seen.has(key)) {
      seen.set(key, normalized);
    }
  });

  return Array.from(seen.values()).sort((left, right) => left.resourceOrder - right.resourceOrder);
};

export const resourceToLegacyAttachment = (resource = {}) => ({
  attachmentId: resource.resourceId,
  attachmentLabel: resource.resourceTitle,
  attachmentUrl: resource.resourceUrl,
  attachmentFileName: resource.resourceFileName,
  attachmentMimeType: resource.resourceMimeType,
  attachmentSize: resource.resourceSize,
  attachmentResourceType: resource.resourceStorageType || "auto",
});

export const resourceToLegacyLectureFields = (resource = {}) => ({
  lectureResourceId: resource.resourceId,
  lectureResourceTitle: resource.resourceTitle,
  lectureResourceType: resource.resourceType,
  lectureResourceUrl: resource.resourceUrl,
  lectureResourceFileName: resource.resourceFileName,
  lectureResourceMimeType: resource.resourceMimeType,
  lectureResourceSize: resource.resourceSize,
  lectureResourceDuration: resource.resourceDuration,
  lectureResourceThumbnail: resource.resourceThumbnail,
  lectureResourceTranscriptPlaceholder: resource.resourceTranscriptPlaceholder,
  lectureResourceUploadDate: resource.resourceUploadDate,
  lectureResourceOrder: resource.resourceOrder,
  lectureResourcePublicId: resource.resourcePublicId,
  lectureResourceStorageType: resource.resourceStorageType,
});

export const resourceToLessonFields = (resource = {}) => ({
  lessonResourceId: resource.resourceId,
  lessonResourceTitle: resource.resourceTitle,
  lessonResourceType: resource.resourceType,
  lessonResourceUrl: resource.resourceUrl,
  lessonResourceFileName: resource.resourceFileName,
  lessonResourceMimeType: resource.resourceMimeType,
  lessonResourceSize: resource.resourceSize,
  lessonResourceDuration: resource.resourceDuration,
  lessonResourceThumbnail: resource.resourceThumbnail,
  lessonResourceTranscriptPlaceholder: resource.resourceTranscriptPlaceholder,
  lessonResourceUploadDate: resource.resourceUploadDate,
  lessonResourceOrder: resource.resourceOrder,
  lessonResourcePublicId: resource.resourcePublicId,
  lessonResourceStorageType: resource.resourceStorageType,
});

export const resourceToSerializedResource = (resource = {}) => {
  const normalized = normalizeResourceRecord(resource);
  return {
    ...normalized,
    resourceUrl: normalized.resourceUrl || "",
    resourceThumbnail: normalized.resourceThumbnail || "",
  };
};
