import express from "express";
import { getAllCourse, getCourseId } from "../controllers/courseController.js";
import { validateObjectIdParam } from "../middlewares/validate.js";

const courseRouter = express.Router();

courseRouter.get("/all", getAllCourse);
courseRouter.get("/:id", validateObjectIdParam("id"), getCourseId);

export default courseRouter;
