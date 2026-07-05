import mongoose from "mongoose";

const quizOptionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    prompt: { type: String, required: true, trim: true },
    questionType: {
      type: String,
      enum: ["mcq", "multiple_select", "true_false", "short_answer"],
      required: true,
    },
    options: { type: [quizOptionSchema], default: [] },
    correctAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    acceptableAnswers: { type: [String], default: [] },
    explanation: { type: String, default: "", trim: true },
    points: { type: Number, default: 1, min: 0 },
    shuffleOptions: { type: Boolean, default: false },
    allowPartialCredit: { type: Boolean, default: false },
    caseSensitive: { type: Boolean, default: false },
    order: { type: Number, default: 1 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    instructions: { type: String, default: "", trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", default: null },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", default: null },
    educator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    startAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    timeLimitMinutes: { type: Number, default: 0, min: 0 },
    attemptLimit: { type: Number, default: 1, min: 1 },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    instantEvaluation: { type: Boolean, default: true },
    reviewMode: { type: Boolean, default: true },
    showCorrectAnswersImmediately: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    questions: { type: [quizQuestionSchema], default: [] },
    tags: { type: [String], default: [] },
    totalPoints: { type: Number, default: 0, min: 0 },
    attemptCount: { type: Number, default: 0 },
    passCount: { type: Number, default: 0 },
  },
  { timestamps: true, minimize: false }
);

quizSchema.index({ course: 1, status: 1, dueAt: -1 });
quizSchema.index({ educator: 1, createdAt: -1 });

const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);

export default Quiz;
