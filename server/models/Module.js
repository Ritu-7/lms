import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    moduleId: {
      type: String,
      required: true,
    },
    moduleTitle: {
      type: String,
      required: true,
    },
    moduleOrder: {
      type: Number,
      default: 1,
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
  },
  { timestamps: true }
);

moduleSchema.index({ course: 1, moduleOrder: 1 });
moduleSchema.index({ course: 1, moduleId: 1 });

const Module = mongoose.models.Module || mongoose.model("Module", moduleSchema);

export default Module;
