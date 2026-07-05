import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export const requireFields = (...fields) => (req, _res, next) => {
  const missing = fields.filter((field) => req.body?.[field] === undefined || req.body?.[field] === "");
  if (missing.length) return next(new AppError(400, "Validation failed", { missing }));
  next();
};

export const validateObjectIdParam = (name) => (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params[name])) return next(new AppError(400, `Invalid ${name}`));
  next();
};

export const validateRating = (req, _res, next) => {
  const rating = Number(req.body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return next(new AppError(400, "Rating must be an integer from 1 to 5"));
  req.body.rating = rating;
  next();
};
