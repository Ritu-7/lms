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
import { useAuth, useClerk } from "@clerk/clerk-react";

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

  const { userId } = useAuth();
  const { openSignIn } = useClerk();

  const [courseData, setCourseData] = useState(null);
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);

  // Fetch Course Data
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

  // Enrollment / Purchase Logic
  const enrollCourse = async () => {
    try {
      if (!userId) {
        openSignIn();
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
        } catch (error) {
          toast.error("Payment verification failed.");
        }
      },
    };
    new window.Razorpay(options).open();
  };

  // Helper: Check Enrollment
  const isAlreadyEnrolled = userData?.enrolledCourses?.includes(courseData?._id);

  const toggleSection = (i) => setOpenSection((p) => ({ ...p, [i]: !p[i] }));

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (!courseData) return <Loading />;

  const rating = Number(calculateRating(courseData)) || 0;

  return (
    <>
      <div className="flex md:flex-row flex-col gap-10 md:px-36 px-6 pt-20">
        {/* LEFT SIDE */}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{courseData.courseTitle}</h1>
          <p className="mt-4 text-gray-600" dangerouslySetInnerHTML={{ __html: courseData.courseDescription }} />

          {/* Course Structure */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Course Structure</h2>
            {courseData.courseContent?.map((chapter, index) => (
              <div key={index} className="border mb-3 rounded">
                <div onClick={() => toggleSection(index)} className="flex justify-between p-4 cursor-pointer bg-gray-50">
                  <p className="font-medium">Chapter {index + 1}: {chapter.chapterTitle}</p>
                  <p className="text-sm text-gray-500">
                    {chapter.chapterContent?.length || 0} lectures • {calculateChapterTime(chapter)}
                  </p>
                </div>

                {openSection[index] && (
                  <ul className="p-4 border-t text-sm">
                    {chapter.chapterContent?.map((lecture, i) => {
                      // Logic: Full access if enrolled, else only free previews
                      const canWatch = isAlreadyEnrolled || lecture.isPreviewFree;

                      return (
                        <li key={i} className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src={canWatch ? assets.play_icon : assets.lock_icon} 
                              className="w-4 h-4" 
                              alt="status" 
                            />
                            <p className={!canWatch ? "text-gray-400" : "text-gray-800"}>
                              {i + 1}. {lecture.lectureTitle}
                            </p>
                            {lecture.isPreviewFree && !isAlreadyEnrolled && (
                              <span className="ml-2 text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded uppercase font-bold">
                                Preview
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {canWatch && lecture.lectureUrl && (
                              <span
                                onClick={() => setPlayerData({ videoId: getYoutubeVideoId(lecture.lectureUrl) })}
                                className="text-blue-600 cursor-pointer underline font-medium"
                              >
                                Watch
                              </span>
                            )}
                            <span className="text-gray-500">
                              {humanizeDuration(lecture.lectureDuration * 60000, { units: ["h", "m"] })}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE (Card) */}
        <div className="w-full md:w-[380px] shadow-lg rounded h-fit sticky top-20 bg-white">
          {playerData ? (
            <div className="relative">
              <YouTube
                videoId={playerData.videoId}
                iframeClassName="w-full aspect-video"
                opts={{ playerVars: { autoplay: 1 } }}
              />
              <button onClick={() => setPlayerData(null)} className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded">
                Close Preview
              </button>
            </div>
          ) : (
            <img src={courseData.courseThumbnail} alt="" className="w-full" />
          )}

          <div className="p-5">
            <p className="text-2xl font-semibold">
              {currency} {(courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2)}
            </p>
            <button
              onClick={enrollCourse}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition font-medium"
            >
              {isAlreadyEnrolled ? "Go to Course" : "Enroll Now"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CourseDetail;