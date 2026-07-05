import mongoose from "mongoose";

const quizResponseSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionType: { type: String, required: true },
    selectedOptions: { type: [String], default: [] },
    textAnswer: { type: String, default: "", trim: true },
    isCorrect: { type: Boolean, default: false },
    scoreAwarded: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    feedback: { type: String, default: "", trim: true },
    correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    explanation: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attemptNumber: { type: Number, required: true },
    status: { type: String, enum: ["in_progress", "submitted", "graded", "needs_review", "expired"], default: "submitted" },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    timeSpentSeconds: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    reviewMode: { type: Boolean, default: true },
    instantEvaluation: { type: Boolean, default: true },
    responses: { type: [quizResponseSchema], default: [] },
    gradedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    historySnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, minimize: false }
);

quizAttemptSchema.index({ quiz: 1, student: 1, attemptNumber: -1 });
quizAttemptSchema.index({ course: 1, student: 1, updatedAt: -1 });
quizAttemptSchema.index({ student: 1, course: 1 });

const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
