import express from "express";
import { rateLimit } from "express-rate-limit";
import { submitContact } from "../controllers/contactController.js";

const contactRouter = express.Router();

// Strict rate limit: 5 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many messages submitted from this device. Please try again in 15 minutes.",
  },
});

contactRouter.post("/", contactLimiter, submitContact);

export default contactRouter;
