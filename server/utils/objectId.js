import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";

const getRawId = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return String(value._id || value.id || "").trim();
  return String(value).trim();
};

export const parseObjectId = (value, fieldName) => {
  const id = getRawId(value);
  if (!id) {
    return { error: `${fieldName} is required` };
  }
  if (!mongoose.isValidObjectId(id)) {
    return { error: `Invalid ${fieldName}` };
  }
  return { id };
};

export const isClientDataError = (error) =>
  error?.name === "CastError" || error?.name === "ValidationError";

export const clientDataErrorMessage = (error) => {
  if (error?.name === "CastError") {
    const path = error.path || "value";
    if (error.kind === "ObjectId") {
      return `Invalid ${path}`;
    }
    return `Invalid ${path}`;
  }
  return error?.message || "Validation failed";
};

export const resolveCourseModuleLesson = async ({ courseId, moduleId, lessonId }) => {
  const moduleResult = parseObjectId(moduleId, "module");
  if (moduleResult.error) return { error: moduleResult.error };

  const lessonResult = parseObjectId(lessonId, "lesson");
  if (lessonResult.error) return { error: lessonResult.error };

  const moduleDoc = await Module.findById(moduleResult.id);
  if (!moduleDoc) return { error: "Module not found" };
  if (String(moduleDoc.course) !== String(courseId)) {
    return { error: "Module does not belong to the selected course" };
  }

  const lessonDoc = await Lesson.findById(lessonResult.id);
  if (!lessonDoc) return { error: "Lesson not found" };
  if (String(lessonDoc.course) !== String(courseId)) {
    return { error: "Lesson does not belong to the selected course" };
  }
  if (String(lessonDoc.module) !== String(moduleDoc._id)) {
    return { error: "Lesson does not belong to the selected module" };
  }

  return { moduleId: moduleDoc._id, lessonId: lessonDoc._id };
};
