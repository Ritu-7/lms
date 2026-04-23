import React, { useEffect, useState, useContext, useCallback } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import YouTube from "react-youtube";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";
import axios from "axios";
import { toast } from "react-toastify";

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendURL,
    getToken,
    fetchUserEnrolledCourses,
    userData // Make sure userData is provided in AppContext to get current user's ID
  } = useContext(AppContext);

  const { courseId } = useParams();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Rating States
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Enrollment Check: Watch button visibility logic
  const isEnrolled = enrolledCourses.some(course => 
    (typeof course === 'string' ? course : course._id) === courseId
  );

  // 2. Rating Check: Check if user already rated this course
  const hasUserRated = courseData?.courseRatings?.some(r => r.userId === userData?._id) || false;

  /* ================= HELPERS ================= */
  const getYouTubeID = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.split("/").pop();
  };

  /* ================= GET COURSE DATA ================= */
  const getCourseData = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/user/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setCourseData(data.courseData);
        if (!playerData && data.courseData.courseContent.length > 0) {
          const firstChapter = data.courseData.courseContent[0];
          if (firstChapter.chapterContent.length > 0) {
            setPlayerData({
              ...firstChapter.chapterContent[0],
              chapter: 1,
              lecture: 1
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
  }, [backendURL, courseId, getToken, playerData]);

  /* ================= FETCH PROGRESS ================= */
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

  /* ================= UPDATE PROGRESS ================= */
  const markLectureAsCompleted = async (lectureId) => {
    try {
      if (isUpdating) return;
      setIsUpdating(true);
      const token = await getToken();
      
      const { data } = await axios.post(
        `${backendURL}/api/user/update-course-progress`,
        { courseId, lectureId },
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

  /* ================= RATING HANDLER ================= */
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
        await getCourseData(); // Refresh to update rating status
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

  /* ================= EFFECTS ================= */
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
    <div className="flex flex-col min-h-screen bg-white">
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36 flex-grow">
        
        {/* LEFT SECTION: COURSE CONTENT */}
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <h2 className="text-xl font-semibold mb-5 text-gray-800">Course Structure</h2>
          <div className="space-y-3">
            {courseData.courseContent.map((chapter, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  onClick={() => toggleSection(index)}
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 bg-white"
                >
                  <div className="flex flex-col">
                    <p className="font-semibold text-sm sm:text-base">{chapter.chapterTitle}</p>
                    <p className="text-xs text-gray-500">
                      {chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}
                    </p>
                  </div>
                  <img 
                    src={assets.dropdown_icon} 
                    alt="" 
                    className={`w-3 transition-transform duration-300 ${openSection[index] ? 'rotate-180' : ''}`} 
                  />
                </div>

                {openSection[index] && (
                  <ul className="bg-gray-50 border-t border-gray-200">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className="flex justify-between items-center px-6 py-4 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <img
                            src={progressData?.completedLectures?.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon}
                            className="w-4 h-4 object-contain"
                            alt="status"
                          />
                          <p className="text-sm text-gray-700">{lecture.lectureTitle}</p>
                        </div>
                        {/* WATCH BUTTON: Only visible if Enrolled */}
                        {isEnrolled && lecture.lectureUrl && (
                          <button
                            onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })}
                            className="bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Watch
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* RATING SECTION: Only visible if Enrolled */}
          {isEnrolled && (
            <div className="mt-10 border-t pt-8 pb-10">
              <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-800">Rate this Course</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <img
                        key={star}
                        src={star <= (hover || rating) ? assets.star : assets.star_blank}
                        className={`w-8 h-8 ${hasUserRated ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={() => !hasUserRated && setRating(star)}
                        onMouseEnter={() => !hasUserRated && setHover(star)}
                        onMouseLeave={() => !hasUserRated && setHover(0)}
                        alt="star"
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleRatingSubmit}
                    disabled={isSubmitting || rating === 0 || hasUserRated}
                    className={`px-5 py-2 rounded-lg font-medium transition-all ${
                      hasUserRated 
                      ? 'bg-green-500 text-white cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : hasUserRated ? 'Submitted' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SECTION: PLAYER */}
        <div className="md:sticky md:top-10 h-fit">
          {playerData && isEnrolled ? (
            <div className="rounded-xl overflow-hidden shadow-2xl border bg-black">
              <YouTube
                videoId={getYouTubeID(playerData.lectureUrl)}
                iframeClassName="w-full aspect-video"
                opts={{ playerVars: { autoplay: 1 } }}
              />
              <div className="p-5 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-xs text-blue-600 font-bold">Chapter {playerData.chapter} • Lesson {playerData.lecture}</p>
                  <p className="font-semibold text-gray-800 text-lg">{playerData.lectureTitle}</p>
                </div>
                <button
                  onClick={() => markLectureAsCompleted(playerData.lectureId)}
                  disabled={isUpdating}
                  className={`text-sm px-6 py-2 rounded-full font-medium ${
                    progressData?.completedLectures?.includes(playerData.lectureId)
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {progressData?.completedLectures?.includes(playerData.lectureId) ? "✓ Completed" : "Mark as completed"}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-xl overflow-hidden shadow-lg border bg-white">
              <img src={courseData.courseThumbnail} className="w-full aspect-video object-cover" alt="" />
              <div className="p-6">
                <h1 className="text-2xl font-bold">{courseData.courseTitle}</h1>
                <p className="text-gray-500 mt-3 text-sm" dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}></p>
                {!isEnrolled && (
                    <div className="mt-5 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm font-medium">
                        Enroll in this course to access the content and track your progress.
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Player;