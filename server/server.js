import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import connectDB from "./configs/mongodb.js";
import connectCloudinary from "./configs/cloudinary.js";
import { clerkWebhook, razorpayWebhook } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import platformRouter from "./routes/platformRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import assignmentRouter from "./routes/assignmentRoutes.js";
import quizRouter from "./routes/quizRoutes.js";
import certificateRouter from "./routes/certificateRoutes.js";
import studyLibraryRouter from "./routes/studyLibraryRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import { requestContext } from "./middlewares/requestMiddleware.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { logger } from "./utils/logger.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContext);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = (process.env.CLIENT_URLS || "http://localhost:5173,https://lms-hazel-rho-45.vercel.app")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => !origin || allowedOrigins.includes(origin)
    ? callback(null, true)
    : callback(Object.assign(new Error("Origin is not allowed by CORS"), { statusCode: 403, isOperational: true })),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
}));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.RATE_LIMIT_MAX || 300), standardHeaders: "draft-8", legacyHeaders: false });
const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.PAYMENT_RATE_LIMIT_MAX || 20), standardHeaders: "draft-8", legacyHeaders: false });

app.post("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhook);
app.post("/api/webhooks/razorpay", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(express.json({ limit: "1mb" }));
app.use(clerkMiddleware());
app.use("/api", apiLimiter);
app.use("/api/user/purchase", paymentLimiter);
app.use("/api/user/verify-payment", paymentLimiter);

app.get("/", (_req, res) => res.json({ success: true, message: "API is running" }));
app.use("/api/courses", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/educator", educatorRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/certificates", certificateRouter);
app.use("/api/study-library", studyLibraryRouter);
app.use("/api/platform", platformRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/admin", adminRouter);
app.use(notFound);
app.use(errorHandler);

export const startServer = async () => {
  await connectDB();
  await connectCloudinary();
  const port = process.env.PORT || 5000;
  return app.listen(port, () => logger.info("server.started", { port }));
};

if (process.env.NODE_ENV !== "test") {
  startServer().catch((error) => {
    logger.error("server.start_failed", { message: error.message });
    process.exitCode = 1;
  });
}

export default app;
