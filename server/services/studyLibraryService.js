import StudyBookmark from "../models/StudyBookmark.js";
import PersonalNote from "../models/PersonalNote.js";

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeStudyBookmark = (bookmark) => ({
  _id: bookmark._id,
  user: bookmark.user,
  course: bookmark.course,
  lessonId: bookmark.lessonId,
  lessonTitle: bookmark.lessonTitle,
  lessonType: bookmark.lessonType,
  lessonUrl: bookmark.lessonUrl,
  positionType: bookmark.positionType,
  positionLabel: bookmark.positionLabel,
  positionSeconds: bookmark.positionSeconds,
  pdfPage: bookmark.pdfPage,
  note: bookmark.note,
  createdAt: bookmark.createdAt,
  updatedAt: bookmark.updatedAt,
});

export const normalizePersonalNote = (note) => ({
  _id: note._id,
  user: note.user,
  course: note.course,
  lessonId: note.lessonId,
  lessonTitle: note.lessonTitle,
  lessonType: note.lessonType,
  noteText: note.noteText,
  positionType: note.positionType,
  positionLabel: note.positionLabel,
  positionSeconds: note.positionSeconds,
  isPrivate: note.isPrivate,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

const buildSearchFilter = (query) => {
  if (!query || !query.trim()) return {};
  const pattern = new RegExp(escapeRegExp(query.trim()), "i");
  return {
    $or: [
      { lessonTitle: pattern },
      { lessonType: pattern },
      { positionLabel: pattern },
      { note: pattern },
      { noteText: pattern },
    ],
  };
};

export const getStudyLibraryForUser = async (userId, query = "") => {
  const searchFilter = buildSearchFilter(query);

  const [bookmarks, notes, bookmarkCount, noteCount] = await Promise.all([
    StudyBookmark.find({ user: userId, ...searchFilter }).populate("course", "courseTitle").sort({ updatedAt: -1 }).lean(),
    PersonalNote.find({ user: userId, ...searchFilter }).populate("course", "courseTitle").sort({ updatedAt: -1 }).lean(),
    StudyBookmark.countDocuments({ user: userId }),
    PersonalNote.countDocuments({ user: userId }),
  ]);

  return {
    bookmarks: bookmarks.map((bookmark) => ({
      ...normalizeStudyBookmark(bookmark),
      courseTitle: bookmark.course?.courseTitle || "",
    })),
    notes: notes.map((note) => ({
      ...normalizePersonalNote(note),
      courseTitle: note.course?.courseTitle || "",
    })),
    stats: {
      bookmarkCount,
      noteCount,
    },
  };
};

export const upsertStudyBookmark = async ({ userId, courseId, lessonId, payload }) => {
  const bookmark = await StudyBookmark.findOneAndUpdate(
    { user: userId, course: courseId, lessonId, positionLabel: payload.positionLabel || "" },
    {
      $set: {
        lessonTitle: payload.lessonTitle || "",
        lessonType: payload.lessonType || "lesson",
        lessonUrl: payload.lessonUrl || "",
        positionType: payload.positionType || "lesson",
        positionLabel: payload.positionLabel || "",
        positionSeconds: Number(payload.positionSeconds || 0),
        pdfPage: Number(payload.pdfPage || 0),
        note: payload.note || "",
      },
      $setOnInsert: {
        user: userId,
        course: courseId,
        lessonId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate("course", "courseTitle");

  return {
    ...normalizeStudyBookmark(bookmark.toObject()),
    courseTitle: bookmark.course?.courseTitle || "",
  };
};

export const deleteStudyBookmark = async ({ bookmarkId, userId }) =>
  StudyBookmark.findOneAndDelete({ _id: bookmarkId, user: userId });

export const upsertPersonalNote = async ({ userId, courseId, lessonId, payload }) => {
  const note = await PersonalNote.findOneAndUpdate(
    { user: userId, course: courseId, lessonId },
    {
      $set: {
        lessonTitle: payload.lessonTitle || "",
        lessonType: payload.lessonType || "lesson",
        noteText: payload.noteText || "",
        positionType: payload.positionType || "lesson",
        positionLabel: payload.positionLabel || "",
        positionSeconds: Number(payload.positionSeconds || 0),
        isPrivate: payload.isPrivate !== undefined ? Boolean(payload.isPrivate) : true,
      },
      $setOnInsert: {
        user: userId,
        course: courseId,
        lessonId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate("course", "courseTitle");

  return {
    ...normalizePersonalNote(note.toObject()),
    courseTitle: note.course?.courseTitle || "",
  };
};

export const deletePersonalNote = async ({ noteId, userId }) =>
  PersonalNote.findOneAndDelete({ _id: noteId, user: userId });
