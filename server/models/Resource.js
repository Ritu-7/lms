import mongoose from "mongoose";

export const RESOURCE_TYPES = ["video", "pdf", "image", "zip", "code", "external_link"];

export const lessonResourceSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String,
      required: true,
    },
    resourceTitle: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      default: "video",
    },
    resourceUrl: {
      type: String,
      default: "",
    },
    resourceFileName: {
      type: String,
      default: "",
    },
    resourceMimeType: {
      type: String,
      default: "",
    },
    resourceSize: {
      type: Number,
      default: 0,
    },
    resourceDuration: {
      type: Number,
      default: 0,
    },
    resourceThumbnail: {
      type: String,
      default: "",
    },
    resourceTranscriptPlaceholder: {
      type: String,
      default: "",
    },
    resourceUploadDate: {
      type: Date,
      default: Date.now,
    },
    resourceOrder: {
      type: Number,
      default: 1,
    },
    resourcePublicId: {
      type: String,
      default: "",
    },
    resourceStorageType: {
      type: String,
      default: "auto",
    },
  },
  { _id: false }
);

export default lessonResourceSchema;
