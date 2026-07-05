import mongoose from "mongoose";
import lessonResourceSchema from "./Resource.js";

const rubricItemSchema = new mongoose.Schema(
  {
    rubricId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    maxScore: { type: Number, required: true, min: 0 },
    order: { type: Number, default: 1 },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    instructions: { type: String, default: "", trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", default: null },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", default: null },
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    dueDate: { type: Date, required: true },
    allowLateSubmissions: { type: Boolean, default: true },
    latePenaltyPercent: { type: Number, default: 0, min: 0, max: 100 },
    maxAttempts: { type: Number, default: 3, min: 1 },
    totalPoints: { type: Number, default: 100, min: 0 },
    rubric: { type: [rubricItemSchema], default: [] },
    attachments: { type: [lessonResourceSchema], default: [] },
    tags: { type: [String], default: [] },
    submissionCount: { type: Number, default: 0 },
    gradedCount: { type: Number, default: 0 },
  },
  { timestamps: true, minimize: false }
);

assignmentSchema.index({ course: 1, status: 1, dueDate: -1 });
assignmentSchema.index({ educator: 1, createdAt: -1 });

const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);

export default Assignment;
