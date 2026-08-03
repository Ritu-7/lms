import mongoose from "mongoose";

const aiUsageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    feature: {
      type: String,
      required: true,
      index: true,
    },
    model: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["success", "error"],
      default: "success",
      index: true,
    },
    inputLength: {
      type: Number,
      default: 0,
    },
    outputLength: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      default: "",
    },
    sourceType: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

aiUsageLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("AIUsageLog", aiUsageLogSchema);