import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ── Recipient ──────────────────────────────────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // For role-based or broadcast notifications
    recipientRole: {
      type: String,
      enum: ["student", "educator", "admin", "all"],
      default: null,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── Sender ─────────────────────────────────────────────────────────────
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderLabel: {
      type: String,
      default: "System",
      trim: true,
    },

    // ── Content ────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // ── Classification ────────────────────────────────────────────────────
    type: {
      type: String,
      enum: [
        "course",
        "assignment",
        "quiz",
        "announcement",
        "enrollment",
        "certificate",
        "payment",
        "AI",
        "system",
      ],
      default: "system",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    // ── Status ────────────────────────────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },

    // ── Navigation ────────────────────────────────────────────────────────
    actionUrl: {
      type: String,
      default: null,
      trim: true,
    },
    icon: {
      type: String,
      default: null,
      trim: true,
    },

    // ── Extra data ────────────────────────────────────────────────────────
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Scheduling ────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      default: null,
      index: { sparse: true },
    },
  },
  { timestamps: true }
);

// ── Compound indexes for efficient queries ─────────────────────────────────
// "Get my unread notifications" — the most common query
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// "Get broadcast notifications for my role" — second most common
notificationSchema.index({ isBroadcast: 1, recipientRole: 1, createdAt: -1 });

// "Has this notification expired?"
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

// Deduplication helper: type + metadata.refId + recipient within 24h
notificationSchema.index({ recipient: 1, type: 1, "metadata.refId": 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
