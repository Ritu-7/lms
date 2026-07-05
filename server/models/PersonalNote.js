import mongoose from "mongoose";

const personalNoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: String,
      required: true,
      index: true,
    },
    lessonTitle: {
      type: String,
      required: true,
      default: "",
    },
    lessonType: {
      type: String,
      default: "lesson",
    },
    noteText: {
      type: String,
      default: "",
    },
    positionType: {
      type: String,
      enum: ["lesson", "video", "pdf", "manual"],
      default: "lesson",
    },
    positionLabel: {
      type: String,
      default: "",
    },
    positionSeconds: {
      type: Number,
      default: 0,
    },
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

personalNoteSchema.index({ user: 1, course: 1, lessonId: 1 });

const PersonalNote = mongoose.models.PersonalNote || mongoose.model("PersonalNote", personalNoteSchema);

export default PersonalNote;
