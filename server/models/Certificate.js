import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    studentName: {
      type: String,
      default: "",
    },
    studentEmail: {
      type: String,
      default: "",
    },
    courseTitle: {
      type: String,
      default: "",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    completionSnapshot: {
      type: Object,
      default: {},
    },
    pdfPath: {
      type: String,
      default: "",
    },
    pdfFileName: {
      type: String,
      default: "",
    },
    verificationUrl: {
      type: String,
      default: "",
    },
    qrPlaceholder: {
      type: String,
      default: "QR verification placeholder",
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

const Certificate = mongoose.models.Certificate || mongoose.model("Certificate", certificateSchema);

export default Certificate;
