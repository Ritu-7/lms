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
  const hasUserRated = courseData?.courseRatings?.some((r) => r.userId === userData?._id) || false;

  const getYouTubeID = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url.split("/").pop();
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
          className="w-full aspect-video bg-white"
        />
      );
    }

    if (lessonType === "rich_text") {
      return (
        <div className="w-full aspect-video overflow-auto bg-white p-5 text-left">
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: lesson.lectureRichTextContent || lesson.lessonRichTextContent || "" }}
          />
        </div>
      );
    }

    if (lessonType === "external_link") {
      return (
        <div className="w-full aspect-video bg-white p-6 flex flex-col items-start justify-center gap-4">
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
        <div className="w-full aspect-video bg-white p-6 flex flex-col items-start justify-center gap-4">
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
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900"
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

  const handleRatingSubmit = async () => {
    if (rating === 0) return toast.error("Please select a star rating");
    try {
      setIsSubmitting(true);
      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Thank you for your feedback!");
        await getCourseData();
        fetchUserEnrolledCourses();
      }
    } catch (error) {
      toast.error(error.message);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col xl:flex-row gap-6 max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Main Content (Player) */}
        <div className="flex-1 space-y-6">
          <div className="rounded-2xl overflow-hidden bg-black shadow-2xl">
            {playerData && isEnrolled ? renderLessonContent(playerData) : <img src={courseData.courseThumbnail} className="w-full aspect-video object-cover" alt="" />}
          </div>
          
          {playerData && isEnrolled && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Chapter {playerData.chapter} • Lesson {playerData.lecture} • {getLessonType(playerData).replace("_", " ")}
                </p>
                <h1 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white mt-1">{playerData.lectureTitle}</h1>
              </div>
              <button
                onClick={() => markLectureAsCompleted(playerData.lectureId)}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isLessonCompleted(playerData.lectureId)
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isLessonCompleted(playerData.lectureId) ? <CheckCircle2 size={18} /> : null}
                {isLessonCompleted(playerData.lectureId) ? "Completed" : "Mark as completed"}
              </button>
            </div>
          )}
        </div>

          {/* Sidebar Structure */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-white mb-6">Course Content</h2>
            <div className="space-y-4">
              {courseChapters.map((chapter, index) => (
                <div key={index} className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                  <button onClick={() => toggleSection(index)} className="flex w-full justify-between items-center p-4 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{chapter.chapterTitle}</p>
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>
                  <AnimatePresence>
                    {openSection[index] && (
                      <motion.ul 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 p-4 space-y-2"
                      >
                        {chapter.chapterContent.map((lecture, i) => (
                          <li key={i} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              {isLessonCompleted(lecture.lectureId) ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <PlayCircle className="w-4 h-4 text-slate-400" />}
                              <p className="text-slate-600 dark:text-slate-400">{lecture.lectureTitle}</p>
                            </div>
                            <button
                              onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                              className="text-blue-600 dark:text-blue-400 font-medium text-xs hover:underline"
                            >
                              View
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Library and Rating tools */}
          {playerData && isEnrolled && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold font-space-grotesk text-lg mb-4">Study Tools</h3>
              <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveLibraryTab("bookmarks")} className={`flex-1 text-sm font-semibold py-2 rounded-lg ${activeLibraryTab === "bookmarks" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>Bookmarks</button>
                <button onClick={() => setActiveLibraryTab("notes")} className={`flex-1 text-sm font-semibold py-2 rounded-lg ${activeLibraryTab === "notes" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>Notes</button>
              </div>

              {activeLibraryTab === "bookmarks" ? (
                <div className="space-y-4">
                  <input value={bookmarkPositionLabel} onChange={(e) => setBookmarkPositionLabel(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10" placeholder="Bookmark label" />
                  <textarea value={bookmarkNote} onChange={(e) => setBookmarkNote(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10" placeholder="Bookmark note" />
                  <button onClick={saveBookmark} disabled={bookmarkSaving} className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">Save Bookmark</button>
                </div>
              ) : (
                <textarea rows="6" value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full rounded-xl border p-3 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10" placeholder="Private note..." />
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Player;
