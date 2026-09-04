import mongoose from "mongoose";

const SUBJECTS = [
  "General Enquiry",
  "Technical Support",
  "Billing & Payments",
  "Course Content Feedback",
  "Educator Partnership",
  "Enterprise / Institutional Plans",
  "Press & Media",
  "Other",
];

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [120, "Name must be 120 characters or fewer"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      enum: { values: SUBJECTS, message: "Invalid subject selected" },
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [20, "Message must be at least 20 characters"],
      maxlength: [2000, "Message must be 2000 characters or fewer"],
    },
    // 'new' = not yet seen by admin, 'read' = viewed, 'replied' = responded to
    status: {
      type: String,
      enum: ["new", "read", "replied"],
      default: "new",
    },
    // SHA-256 hash of IP + User-Agent, used to detect duplicate rapid submissions
    ipFingerprint: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for duplicate detection queries
contactMessageSchema.index({ ipFingerprint: 1, email: 1, subject: 1, createdAt: -1 });
// Index for admin list queries (sort by newest)
contactMessageSchema.index({ createdAt: -1 });
// Index for status filtering
contactMessageSchema.index({ status: 1 });

const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
