export const RESOURCE_TYPES = ["video", "pdf", "image", "zip", "code", "external_link"];

const toPositiveNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};

export const normalizeResourceType = (resource = {}) => {
  const explicit = resource.resourceType || resource.type || resource.contentType || resource.lessonType || resource.lectureType;
  if (RESOURCE_TYPES.includes(explicit)) return explicit;
  if (resource.resourceUrl || resource.url || resource.externalLink || resource.link) return "external_link";
  const mime = String(resource.resourceMimeType || resource.mimeType || resource.attachmentMimeType || "").toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime === "application/zip" || mime === "application/x-zip-compressed") return "zip";
  if (mime.startsWith("text/") || mime.includes("javascript") || mime.includes("typescript") || mime === "application/json") {
    return "code";
  }
  return "video";
};

export const normalizeResourceRecord = (resource = {}, index = 0) => ({
  resourceId: resource.resourceId || resource.id || resource._id?.toString() || `${Date.now()}-${index}`,
  resourceTitle:
    resource.resourceTitle || resource.title || resource.label || resource.name || resource.attachmentLabel || `Resource ${index + 1}`,
  resourceType: normalizeResourceType(resource),
  resourceUrl:
    resource.resourceUrl ||
    resource.url ||
    resource.link ||
    resource.externalLink ||
    resource.attachmentUrl ||
    resource.lessonVideoUrl ||
    resource.lessonPdfUrl ||
    resource.lessonExternalLink ||
    "",
  resourceFileName: resource.resourceFileName || resource.fileName || resource.filename || resource.attachmentFileName || "",
  resourceMimeType: resource.resourceMimeType || resource.mimeType || resource.attachmentMimeType || "",
  resourceSize: toPositiveNumber(resource.resourceSize || resource.size || resource.attachmentSize, 0),
  resourceDuration: toPositiveNumber(resource.resourceDuration || resource.duration, 0),
  resourceThumbnail: resource.resourceThumbnail || resource.thumbnailUrl || resource.thumbnail || "",
  resourceTranscriptPlaceholder:
    resource.resourceTranscriptPlaceholder || resource.transcriptPlaceholder || resource.lessonTranscriptPlaceholder || "",
  resourceUploadDate: resource.resourceUploadDate || resource.uploadDate || resource.createdAt || "",
  resourceOrder: toPositiveNumber(resource.resourceOrder || resource.order || resource.attachmentOrder, index + 1),
  resourcePublicId: resource.resourcePublicId || resource.publicId || "",
  resourceStorageType: resource.resourceStorageType || resource.storageType || "auto",
});

export const normalizeResourceCollection = (...groups) => {
  const seen = new Map();

  groups.flat().forEach((resource, index) => {
    if (!resource) return;
    const normalized = normalizeResourceRecord(resource, index);
    const key = normalized.resourceId || `${normalized.resourceType}:${normalized.resourceUrl}:${normalized.resourceTitle}`;
    if (!seen.has(key)) seen.set(key, normalized);
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

export const getResourceActionLabel = (resourceType = "video") => {
  switch (resourceType) {
    case "pdf":
      return "Open PDF";
    case "quiz":
      return "Take Quiz";
    case "assignment":
      return "Open Assignment";
    case "image":
      return "View Image";
    case "zip":
      return "Download ZIP";
    case "code":
      return "Open File";
    case "external_link":
      return "Open Link";
    default:
      return "Watch";
  }
};

export const getResourceBadgeLabel = (resourceType = "video") => {
  switch (resourceType) {
    case "pdf":
      return "PDF";
    case "quiz":
      return "Quiz";
    case "assignment":
      return "Assignment";
    case "image":
      return "Image";
    case "zip":
      return "ZIP";
    case "code":
      return "Code";
    case "external_link":
      return "Link";
    default:
      return "Video";
  }
};

export const formatResourceSize = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

