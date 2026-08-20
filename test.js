import mongoose from "mongoose";
import User from "./server/models/User.js";
import { resolveUserRole } from "./server/utils/roleUtils.js";
import 'dotenv/config';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lms");
  console.log("Connected to MongoDB");

  const authId = "test_clerk_id_" + Date.now();
  try {
    const role = resolveUserRole({ clerkUserId: authId, email: "", existingRole: undefined });
    console.log("Role:", role);
    let user = await User.create({
      clerkUserId: authId,
      name: "User",
      email: "",
      imageUrl: "",
      role,
      enrolledCourses: [],
    });
    console.log("Created user:", user);
  } catch (err) {
    console.error("Error creating user:", err);
  }
  process.exit(0);
}
run();
