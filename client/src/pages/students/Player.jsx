import React, { useEffect, useState, useContext, useCallback } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/students/Footer";
import Rating from "../../components/students/Rating";
import Loading from "../../components/students/Loading";
import axios from "axios";
import { toast } from "react-toastify";

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendURL,
    getToken,
    userData,
    fetchUserEnrolledCourses,
  } = useContext(AppContext);

  const { courseId } = useParams();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);

  /* ================= GET COURSE FROM ENROLLED ================= */
  const getCourseData = useCallback(() => {
    const course = enrolledCourses.find((c) => c._id === courseId);
    if (!course) return;

    setCourseData(course);

    const ratingObj = course.courseRatings?.find(
      (r) => r.userId === userData?.clerkUserId
    );

    if (ratingObj) setInitialRating(ratingObj.rating);
  }, [enrolledCourses, courseId, userData]);

  /* ================= TOGGLE CHAPTER ================= */
  const toggleSection = (index) => {
    setOpenSection((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  /* ================= COURSE PROGRESS ================= */
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
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  }, [backendURL, getToken, courseId]);

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();

      const { data } = await axios.post(
        `${backendURL}/api/user/update-course-progress`,
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Lecture marked as completed");
        getCourseProgress();
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  /* ================= RATING ================= */
  const handleRate = async (rating) => {
    try {
      const token = await getToken();

      const { data } = await axios.post(
        `${backendURL}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Rating submitted");
        fetchUserEnrolledCourses();
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    if (enrolledCourses.length) getCourseData();
  }, [enrolledCourses, courseId, getCourseData]);

  useEffect(() => {
    getCourseProgress();
  }, [getCourseProgress]);

  /* ================= UI ================= */
  if (!courseData) return <Loading />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36 flex-grow">

        {/* LEFT */}
        <div>
          <h2 className="text-xl font-semibold mb-5">Course Structure</h2>

          {courseData.courseContent.map((chapter, index) => (
            <div key={index} className="border bg-white rounded-lg mb-3">
              <div
                onClick={() => toggleSection(index)}
                className="flex justify-between px-4 py-4 cursor-pointer"
              >
                <p className="font-semibold">{chapter.chapterTitle}</p>
                <p className="text-xs text-gray-500">
                  {chapter.chapterContent.length} lectures •{" "}
                  {calculateChapterTime(chapter)}
                </p>
              </div>

              {openSection[index] && (
                <ul className="border-t">
                  {chapter.chapterContent.map((lecture, i) => (
                    <li
                      key={i}
                      className="flex justify-between px-6 py-3 border-b"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            progressData?.completedLectures?.includes(
                              lecture.lectureId
                            )
                              ? assets.blue_tick_icon
                              : assets.play_icon
                          }
                          className="w-4"
                          alt=""
                        />
                        <div>
                          <p className="text-sm">{lecture.lectureTitle}</p>
                          <span className="text-xs text-gray-400">
                            {humanizeDuration(
                              lecture.lectureDuration * 60000,
                              { units: ["h", "m"] }
                            )}
                          </span>
                        </div>
                      </div>

                      {lecture.lectureUrl && (
                        <button
                          onClick={() =>
                            setPlayerData({
                              ...lecture,
                              chapter: index + 1,
                              lecture: i + 1,
                            })
                          }
                          className="text-blue-600 text-xs font-bold"
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

          {/* RATING */}
          <div className="mt-10 border-t pt-8 text-center">
            <h3 className="font-bold mb-3">Rate this Course</h3>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="md:sticky md:top-10">
          {playerData ? (
            <div className="bg-black rounded-xl overflow-hidden">
              <YouTube
                videoId={playerData.lectureUrl.split("/").pop()}
                iframeClassName="w-full aspect-video"
                opts={{ playerVars: { autoplay: 1 } }}
              />
              <div className="p-4 bg-white flex justify-between">
                <p className="font-semibold">
                  {playerData.chapter}.{playerData.lecture}{" "}
                  {playerData.lectureTitle}
                </p>
                <button
                  onClick={() =>
                    markLectureAsCompleted(playerData.lectureId)
                  }
                  className="text-sm border px-3 py-1 rounded"
                >
                  {progressData?.completedLectures?.includes(
                    playerData.lectureId
                  )
                    ? "Completed"
                    : "Mark completed"}
                </button>
              </div>
            </div>
          ) : (
            <img
              src={courseData.courseThumbnail}
              className="rounded-xl"
              alt=""
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Player;
  