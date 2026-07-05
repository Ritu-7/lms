import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  logger.error(error.message || "Unhandled server error", {
    requestId: req.requestId, method: req.method, path: req.originalUrl, statusCode,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && !error.isOperational ? "Internal server error" : error.message,
    ...(error.details ? { details: error.details } : {}),
    requestId: req.requestId,
  });
};
