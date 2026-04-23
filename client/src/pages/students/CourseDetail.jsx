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
import { useAuth, useClerk } from "@clerk/clerk-react"; // Import Clerk hooks

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    currency,
    backendURL,
    getToken,
    userData,
  } = useContext(AppContext);

  // Clerk Hooks
  const { userId } = useAuth();
  const { openSignIn } = useClerk();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);

  /* ================= FETCH COURSE ================= */
  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const { data } = await axios.get(`${backendURL}/api/courses/${id}`);

        if (data.success) {
          setCourseData(data.data);
        } else {
          toast.error(data.message || "Course not found");
        }
      } catch (error) {
        toast.error("Failed to load course");
      }
    };

    fetchCourseDetail();
  }, [id, backendURL]);

  /* ================= ENROLL ================= */
  const enrollCourse = async () => {
    try {
      // ✅ FIXED: Using Clerk userId check instead of userData
      if (!userId) {
        openSignIn(); // Opens Clerk modal instead of redirecting
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
      toast.error(
        error.response?.data?.message || "An unexpected error occurred during enrollment."
      );
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
        } catch (error) {
          toast.error(
            error.response?.data?.message || "Payment verification failed. Please try again."
          );
        }
      },
    };

    new window.Razorpay(options).open();
  };

  /* ================= HELPERS ================= */
  const isAlreadyEnrolled = userData?.enrolledCourses?.includes(courseData?._id);

  const toggleSection = (i) => setOpenSection((p) => ({ ...p, [i]: !p[i] }));

  if (!courseData) return <Loading />;

  const rating = Number(calculateRating(courseData)) || 0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return match[2];
    return null;
  };

  /* ================= UI ================= */
  return (
    <>
      <div className="flex md:flex-row flex-col gap-10 md:px-36 px-6 pt-20">
        {/* LEFT */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{courseData.courseTitle}</h1>

          <p
            className="mt-4 text-gray-600"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription,
            }}
          />

          {/* RATING */}
          <div className="flex items-center gap-2 mt-4">
            <span>{rating.toFixed(1)}</span>
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                className="w-4"
                src={
                  i < fullStars
                    ? assets.star
                    : i === fullStars && hasHalfStar
                    ? assets.star_half
                    : assets.star_blank
                }
                alt=""
              />
            ))}
            <span className="text-sm text-gray-500">
              ({courseData.courseRatings?.length || 0} ratings)
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-800">Students</p>
              <p>{courseData.enrolledStudents?.length || 0}</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Lectures</p>
              <p>{calculateNoOfLectures(courseData)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">Duration</p>
              <p>{calculateCourseDuration(courseData.courseContent)}</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Course Structure</h2>
            {courseData.courseContent?.map((chapter, index) => (
              <div key={index} className="border mb-3 rounded">
                <div
                  onClick={() => toggleSection(index)}
                  className="flex justify-between p-4 cursor-pointer bg-gray-50"
                >
                  <p className="font-medium">
                    Chapter {index + 1}: {chapter.chapterTitle}
                  </p>
                  <p className="text-sm text-gray-500">
                    {chapter.chapterContent?.length || 0} lectures •{" "}
                    {calculateChapterTime(chapter)}
                  </p>
                </div>

                {openSection[index] && (
                  <ul className="p-4 border-t text-sm">
                    {chapter.chapterContent?.map((lecture, i) => (
                      <li key={i} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              lecture.isPreviewFree ? assets.play_icon : assets.lock_icon
                            }
                            className="w-4 h-4"
                            alt=""
                          />
                          <p>
                            {i + 1}. {lecture.lectureTitle}
                          </p>
                          {lecture.isPreviewFree && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              Preview
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {lecture.isPreviewFree && lecture.lectureUrl && (
                            <span
                              onClick={() =>
                                setPlayerData({
                                  videoId: getYoutubeVideoId(lecture.lectureUrl),
                                })
                              }
                              className="text-blue-600 cursor-pointer underline"
                            >
                              Watch
                            </span>
                          )}
                          <span className="text-gray-500">
                            {humanizeDuration(lecture.lectureDuration * 60000, {
                              units: ["h", "m"],
                            })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-[380px] shadow-lg rounded h-fit sticky top-20">
          {playerData ? (
            <div className="relative">
              <YouTube
                videoId={playerData.videoId}
                iframeClassName="w-full aspect-video"
                opts={{ playerVars: { autoplay: 1 } }}
              />
              <button
                onClick={() => setPlayerData(null)}
                className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded"
              >
                Close Preview
              </button>
            </div>
          ) : (
            <img src={courseData.courseThumbnail} alt="" className="w-full" />
          )}

          <div className="p-5">
            <p className="text-2xl font-semibold">
              {currency}
              {(
                courseData.coursePrice -
                (courseData.discount * courseData.coursePrice) / 100
              ).toFixed(2)}
            </p>

            <div className="flex gap-4 text-sm mt-2 text-gray-500">
              <p>{calculateCourseDuration(courseData.courseContent)}</p>
              <p>{calculateNoOfLectures(courseData)} lessons</p>
            </div>

            <button
              onClick={enrollCourse}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
            >
              {isAlreadyEnrolled ? "Go to Course" : "Enroll Now"}
            </button>

            {courseData.courseFeatures && courseData.courseFeatures.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">What you'll get:</h3>
                <ul className="space-y-2">
                  {courseData.courseFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <img src={assets.blue_tick_icon} className="w-4 h-4" alt="tick" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CourseDetail;