import mongoose from "mongoose";

/**
 * OutreachLog — tracks every admin-initiated outreach message.
 * Used for deduplication (prevent sending the same message to the same
 * recipient within a configurable window) and for audit trail.
 */
const outreachLogSchema = new mongoose.Schema(
  {
    // Who was contacted
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientEmail: { type: String, required: true },

    // Who sent it (admin)
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Message payload
    subject: { type: String, required: true },
    message: { type: String, required: true },

    // Channels attempted
    channels: {
      type: [String],
      enum: ["email", "notification"],
      required: true,
    },

    // Delivery status per channel
    emailStatus: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "skipped",
    },
    notificationStatus: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "skipped",
    },

    // Context tag e.g. "student_risk", "educator_insights"
    context: { type: String, default: "admin_outreach" },

    // Deduplication key — same admin + recipient + context within window
    dedupKey: { type: String, required: true },
  },
  { timestamps: true }
);

// Index for fast dedup lookup
outreachLogSchema.index({ dedupKey: 1, createdAt: -1 });
outreachLogSchema.index({ recipientId: 1, createdAt: -1 });

const OutreachLog =
  mongoose.models.OutreachLog || mongoose.model("OutreachLog", outreachLogSchema);

export default OutreachLog;
