import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["student", "educator", "admin"],
      default: "student",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    // 🚀 ADD THIS FIELD
    courseProgressData: {
      type: Object,
      default: {},
    },
    encryptedGeminiKey: {
      type: String,
      default: null,
    },
    geminiKeyAddedAt: {
      type: Date,
      default: null,
    },
    learningGoals: {
      type: String,
      default: "",
      trim: true,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },
    portfolioDraft: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    portfolioPublished: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastSkillGap: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    codingPractice: {
      runCount: { type: Number, default: 0 },
      lastLanguage: { type: String, default: "" },
      lastSuccess: { type: Boolean, default: false },
      lastExitCode: { type: Number, default: null },
      lastRunAt: { type: Date, default: null },
    },
  },
  { 
    timestamps: true,
    // 🔒 This ensures empty objects {} are actually saved in the DB
    minimize: false 
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;