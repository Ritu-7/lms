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
app.use(clerkMiddleware());

/* ===============================
   Routes
================================ */
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/courses", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/educator", educatorRouter);

/* ===============================
   Error Handler
================================ */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* ===============================
   Server Start
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
