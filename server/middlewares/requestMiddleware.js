import crypto from "node:crypto";
import { logger } from "../utils/logger.js";

export const requestContext = (req, res, next) => {
  const startedAt = Date.now();
  req.requestId = req.get("x-request-id") || crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  res.on("finish", () => logger.info("request.completed", {
    requestId: req.requestId, method: req.method, path: req.originalUrl,
    statusCode: res.statusCode, durationMs: Date.now() - startedAt,
  }));
  next();
};
