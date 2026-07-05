import fs from "fs";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { normalizeResourceType } from "../services/resourceService.js";

const buildResourceMetadata = (file, uploaded) => {
  const resourceType = normalizeResourceType({
    resourceType: uploaded.resource_type || file?.mimetype || "",
    resourceMimeType: file?.mimetype || "",
    resourceFileName: file?.originalname || "",
    resourceUrl: uploaded.secure_url || "",
  });

  const resourceThumbnail =
    uploaded.thumbnail_url ||
    (resourceType === "image" ? uploaded.secure_url : "") ||
    "";

  return {
    resourceId: randomUUID(),
    resourceTitle: file?.originalname || "Untitled resource",
    resourceType,
    resourceUrl: uploaded.secure_url,
    resourceFileName: file?.originalname || "",
    resourceMimeType: file?.mimetype || "",
    resourceSize: file?.size || 0,
    resourceDuration: Number(uploaded.duration || 0),
    resourceThumbnail,
    resourceTranscriptPlaceholder: "",
    resourceUploadDate: new Date().toISOString(),
    resourceOrder: 1,
    resourcePublicId: uploaded.public_id,
    resourceStorageType: uploaded.resource_type || "auto",
  };
};

export const uploadLessonResource = async (req, res) => {
  try {
    const file = req.file;

    if (!file?.path) {
      return res.status(400).json({ success: false, message: "Lesson resource file is required" });
    }

    const uploaded = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder: "lms/lesson-resources",
    });

    fs.unlinkSync(file.path);

    const resource = buildResourceMetadata(file, uploaded);

    return res.json({
      success: true,
      resource,
      file: {
        url: resource.resourceUrl,
        publicId: resource.resourcePublicId,
        fileName: resource.resourceFileName,
        mimeType: resource.resourceMimeType,
        size: resource.resourceSize,
        resourceType: resource.resourceStorageType,
      },
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadLessonAsset = uploadLessonResource;
