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
      required: true,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["student", "educator"],
      default: "student",
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
  },
  { 
    timestamps: true,
    // 🔒 This ensures empty objects {} are actually saved in the DB
    minimize: false 
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;