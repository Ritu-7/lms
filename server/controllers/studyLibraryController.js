import User from "../models/User.js";
import Course from "../models/Course.js";
import { deletePersonalNote, deleteStudyBookmark, getStudyLibraryForUser, upsertPersonalNote, upsertStudyBookmark } from "../services/studyLibraryService.js";

const loadCurrentUser = async (userId) => User.findOne({ clerkUserId: userId });

export const getMyStudyLibrary = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await loadCurrentUser(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const query = String(req.query.query || "").trim();
    const library = await getStudyLibraryForUser(user._id, query);

    res.json({ success: true, ...library });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const validateLessonPayload = (req, res) => {
  const { courseId, lessonId, lessonTitle } = req.body || {};
  if (!courseId || !lessonId || !lessonTitle) {
    res.status(400).json({ success: false, message: "courseId, lessonId, and lessonTitle are required" });
    return false;
  }
  return true;
};

export const createOrUpdateBookmark = async (req, res) => {
  try {
    if (!validateLessonPayload(req, res)) return;

    const { userId } = req.auth();
    const user = await loadCurrentUser(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const course = await Course.findById(req.body.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const bookmark = await upsertStudyBookmark({
      userId: user._id,
      courseId: course._id,
      lessonId: req.body.lessonId,
      payload: req.body,
    });

    res.json({ success: true, bookmark });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeBookmark = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await loadCurrentUser(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const removed = await deleteStudyBookmark({ bookmarkId: req.params.bookmarkId, userId: user._id });
    if (!removed) return res.status(404).json({ success: false, message: "Bookmark not found" });

    res.json({ success: true, message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrUpdateNote = async (req, res) => {
  try {
    if (!validateLessonPayload(req, res)) return;

    const { userId } = req.auth();
    const user = await loadCurrentUser(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const course = await Course.findById(req.body.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const note = await upsertPersonalNote({
      userId: user._id,
      courseId: course._id,
      lessonId: req.body.lessonId,
      payload: req.body,
    });

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeNote = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await loadCurrentUser(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const removed = await deletePersonalNote({ noteId: req.params.noteId, userId: user._id });
    if (!removed) return res.status(404).json({ success: false, message: "Note not found" });

    res.json({ success: true, message: "Note removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
