import mongoose from "mongoose";

const studyBookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: String,
      required: true,
      index: true,
    },
    lessonTitle: {
      type: String,
      required: true,
      default: "",
    },
    lessonType: {
      type: String,
      default: "lesson",
    },
    lessonUrl: {
      type: String,
      default: "",
    },
    positionType: {
      type: String,
      enum: ["lesson", "video", "pdf", "manual"],
      default: "lesson",
    },
    positionLabel: {
      type: String,
      default: "",
    },
    positionSeconds: {
      type: Number,
      default: 0,
    },
    pdfPage: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

studyBookmarkSchema.index({ user: 1, course: 1, lessonId: 1, positionLabel: 1 });

const StudyBookmark = mongoose.models.StudyBookmark || mongoose.model("StudyBookmark", studyBookmarkSchema);

export default StudyBookmark;
