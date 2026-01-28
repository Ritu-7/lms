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
      enum: ["student", "educator"],
      default: "student",
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Course",
      },
    ],
  },
  { timestamps: true }
);

// ✅ VERY IMPORTANT
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
