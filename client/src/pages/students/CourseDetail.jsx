import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/students/Loading";
import Footer from "../../components/students/Footer";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import { useAuthModal } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, FileText, ExternalLink, ChevronDown, CheckCircle2, Lock } from "lucide-react";
import {
  getResourceActionLabel,
  normalizeResourceCollection,
} from "../../utils/resourceUtils";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    calculateChapterTime,
    currency,
    backendURL,
    getToken,
    enrolledCourses,
    getCourseChapters,
  } = useContext(AppContext);

  const { userId } = useAuth();
  const { openAuth } = useAuthModal();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const { data } = await axios.get(`${backendURL}/api/courses/${id}`);
        if (data.success) {
          setCourseData(data.data);
        } else {
          toast.error(data.message || "Course not found");
        }
      } catch {
        toast.error("Failed to load course");
      }
    };
    fetchCourseDetail();
  }, [id, backendURL]);

  const isAlreadyEnrolled = enrolledCourses.some((course) => (typeof course === "string" ? course : course._id) === courseData?._id);
  const courseChapters = getCourseChapters(courseData);

  const enrollCourse = async () => {
    try {
      if (!userId) {
        openAuth("student");
        return;
      }

      if (isAlreadyEnrolled) {
        navigate(`/player/${courseData._id}`);
        return;
      }

      const token = await getToken();
      const { data } = await axios.post(
        `${backendURL}/api/user/purchase`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) initPay(data.order);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error during enrollment.");
    }
  };

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: courseData.courseTitle,
      order_id: order.id,
      handler: async (response) => {
        try {
          const token = await getToken();
          const { data } = await axios.post(
            `${backendURL}/api/user/verify-payment`,
            response,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data.success) {
            toast.success("Enrollment successful");
            navigate("/my-enrollments");
          }
        } catch {
          toast.error("Payment verification failed.");
        }
      },
    };
    new window.Razorpay(options).open();
  };

  const toggleSection = (i) => setOpenSection((p) => ({ ...p, [i]: !p[i] }));
  const getLessonResources = (lesson = {}) =>
    normalizeResourceCollection(
      lesson.lectureResources,
      lesson.lessonResources,
      lesson.resources,
      lesson.lectureAttachments,
      lesson.lessonAttachments
    );
  const getLessonType = (lesson = {}) =>
    lesson.lectureType || lesson.lessonType || lesson.contentType || getLessonResources(lesson)[0]?.resourceType || "video";
  const getLessonUrl = (lesson = {}) =>
    lesson.lectureUrl ||
    lesson.lessonUrl ||
    lesson.lessonVideoUrl ||
    lesson.lessonPdfUrl ||
    lesson.lessonExternalLink ||
    getLessonResources(lesson)[0]?.resourceUrl ||
    "";

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderPreview = (lesson) => {
    const lessonType = getLessonType(lesson);
    const lessonUrl = getLessonUrl(lesson);

    if (lessonType === "pdf") {
      return <iframe src={lesson.lessonPdfUrl || lessonUrl} title={lesson.lectureTitle} className="w-full aspect-video bg-white" />;
    }

    if (lessonType === "rich_text") {
      return (
        <div className="w-full aspect-video overflow-auto bg-white p-6 text-slate-800">
          <div
            className="prose prose-sm max-w-none text-slate-600"
            dangerouslySetInnerHTML={{ __html: lesson.lectureRichTextContent || lesson.lessonRichTextContent || "" }}
          />
        </div>
      );
    }

    if (lessonType === "external_link") {
      return (
        <div className="w-full aspect-video bg-white p-8 flex flex-col items-center justify-center gap-4 text-center">
          <ExternalLink className="w-12 h-12 text-blue-600" />
          <h3 className="text-xl font-semibold text-slate-900">{lesson.lectureTitle}</h3>
          <a
            href={lesson.lessonExternalLink || lessonUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open Link
          </a>
        </div>
      );
    }

    if (lessonType === "quiz" || lessonType === "assignment") {
      return (
        <div className="w-full aspect-video bg-white p-8 flex flex-col items-center justify-center gap-4 text-center">
          {lessonType === "quiz" ? <FileText className="w-12 h-12 text-blue-600" /> : <CheckCircle2 className="w-12 h-12 text-blue-600" />}
          <h3 className="text-xl font-semibold text-slate-900">{lesson.lectureTitle}</h3>
          {lesson.lessonExternalLink || lessonUrl ? (
            <a
              href={lesson.lessonExternalLink || lessonUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white"
            >
              {lessonType === "quiz" ? "Open Quiz" : "Open Assignment"}
            </a>
          ) : null}
        </div>
      );
    }

    const youtubeId = getYoutubeVideoId(lesson.lessonVideoUrl || lessonUrl);
    if (youtubeId) {
      return <YouTube videoId={youtubeId} iframeClassName="w-full aspect-video" opts={{ playerVars: { autoplay: 1 } }} />;
    }

    return <iframe src={lesson.lessonVideoUrl || lessonUrl} title={lesson.lectureTitle} className="w-full aspect-video" />;
  };

  if (!courseData) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8">
          <h1 className="text-4xl font-bold font-space-grotesk text-slate-900 dark:text-white leading-tight">{courseData.courseTitle}</h1>
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: courseData.courseDescription }} />

          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white">Course Structure</h2>
            {courseChapters.map((chapter, index) => (
              <div key={index} className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <button onClick={() => toggleSection(index)} className="flex w-full justify-between items-center p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Module {index + 1}: {chapter.chapterTitle}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{chapter.chapterContent?.length || 0} lessons • {calculateChapterTime(chapter)}</span>
                    <motion.div animate={{ rotate: openSection[index] ? 180 : 0 }}>
                      <ChevronDown size={18} />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {openSection[index] && (
                    <motion.ul 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-slate-200 dark:border-white/10 p-6 space-y-4 bg-slate-50 dark:bg-slate-800/30 text-sm"
                    >
                      {chapter.chapterContent?.map((lecture, i) => {
                        const lessonType = getLessonType(lecture);
                        const canWatch = isAlreadyEnrolled || lecture.isPreviewFree || lecture.previewMode;
                        const actionLabel = getResourceActionLabel(lessonType);

                        return (
                          <li key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {canWatch ? <PlayCircle className="w-4 h-4 text-blue-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                              <p className={!canWatch ? "text-slate-500" : "text-slate-800 dark:text-slate-200"}>
                                {i + 1}. {lecture.lectureTitle}
                              </p>
                              {lecture.isPreviewFree && !isAlreadyEnrolled && (
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md uppercase font-bold">
                                  Preview
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              {canWatch && (
                                <button
                                  onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                                  className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
                                >
                                  {actionLabel}
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

        <div className="w-full lg:w-[380px] h-fit sticky top-24">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            {playerData ? (
              <div className="relative">
                {renderPreview(playerData)}
                <button
                  onClick={() => setPlayerData(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 text-xs rounded-lg hover:bg-black/80"
                >
                  Close Preview
                </button>
              </div>
            ) : (
              <img src={courseData.courseThumbnail} alt="" className="w-full aspect-video object-cover" />
            )}

            <div className="p-6 space-y-6">
              <p className="text-4xl font-bold font-space-grotesk text-slate-900 dark:text-white">
                {currency} {(courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2)}
              </p>
              <button
                onClick={enrollCourse}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
              >
                {isAlreadyEnrolled ? "Go to Course" : "Enroll Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseDetail;
