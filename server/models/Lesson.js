import mongoose from "mongoose";
import lessonResourceSchema, { RESOURCE_TYPES } from "./Resource.js";

const lessonSchema = new mongoose.Schema(
  {
    lessonId: {
      type: String,
      required: true,
    },
    lessonTitle: {
      type: String,
      required: true,
    },
    lessonDuration: {
      type: Number,
      default: 0,
    },
    lessonType: {
      type: String,
      enum: [...RESOURCE_TYPES, "rich_text", "quiz", "assignment"],
      default: "video",
    },
    lessonCompletionRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lessonVideoUrl: {
      type: String,
      default: "",
    },
    lessonPdfUrl: {
      type: String,
      default: "",
    },
    lessonRichTextContent: {
      type: String,
      default: "",
    },
    lessonExternalLink: {
      type: String,
      default: "",
    },
    lessonTranscriptPlaceholder: {
      type: String,
      default: "",
    },
    lessonResources: {
      type: [lessonResourceSchema],
      default: [],
    },
    lessonAttachments: {
      type: [lessonResourceSchema],
      default: [],
    },
    isPreviewFree: {
      type: Boolean,
      default: false,
    },
    lessonStatus: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    previewMode: {
      type: Boolean,
      default: false,
    },
    lessonOrder: {
      type: Number,
      default: 1,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, module: 1, lessonOrder: 1 });
lessonSchema.index({ course: 1, lessonId: 1 });
lessonSchema.index({ course: 1, lessonStatus: 1 });

const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);

export default Lesson;
