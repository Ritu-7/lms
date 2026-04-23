import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";

import { clerkWebhook } from "./controllers/webhooks.js";

import educatorRouter from "./routes/educatorRoutes.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";

import { clerkMiddleware } from "@clerk/express";

const app = express();

/* ===============================
   Database & Services
================================ */
await connectDB();
await connectCloudinary();

/* ===============================
   CORS
================================ */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ===============================
   Clerk Webhook (RAW BODY ONLY)
   ⚠️ MUST be before express.json()
================================ */
app.post(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhook
);

/* ===============================
   Normal JSON Middleware
================================ */
app.use(express.json());

/* ===============================
   Clerk Auth Middleware
================================ */
app.use(clerkMiddleware({ debug: true }));

/* ===============================
   Routes
================================ */
app.get("/", (req, res) => {
  res.send("API is running...");
});

/* ===============================
   Routes
================================ */
app.use("/api/courses", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/educator", educatorRouter);

/* ===============================
   Database Fix Script
================================ */
import User from "./models/User.js"; 

const fixDatabaseNames = async () => {
  try {
    const users = await User.find({ 
      $or: [{ name: "User" }, { name: "" }] 
    });

    if (users.length > 0) {
      for (let user of users) {
        if (user.email) {
          // If name is "User" or empty, use email prefix
          user.name = user.email.split('@')[0]; 
          await user.save();
        }
      }
      console.log(`✅ Successfully fixed ${users.length} user records!`);
    } else {
      console.log("ℹ️ No 'User' names found to fix.");
    }
  } catch (error) {
    console.error("❌ Fix script error:", error.message);
  }
};

// ✅ UNCOMMENT THE LINE BELOW, SAVE, AND RESTART YOUR SERVER
// fixDatabaseNames(); 

/* ===============================
   Server Start
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);