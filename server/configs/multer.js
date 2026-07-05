import multer from "multer";

const storage = multer.diskStorage({});
const allowedImages = new Set(["image/jpeg", "image/png", "image/webp"]);

const isLessonAssetType = (mimetype) => {
  if (!mimetype) return false;
  if (allowedImages.has(mimetype)) return true;
  if (mimetype === "application/pdf") return true;
  if (mimetype.startsWith("video/")) return true;
  if (mimetype.startsWith("image/")) return true;
  if (mimetype.startsWith("text/")) return true;
  if (mimetype === "application/json") return true;
  if (mimetype === "application/javascript") return true;
  if (mimetype === "application/x-javascript") return true;
  if (mimetype === "application/ecmascript") return true;
  if (mimetype === "application/typescript") return true;
  if (mimetype === "application/x-typescript") return true;
  if (mimetype === "application/msword") return true;
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return true;
  if (mimetype === "application/vnd.ms-powerpoint") return true;
  if (mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return true;
  if (mimetype === "application/zip") return true;
  if (mimetype === "application/x-zip-compressed") return true;
  if (mimetype === "application/x-7z-compressed") return true;
  if (mimetype === "application/x-rar-compressed") return true;
  if (mimetype === "application/octet-stream") return true;
  return false;
};

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024) },
  fileFilter: (_req, file, callback) => {
    const allowed = allowedImages.has(file.mimetype);
    callback(allowed ? null : new multer.MulterError("LIMIT_UNEXPECTED_FILE"), allowed);
  },
});

export const lessonAssetUpload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_LESSON_ASSET_BYTES || 50 * 1024 * 1024) },
  fileFilter: (_req, file, callback) => {
    const allowed = isLessonAssetType(file.mimetype);
    callback(allowed ? null : new multer.MulterError("LIMIT_UNEXPECTED_FILE"), allowed);
  },
});

export default upload;
