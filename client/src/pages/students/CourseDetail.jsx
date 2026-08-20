import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/students/Loading";
import Footer from "../../components/students/Footer";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import { useAuthModal } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle, FileText, ExternalLink, ChevronDown,
  CheckCircle2, Lock, BookOpen, Clock, Users, Star,
  Shield, Award, BarChart2
} from "lucide-react";
import { getResourceActionLabel, normalizeResourceCollection } from "../../utils/resourceUtils";

/* ─── helpers ─────────────────────────────────────────────────────────── */
const StarSVG = ({ filled }) => (
  <svg className={`w-4 h-4 ${filled ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const StarRow = ({ rating, size = "sm" }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} ${s <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { calculateChapterTime, currency, backendURL, getToken, enrolledCourses, getCourseChapters } = useContext(AppContext);
  const { userId } = useAuth();
  const { openAuth } = useAuthModal();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({ 0: true });
  const [playerData, setPlayerData] = useState(null);
  const [starRating, setStarRating] = useState(0);
  const [starHover, setStarHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchCourse = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/courses/${id}`);
      if (data.success) setCourseData(data.data);
      else toast.error(data.message || "Course not found");
    } catch { toast.error("Failed to load course"); }
  };

  useEffect(() => { fetchCourse(); }, [id, backendURL]);

  const isAlreadyEnrolled = enrolledCourses.some(c => (typeof c === "string" ? c : c._id) === courseData?._id);
  const courseChapters = getCourseChapters(courseData);

  // Computed stats
  const totalLessons = courseChapters.reduce((s, ch) => s + (ch.chapterContent?.length || 0), 0);
  const avgRating = courseData?.courseRatings?.length
    ? (courseData.courseRatings.reduce((s, r) => s + r.rating, 0) / courseData.courseRatings.length).toFixed(1)
    : null;
  const reviewCount = courseData?.courseRatings?.filter(r => r.review).length || 0;
  const discountedPrice = courseData
    ? (courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2)
    : "0";

  const enrollCourse = async () => {
    try {
      if (!userId) { openAuth("student"); return; }
      if (isAlreadyEnrolled) { navigate(`/player/${courseData._id}`); return; }
      const token = await getToken();
      const { data } = await axios.post(`${backendURL}/api/user/purchase`, { courseId: courseData._id }, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) initPay(data.order);
      else toast.error(data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Error during enrollment."); }
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount, currency: order.currency,
      name: courseData.courseTitle, order_id: order.id,
      handler: async (response) => {
        try {
          const token = await getToken();
          const { data } = await axios.post(`${backendURL}/api/user/verify-payment`, response, { headers: { Authorization: `Bearer ${token}` } });
          if (data.success) { toast.success("Enrollment successful"); navigate("/my-enrollments"); }
        } catch { toast.error("Payment verification failed."); }
      },
    };
    new window.Razorpay(options).open();
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!starRating) { toast.error("Please select a star rating"); return; }
    setSubmittingReview(true);
    try {
      const token = await getToken();
      const review = e.target.review.value;
      const { data } = await axios.post(`${backendURL}/api/user/add-rating`, { courseId: courseData._id, rating: starRating, review }, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        toast.success("Review submitted!");
        setStarRating(0);
        await fetchCourse();
        e.target.reset();
      } else toast.error(data.message);
    } catch (error) { toast.error(error.response?.data?.message || "Failed to submit review"); }
    finally { setSubmittingReview(false); }
  };

  const toggleSection = (i) => setOpenSection(p => ({ ...p, [i]: !p[i] }));
  const getLessonResources = (l = {}) => normalizeResourceCollection(l.lectureResources, l.lessonResources, l.resources, l.lectureAttachments, l.lessonAttachments);
  const getLessonType = (l = {}) => l.lectureType || l.lessonType || l.contentType || getLessonResources(l)[0]?.resourceType || "video";
  const getLessonUrl = (l = {}) => l.lectureUrl || l.lessonUrl || l.lessonVideoUrl || l.lessonPdfUrl || l.lessonExternalLink || getLessonResources(l)[0]?.resourceUrl || "";

  const getYoutubeId = (url) => {
    const match = url?.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderPreview = (lesson) => {
    const type = getLessonType(lesson);
    const url = getLessonUrl(lesson);
    if (type === "pdf") return <iframe src={lesson.lessonPdfUrl || url} title={lesson.lectureTitle} className="w-full aspect-video" />;
    if (type === "rich_text") return <div className="w-full aspect-video overflow-auto bg-white p-6"><div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: lesson.lectureRichTextContent || "" }} /></div>;
    if (type === "external_link") return (
      <div className="w-full aspect-video bg-white flex flex-col items-center justify-center gap-3">
        <ExternalLink className="w-10 h-10 text-blue-600" />
        <h3 className="font-semibold text-slate-900">{lesson.lectureTitle}</h3>
        <a href={lesson.lessonExternalLink || url} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Open Link</a>
      </div>
    );
    const ytId = getYoutubeId(lesson.lessonVideoUrl || url);
    if (ytId) return <YouTube videoId={ytId} iframeClassName="w-full aspect-video" opts={{ playerVars: { autoplay: 1 } }} />;
    return <iframe src={lesson.lessonVideoUrl || url} title={lesson.lectureTitle} className="w-full aspect-video" />;
  };

  if (!courseData) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dk-base">
      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col lg:flex-row gap-10">
          {/* Left: Course info */}
          <div className="flex-1 space-y-5">
            {courseData.category && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {courseData.category}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold font-space-grotesk leading-tight">
              {courseData.courseTitle}
            </h1>
            <div
              className="prose prose-sm prose-invert max-w-none text-slate-300 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
            />

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300 pt-1">
              {avgRating && (
                <div className="flex items-center gap-1.5">
                  <StarRow rating={Math.round(avgRating)} />
                  <span className="font-semibold text-amber-400">{avgRating}</span>
                  <span className="text-slate-400">({courseData.courseRatings.length} ratings)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-slate-400" />
                <span>{courseData.studentsEnrolled?.length || 0} students</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-slate-400" />
                <span>{totalLessons} lessons</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                <span>{courseChapters.length} modules</span>
              </div>
            </div>

            {/* Educator */}
            {courseData.educator && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Created by</span>
                <span className="text-blue-300 font-medium">{courseData.educator.name || courseData.educator.email}</span>
              </div>
            )}
          </div>

          {/* Right: Purchase card — visible on lg inline, hidden on mobile (shown below) */}
          <div className="hidden lg:block w-[360px] shrink-0" />
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10 relative">

          {/* ── Main column ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* What you'll learn */}
            {courseData.courseFeatures?.length > 0 && (
              <div className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-dk-text mb-4 flex items-center gap-2">
                  <Award size={18} className="text-blue-600" /> What you'll learn
                </h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {courseData.courseFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-dk-text-2">
                      <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Course Structure */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-dk-text mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-600" /> Course Structure
                <span className="ml-auto text-sm font-normal text-slate-500">{courseChapters.length} modules • {totalLessons} lessons</span>
              </h2>
              <div className="space-y-3">
                {courseChapters.map((chapter, index) => (
                  <div key={index} className="border border-slate-200 dark:border-dk-border rounded-2xl bg-white dark:bg-dk-surface overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleSection(index)}
                      className="flex w-full justify-between items-center px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-dk-text text-sm">
                          {chapter.chapterTitle || chapter.moduleTitle || "Untitled"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 ml-4">
                        <span className="hidden sm:inline">{chapter.chapterContent?.length || 0} lessons · {calculateChapterTime(chapter)}</span>
                        <motion.div animate={{ rotate: openSection[index] ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={16} />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {openSection[index] && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-slate-100 dark:border-dk-border divide-y divide-slate-100 dark:divide-dk-border overflow-hidden"
                        >
                          {chapter.chapterContent?.map((lecture, i) => {
                            const lessonType = getLessonType(lecture);
                            const canWatch = isAlreadyEnrolled || lecture.isPreviewFree || lecture.previewMode;
                            return (
                              <li key={i} className="flex justify-between items-center px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${canWatch ? "bg-blue-50 dark:bg-blue-900/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                                    {canWatch
                                      ? <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      : <Lock className="w-3 h-3 text-slate-400" />}
                                  </div>
                                  <p className={`text-sm truncate ${canWatch ? "text-slate-800 dark:text-dk-text" : "text-slate-400"}`}>
                                    {lecture.lectureTitle}
                                  </p>
                                  {lecture.isPreviewFree && !isAlreadyEnrolled && (
                                    <span className="shrink-0 text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-bold">
                                      Preview
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                  {canWatch && (
                                    <button
                                      onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                                      className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline"
                                    >
                                      {getResourceActionLabel(lessonType)}
                                    </button>
                                  )}
                                  <span className="text-slate-400 text-xs tabular-nums">
                                    {humanizeDuration((lecture.lectureDuration || 0) * 60000, { units: ["h", "m"] })}
                                  </span>
                                </div>
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

            {/* ── Review Section ───────────────── */}
            <div className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 shadow-sm">
              {/* Header with avg rating */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-dk-border">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-dk-text">Student Reviews</h2>
                  <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-0.5">Read what others have to say</p>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl px-4 py-3">
                    <span className="text-3xl font-bold text-amber-500">{avgRating}</span>
                    <div>
                      <StarRow rating={Math.round(avgRating)} size="md" />
                      <p className="text-xs text-slate-500 mt-1">{courseData.courseRatings.length} ratings</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Review form (enrolled users only) */}
              {isAlreadyEnrolled && (
                <form onSubmit={handleReviewSubmit} className="space-y-5 mb-8 pb-8 border-b border-slate-100 dark:border-dk-border">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-dk-text-2 mb-3">Your Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button"
                          onClick={() => setStarRating(star)}
                          onMouseEnter={() => setStarHover(star)}
                          onMouseLeave={() => setStarHover(0)}
                          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                        >
                          <svg className={`w-9 h-9 transition-colors duration-100 ${star <= (starHover || starRating) ? "text-amber-400" : "text-slate-200 dark:text-slate-700"}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      {starRating > 0 && (
                        <span className="ml-2 text-sm font-semibold text-slate-600 dark:text-dk-text-2 bg-slate-100 dark:bg-dk-surface-2 px-3 py-1 rounded-full">
                          {["", "Terrible", "Poor", "Average", "Good", "Excellent"][starRating]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-dk-text-2 mb-2">Your Review</label>
                    <textarea name="review" required rows="4" placeholder="Tell others what you thought about this course..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 text-slate-900 dark:text-dk-text text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
                    />
                  </div>
                  <button type="submit" disabled={submittingReview || !starRating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Star size={15} />
                    {submittingReview ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              )}

              {/* Existing reviews */}
              {reviewCount > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-dk-text-2 uppercase tracking-wider">
                    {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </h3>
                  {courseData.courseRatings.filter(r => r.review).map((r, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-dk-surface-2">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 uppercase">
                        {r.userId ? r.userId.charAt(0) : "S"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <StarRow rating={r.rating} />
                        <p className="mt-2 text-sm text-slate-700 dark:text-dk-text-2 leading-relaxed">"{r.review}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-dk-text-2 italic">No reviews yet.</p>
              )}
            </div>
          </div>

          {/* ── Sticky sidebar ──────────────────────────────────────── */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Purchase card */}
              <div className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
                {/* Preview / thumbnail */}
                <div className="relative">
                  {playerData ? (
                    <div className="relative">
                      {renderPreview(playerData)}
                      <button onClick={() => setPlayerData(null)}
                        className="absolute top-3 right-3 bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/90 transition"
                      >
                        ✕ Close
                      </button>
                    </div>
                  ) : (
                    <div className="relative group cursor-pointer" onClick={() => { if (!isAlreadyEnrolled) return; }}>
                      <img src={courseData.courseThumbnail} alt={courseData.courseTitle} className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-5">
                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-slate-900 dark:text-dk-text">{currency}{discountedPrice}</span>
                    {courseData.discount > 0 && (
                      <>
                        <span className="text-lg text-slate-400 line-through">{currency}{courseData.coursePrice}</span>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{courseData.discount}% off</span>
                      </>
                    )}
                  </div>

                  {/* CTA button */}
                  <button onClick={enrollCourse}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25 text-sm"
                  >
                    {isAlreadyEnrolled ? "▶  Continue Learning" : "Enroll Now"}
                  </button>

                  {!isAlreadyEnrolled && (
                    <p className="text-center text-xs text-slate-400">30-day money-back guarantee</p>
                  )}

                  {/* Trust badges */}
                  <div className="border-t border-slate-100 dark:border-dk-border pt-4 space-y-2.5">
                    {[
                      { icon: <Shield size={14} className="text-emerald-500" />, text: "Full lifetime access" },
                      { icon: <BookOpen size={14} className="text-blue-500" />, text: `${totalLessons} lessons across ${courseChapters.length} modules` },
                      { icon: <Award size={14} className="text-amber-500" />, text: "Certificate of completion" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-dk-text-2">
                        {item.icon}
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal player (for mobile) */}
      <Footer />
    </div>
  );
};

export default CourseDetail;
