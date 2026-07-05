import mongoose from "mongoose";
import lessonResourceSchema from "./Resource.js";

const rubricScoreSchema = new mongoose.Schema(
  {
    rubricId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    maxScore: { type: Number, required: true, min: 0 },
    score: { type: Number, default: 0, min: 0 },
    feedback: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    attemptNumber: { type: Number, required: true },
    submittedAt: { type: Date, required: true },
    isLate: { type: Boolean, default: false },
    textResponse: { type: String, default: "", trim: true },
    attachments: { type: [lessonResourceSchema], default: [] },
    status: { type: String, enum: ["submitted", "late_submitted", "needs_resubmission", "graded", "returned"], default: "submitted" },
    totalScore: { type: Number, default: 0, min: 0 },
    maxScore: { type: Number, default: 0, min: 0 },
    gradeLabel: { type: String, default: "", trim: true },
    feedback: { type: String, default: "", trim: true },
    rubricScores: { type: [rubricScoreSchema], default: [] },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false }
);

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["not_submitted", "submitted", "late_submitted", "needs_resubmission", "graded", "returned"], default: "not_submitted" },
    attemptCount: { type: Number, default: 0, min: 0 },
    submittedAt: { type: Date, default: null },
    gradedAt: { type: Date, default: null },
    isLate: { type: Boolean, default: false },
    totalScore: { type: Number, default: 0, min: 0 },
    maxScore: { type: Number, default: 0, min: 0 },
    gradeLabel: { type: String, default: "", trim: true },
    feedback: { type: String, default: "", trim: true },
    textResponse: { type: String, default: "", trim: true },
    attachments: { type: [lessonResourceSchema], default: [] },
    rubricScores: { type: [rubricScoreSchema], default: [] },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    latestAttempt: { type: attemptSchema, default: null },
    attempts: { type: [attemptSchema], default: [] },
    resubmissionRequestedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    latePenaltyApplied: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true, minimize: false }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ course: 1, status: 1, updatedAt: -1 });
assignmentSubmissionSchema.index({ student: 1, course: 1 });

const AssignmentSubmission =
  mongoose.models.AssignmentSubmission || mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);

export default AssignmentSubmission;
