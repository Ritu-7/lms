import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    audience: {
      type: String,
      enum: ["all", "students", "educators", "admins"],
      default: "all",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

export default Announcement;