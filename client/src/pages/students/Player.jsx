import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import YouTube from "react-youtube";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";
import axios from "axios";
import { toast } from "react-toastify";
import {
  formatResourceSize,
  getResourceActionLabel,
  getResourceBadgeLabel,
  normalizeResourceCollection,
} from "../../utils/resourceUtils";
import { ChevronDown, CheckCircle2, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendURL,
    getToken,
    fetchUserEnrolledCourses,
    userData,
    getCourseChapters,
  } = useContext(AppContext);

  const { courseId } = useParams();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [studyLibrary, setStudyLibrary] = useState({ bookmarks: [], notes: [], stats: { bookmarkCount: 0, noteCount: 0 } });
  const [libraryQuery, setLibraryQuery] = useState("");
  const [activeLibraryTab, setActiveLibraryTab] = useState("bookmarks");
  const [bookmarkPositionLabel, setBookmarkPositionLabel] = useState("");
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [noteText, setNoteText] = useState("");
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const isEnrolled = enrolledCourses.some((course) => (typeof course === "string" ? course : course._id) === courseId);
  const courseChapters = getCourseChapters(courseData);
  const hasUserRated = courseData?.courseRatings?.some((r) => r.userId === userData?.clerkUserId) || false;

  const flatLessons = useMemo(() => {
    return courseChapters.flatMap((ch, chIdx) =>
      (ch.chapterContent || []).map((lec, lecIdx) => ({
        ...lec,
        chapter: chIdx + 1,
        lecture: lecIdx + 1,
      }))
    );
  }, [courseChapters]);

  const getYouTubeID = (url) => {
    if (!url || typeof url !== "string") return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  };

  const getLessonResources = (lesson = {}) =>
    normalizeResourceCollection(
      lesson.lectureResources,
      lesson.lessonResources,
      lesson.resources,
      lesson.lectureAttachments,
      lesson.lessonAttachments
    );
  const getLessonType = (lesson = {}) => lesson.lectureType || lesson.lessonType || lesson.contentType || getLessonResources(lesson)[0]?.resourceType || "video";
  const isLessonCompleted = (lessonId) =>
    progressData?.completedLessons?.includes(lessonId) || progressData?.completedLectures?.includes(lessonId);
  const getLessonUrl = (lesson = {}) =>
    lesson.lectureUrl ||
    lesson.lessonUrl ||
    lesson.lessonVideoUrl ||
    lesson.lessonPdfUrl ||
    lesson.lessonExternalLink ||
    getLessonResources(lesson)[0]?.resourceUrl ||
    "";

  const formatSeconds = (seconds = 0) => {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    if (hours > 0) {
      return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
    }
    return [minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
  };

  const currentLessonPosition = useMemo(() => {
    if (!playerData) return { label: "Lesson", seconds: 0, type: "lesson" };
    const lessonType = getLessonType(playerData);
    if (lessonType === "pdf") {
      return { label: bookmarkPositionLabel || "PDF", seconds: 0, type: "pdf" };
    }
    if (lessonType === "rich_text" || lessonType === "external_link") {
      return { label: bookmarkPositionLabel || "Lesson", seconds: 0, type: "lesson" };
    }
    const currentTime = typeof youtubePlayer?.getCurrentTime === "function" ? Number(youtubePlayer.getCurrentTime() || 0) : 0;
    const label = currentTime > 0 ? formatSeconds(currentTime) : (bookmarkPositionLabel || "00:00");
    return { label, seconds: currentTime, type: "video" };
  }, [bookmarkPositionLabel, playerData, youtubePlayer]);

  const currentLessonBookmark = studyLibrary.bookmarks.find((bookmark) => bookmark.lessonId === playerData?.lectureId) || null;
  const currentLessonNote = studyLibrary.notes.find((note) => note.lessonId === playerData?.lectureId) || null;

  const filteredBookmarks = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    if (!query) return studyLibrary.bookmarks;
    return studyLibrary.bookmarks.filter((bookmark) =>
      [bookmark.lessonTitle, bookmark.courseTitle, bookmark.positionLabel, bookmark.note, bookmark.lessonType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [libraryQuery, studyLibrary.bookmarks]);

  const filteredNotes = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    if (!query) return studyLibrary.notes;
    return studyLibrary.notes.filter((note) =>
      [note.lessonTitle, note.courseTitle, note.positionLabel, note.noteText, note.lessonType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [libraryQuery, studyLibrary.notes]);

  const renderLessonContent = (lesson) => {
    const lessonType = getLessonType(lesson);
    const lessonUrl = getLessonUrl(lesson);

    if (lessonType === "pdf") {
      return (
        <iframe
          src={lesson.lessonPdfUrl || lessonUrl}
          title={lesson.lectureTitle || lesson.lessonTitle}
          className="w-full aspect-video bg-white dark:bg-dk-surface"
        />
      );
    }

    if (lessonType === "rich_text") {
      return (
        <div className="w-full aspect-video overflow-auto bg-white dark:bg-dk-surface p-5 text-left">
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: lesson.lectureRichTextContent || lesson.lessonRichTextContent || "" }}
          />
        </div>
      );
    }

    if (lessonType === "external_link") {
      return (
        <div className="w-full aspect-video bg-white dark:bg-dk-surface p-6 flex flex-col items-start justify-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">External Resource</p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">{lesson.lectureTitle || lesson.lessonTitle}</h3>
            <p className="mt-2 text-sm text-gray-500">
              This lesson opens an external resource. Use it for references, assignments, or guided reading.
            </p>
          </div>
          <a
            href={lesson.lessonExternalLink || lessonUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open Link
          </a>
        </div>
      );
    }

    if (lessonType === "quiz" || lessonType === "assignment") {
      return (
        <div className="w-full aspect-video bg-white dark:bg-dk-surface p-6 flex flex-col items-start justify-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              {lessonType === "quiz" ? "Quiz" : "Assignment"}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">{lesson.lectureTitle || lesson.lessonTitle}</h3>
            <p className="mt-2 text-sm text-gray-500">
              {lessonType === "quiz"
                ? "Complete the assessment and submit your answers to unlock progress."
                : "Submit the assignment or attached work to mark this lesson complete."}
            </p>
          </div>
          {lesson.lessonExternalLink || lessonUrl ? (
            <a
              href={lesson.lessonExternalLink || lessonUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              {lessonType === "quiz" ? "Open Quiz" : "Open Assignment"}
            </a>
          ) : null}
        </div>
      );
    }

    if (lessonType === "image") {
      return (
        <div className="w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          <img
            src={lessonUrl}
            alt={lesson.lectureTitle || lesson.lessonTitle}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    if (lessonType === "zip" || lessonType === "code") {
      return (
        <div className="w-full aspect-video bg-gray-900 flex flex-col items-start justify-center gap-4 p-6 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              {getResourceBadgeLabel(lessonType)} Resource
            </p>
            <h3 className="mt-2 text-xl font-semibold">{lesson.lectureTitle || lesson.lessonTitle}</h3>
            <p className="mt-2 text-sm text-gray-300">
              This resource is available for download or external review.
            </p>
          </div>
          <a
            href={lessonUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white dark:bg-dk-surface px-5 py-2.5 text-sm font-semibold text-gray-900"
          >
            Open Resource
          </a>
        </div>
      );
    }

    const youtubeId = getYouTubeID(lesson.lessonVideoUrl || lessonUrl);
    if (youtubeId) {
      return (
        <YouTube
          videoId={youtubeId}
          iframeClassName="w-full aspect-video"
          onReady={(event) => setYoutubePlayer(event.target)}
          opts={{ playerVars: { autoplay: 1 } }}
        />
      );
    }

    return (
      <iframe
        src={lesson.lessonVideoUrl || lessonUrl}
        title={lesson.lectureTitle || lesson.lessonTitle}
        className="w-full aspect-video"
      />
    );
  };

  const getCourseData = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/user/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setCourseData(data.courseData);
        const chapters = getCourseChapters(data.courseData);
        if (!playerData && chapters.length > 0) {
          const firstChapter = chapters[0];
          if (firstChapter.chapterContent.length > 0) {
            setPlayerData({
              ...firstChapter.chapterContent[0],
              chapter: 1,
              lecture: 1,
            });
          }
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [backendURL, courseId, getToken, playerData, getCourseChapters]);

  const getCourseProgress = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.post(
        `${backendURL}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) setProgressData(data.progressData);
    } catch (error) {
      console.error("Progress Fetch Error:", error.message);
    }
  }, [backendURL, getToken, courseId]);

  const fetchStudyLibrary = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/study-library/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStudyLibrary({
          bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
          notes: Array.isArray(data.notes) ? data.notes : [],
          stats: data.stats || { bookmarkCount: 0, noteCount: 0 },
        });
      }
    } catch (error) {
      console.error("Study library fetch error:", error.message);
    } finally {
      setLibraryLoading(false);
    }
  }, [backendURL, getToken]);

  const saveBookmark = useCallback(async () => {
    if (!playerData) return;
    try {
      setBookmarkSaving(true);
      const token = await getToken();
      const payload = {
        courseId,
        lessonId: playerData.lectureId,
        lessonTitle: playerData.lectureTitle || playerData.lessonTitle || "Lesson",
        lessonType: getLessonType(playerData),
        lessonUrl: getLessonUrl(playerData),
        positionType: currentLessonPosition.type,
        positionLabel: currentLessonPosition.label,
        positionSeconds: currentLessonPosition.seconds,
        note: bookmarkNote,
      };

      const { data } = await axios.post(`${backendURL}/api/study-library/bookmarks`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success("Bookmark saved");
        setBookmarkNote("");
        await fetchStudyLibrary();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBookmarkSaving(false);
    }
  }, [backendURL, bookmarkNote, courseId, currentLessonPosition.label, currentLessonPosition.seconds, currentLessonPosition.type, fetchStudyLibrary, getLessonType, getLessonUrl, getToken, playerData]);

  const saveNote = useCallback(async (nextText) => {
    if (!playerData) return;
    try {
      setNoteSaving(true);
      const token = await getToken();
      const payload = {
        courseId,
        lessonId: playerData.lectureId,
        lessonTitle: playerData.lectureTitle || playerData.lessonTitle || "Lesson",
        lessonType: getLessonType(playerData),
        noteText: nextText,
        positionType: currentLessonPosition.type,
        positionLabel: currentLessonPosition.label,
        positionSeconds: currentLessonPosition.seconds,
        isPrivate: true,
      };

      if (!nextText.trim()) {
        if (currentLessonNote?._id) {
          await axios.delete(`${backendURL}/api/study-library/notes/${currentLessonNote._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        await fetchStudyLibrary();
        return;
      }

      const { data } = await axios.post(`${backendURL}/api/study-library/notes`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        await fetchStudyLibrary();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setNoteSaving(false);
    }
  }, [backendURL, courseId, currentLessonNote?._id, currentLessonPosition.label, currentLessonPosition.seconds, currentLessonPosition.type, fetchStudyLibrary, getLessonType, getToken, playerData]);

  useEffect(() => {
    if (playerData) {
      setYoutubePlayer(null);
      const lessonType = getLessonType(playerData);
      setBookmarkPositionLabel(lessonType === "pdf" ? "PDF" : "");
    }
  }, [playerData?.lectureId]);

  useEffect(() => {
    fetchStudyLibrary();
  }, [fetchStudyLibrary, playerData?.lectureId]);

  useEffect(() => {
    if (!playerData) return undefined;
    const timer = window.setTimeout(() => {
      saveNote(noteText);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [noteText, playerData, saveNote]);

  useEffect(() => {
    if (currentLessonNote) {
      setNoteText(currentLessonNote.noteText || "");
    } else if (playerData) {
      setNoteText("");
    }
  }, [currentLessonNote, playerData?.lectureId]);

  useEffect(() => {
    if (currentLessonBookmark) {
      setBookmarkPositionLabel(currentLessonBookmark.positionLabel || "");
    }
  }, [currentLessonBookmark, playerData?.lectureId]);

  const markLectureAsCompleted = async (lectureId) => {
    try {
      if (isUpdating) return;
      setIsUpdating(true);
      const token = await getToken();

      const { data } = await axios.post(
        `${backendURL}/api/user/update-course-progress`,
        { courseId, lectureId, completionData: { manual: true } },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Progress Updated");
        await getCourseProgress();
        await fetchUserEnrolledCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating progress");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    const submittedRating = Number(e.target.rating.value);
    const review = e.target.review.value;
    if (submittedRating === 0) return toast.error("Please select a star rating");
    
    try {
      setIsSubmitting(true);
      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/api/user/add-rating`,
        { courseId, rating: submittedRating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Thank you for your feedback!");
        await getCourseData();
        fetchUserEnrolledCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = (index) => {
    setOpenSection((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    getCourseData();
  }, [getCourseData]);

  useEffect(() => {
    if (courseId) {
      getCourseProgress();
    }
  }, [courseId, getCourseProgress]);

  if (loading) return <Loading />;
  if (!courseData) return null;

  const completedCount = progressData?.completedLessons?.length || progressData?.completedLectures?.length || 0;
  const totalLessons = courseChapters.reduce((s, ch) => s + (ch.chapterContent?.length || 0), 0);
  const progressPct = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;


  const currentIndex = flatLessons.findIndex((l) => l.lectureId === playerData?.lectureId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex !== -1 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dk-base">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── Left: Player + info ──────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Video player */}
            <div className="rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-black/10">
              {playerData && isEnrolled
                ? renderLessonContent(playerData)
                : <img src={courseData.courseThumbnail} className="w-full aspect-video object-cover" alt="" />}
            </div>

            {/* Lesson meta + Complete button */}
            {playerData && isEnrolled && (
              <div className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border p-5 flex flex-col gap-5 shadow-sm">
                
                {/* Info row */}
                <div>
                  <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">
                    Chapter {playerData.chapter} · Lesson {playerData.lecture} · {getLessonType(playerData).replace("_", " ")}
                  </p>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-dk-text break-words leading-tight">{playerData.lectureTitle}</h1>
                </div>

                {/* Navigation & Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-dk-border">
                  <div className="flex items-center gap-2 mr-auto">
                    {prevLesson && (
                      <button
                        onClick={() => setPlayerData(prevLesson)}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        Prev Lesson
                      </button>
                    )}
                    {nextLesson && (
                      <button
                        onClick={() => setPlayerData(nextLesson)}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        Next Lesson
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => markLectureAsCompleted(playerData.lectureId)}
                    disabled={isUpdating}
                    className={`shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm ${
                      isLessonCompleted(playerData.lectureId)
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
                    }`}
                  >
                    {isLessonCompleted(playerData.lectureId) ? <CheckCircle2 size={16} /> : null}
                    {isLessonCompleted(playerData.lectureId) ? "Completed" : "Mark as Completed"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ────────────────────────────────────────── */}
          <div className="w-full xl:w-[380px] shrink-0 space-y-5">

            {/* Progress card */}
            {isEnrolled && (
              <div className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-dk-text text-sm">Your Progress</h3>
                  <span className="text-sm font-bold text-blue-600">{progressPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-dk-surface-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-2">{completedCount} of {totalLessons} lessons complete</p>
              </div>
            )}

            {/* Course Content */}
            <div className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-dk-border flex items-center justify-between">
                <h2 className="font-bold text-slate-900 dark:text-dk-text">Course Content</h2>
                <span className="text-xs text-slate-500">{courseChapters.length} modules</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-dk-border max-h-[520px] overflow-y-auto">
                {courseChapters.map((chapter, index) => (
                  <div key={index}>
                    <button
                      onClick={() => toggleSection(index)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-sm font-semibold text-slate-800 dark:text-dk-text truncate">
                        {chapter.chapterTitle || `Module ${index + 1}`}
                      </p>
                      <motion.div animate={{ rotate: openSection[index] ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {openSection[index] && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-slate-50 dark:bg-dk-surface-2 border-t border-slate-100 dark:border-dk-border divide-y divide-slate-100 dark:divide-dk-border/50 overflow-hidden"
                        >
                          {chapter.chapterContent.map((lecture, i) => {
                            const completed = isLessonCompleted(lecture.lectureId);
                            const active = playerData?.lectureId === lecture.lectureId;
                            return (
                              <li key={i}>
                                <button
                                  onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${active ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-white dark:hover:bg-dk-surface/50"}`}
                                >
                                  <div className="shrink-0">
                                    {completed
                                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      : <PlayCircle className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />}
                                  </div>
                                  <p className={`text-xs flex-1 min-w-0 truncate ${active ? "font-semibold text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-dk-text-2"}`}>
                                    {lecture.lectureTitle}
                                  </p>
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Tools */}
            {playerData && isEnrolled && (
              <div className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-dk-text mb-4">Study Tools</h3>
                {/* Tab switcher */}
                <div className="flex gap-2 mb-5 bg-slate-100 dark:bg-dk-surface-2 p-1 rounded-xl">
                  {["bookmarks", "notes"].map(tab => (
                    <button key={tab} onClick={() => setActiveLibraryTab(tab)}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg capitalize transition-all ${activeLibraryTab === tab ? "bg-white dark:bg-dk-surface text-slate-900 dark:text-dk-text shadow-sm" : "text-slate-500 dark:text-dk-text-2 hover:text-slate-700"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeLibraryTab === "bookmarks" ? (
                  <div className="space-y-3">
                    <input value={bookmarkPositionLabel} onChange={e => setBookmarkPositionLabel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-dk-border p-3 text-sm bg-slate-50 dark:bg-dk-surface-2 text-slate-900 dark:text-dk-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Position label (e.g. 02:35)"
                    />
                    <textarea value={bookmarkNote} onChange={e => setBookmarkNote(e.target.value)} rows="3"
                      className="w-full rounded-xl border border-slate-200 dark:border-dk-border p-3 text-sm bg-slate-50 dark:bg-dk-surface-2 text-slate-900 dark:text-dk-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Add a note for this bookmark…"
                    />
                    <button onClick={saveBookmark} disabled={bookmarkSaving}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20"
                    >
                      {bookmarkSaving ? "Saving…" : "Save Bookmark"}
                    </button>
                  </div>
                ) : (
                  <textarea rows="8" value={noteText} onChange={e => setNoteText(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-dk-border p-3 text-sm bg-slate-50 dark:bg-dk-surface-2 text-slate-900 dark:text-dk-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Type your private note here… (auto-saved)"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Player;
