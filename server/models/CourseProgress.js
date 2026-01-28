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
    completedLectures: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const CourseProgress =
  mongoose.models.CourseProgress ||
  mongoose.model("CourseProgress", courseProgressSchema);

export default CourseProgress;
