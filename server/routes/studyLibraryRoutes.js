import express from "express";
import { protectRoute } from "../middlewares/authMiddleware.js";
import { createOrUpdateBookmark, createOrUpdateNote, getMyStudyLibrary, removeBookmark, removeNote } from "../controllers/studyLibraryController.js";

const studyLibraryRouter = express.Router();

studyLibraryRouter.get("/me", protectRoute, getMyStudyLibrary);
studyLibraryRouter.post("/bookmarks", protectRoute, createOrUpdateBookmark);
studyLibraryRouter.delete("/bookmarks/:bookmarkId", protectRoute, removeBookmark);
studyLibraryRouter.post("/notes", protectRoute, createOrUpdateNote);
studyLibraryRouter.delete("/notes/:noteId", protectRoute, removeNote);

export default studyLibraryRouter;
