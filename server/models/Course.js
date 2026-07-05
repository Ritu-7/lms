import mongoose from "mongoose";
import lessonResourceSchema, { RESOURCE_TYPES } from "./Resource.js";

const lectureSchema = new mongoose.Schema(
  {
    lectureId: String,
    lectureTitle: String,
    lectureDuration: Number,
    lectureUrl: String,
    lectureType: {
      type: String,
      enum: [...RESOURCE_TYPES, "rich_text", "quiz", "assignment"],
      default: "video",
    },
    lectureCompletionRules: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lectureVideoUrl: String,
    lecturePdfUrl: String,
    lectureRichTextContent: String,
    lectureExternalLink: String,
    lectureTranscriptPlaceholder: String,
    lectureResources: [lessonResourceSchema],
    lectureAttachments: [lessonResourceSchema],
    isPreviewFree: Boolean,
    previewMode: Boolean,
    lectureStatus: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    lectureOrder: Number,
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    chapterId: String,
    chapterOrder: Number,
    chapterTitle: String,
    chapterContent: [lectureSchema],
    collapsed: { type: Boolean, default: false },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseTitle: String,
    courseDescription: String,
    category: String,
    courseThumbnail: String,
    coursePrice: Number,
    discount: Number,
    isPublished: { type: Boolean, default: false },

    courseFeatures: [String],

    modules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
      },
    ],

    courseContent: [chapterSchema],

    courseRatings: [
      {
        userId: String, // Clerk ID
        rating: Number,
        review: String,
      },
    ],

    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentsEnrolled: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

  },
  { timestamps: true }
);

courseSchema.index({ educator: 1 });

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
