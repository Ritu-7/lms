import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    courseId: {
      type: String,
      required: true,
    },
    completedLessons: {
      type: [String],
      default: [],
    },
    completedLectures: {
      type: [String],
      default: [],
    },
    progressVersion: {
      type: Number,
      default: 2,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CourseProgress =
  mongoose.models.CourseProgress ||
  mongoose.model("CourseProgress", courseProgressSchema);

export default CourseProgress;
