import mongoose from "mongoose";

export const RESOURCE_TYPES = [
  "video",
  "pdf",
  "image",
  "zip",
  "code",
  "external_link",
];

export const lessonResourceSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String,
      required: true,
      trim: true,
    },

    resourceTitle: {
      type: String,
      required: true,
      trim: true,
    },

    resourceType: {
      type: String,
      enum: RESOURCE_TYPES,
      default: "video",
    },

    resourceUrl: {
      type: String,
      default: "",
      trim: true,
    },

    resourceFileName: {
      type: String,
      default: "",
      trim: true,
    },

    resourceMimeType: {
      type: String,
      default: "",
      trim: true,
    },

    resourceSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    resourceDuration: {
      type: Number,
      default: 0,
      min: 0,
    },

    resourceThumbnail: {
      type: String,
      default: "",
      trim: true,
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
      min: 1,
    },

    resourcePublicId: {
      type: String,
      default: "",
      trim: true,
    },

    resourceStorageType: {
      type: String,
      default: "auto",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

export default lessonResourceSchema;