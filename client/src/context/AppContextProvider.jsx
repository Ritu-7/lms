import { useEffect, useState, useCallback } from "react";
import humanizeDuration from "humanize-duration";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "./AppContext";

export const AppContextProvider = ({ children }) => {
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  /* 
     FETCH ALL COURSES (PUBLIC)
   */
  const fetchAllCourses = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/courses/all`);
      if (data.success) {
        setAllCourses(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [backendURL]);

  /*
     FETCH USER DATA (CLERK + DB)
  */
  const fetchUserData = useCallback(async () => {
    try {
      if (!user) return;

      // Clerk role
      const role = user?.publicMetadata?.role;
      setIsEducator(role === "educator");

      const token = await getToken();

      const { data } = await axios.get(`${backendURL}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken, user]);

  /* ===============================
     FETCH ENROLLED COURSES
  ================================ */
  const fetchUserEnrolledCourses = useCallback(async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(
        `${backendURL}/api/user/enrolled-courses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        setEnrolledCourses(Array.isArray(data.enrolledCourses) ? data.enrolledCourses.reverse() : []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken]);

  /* ===============================
     BECOME EDUCATOR (IMPORTANT)
  ================================ */
  const becomeEducator = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(
        `${backendURL}/api/educator/update-role`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success("You are now an educator 🎉");

        // Refresh user + role
        await fetchUserData();

        navigate("/educator/dashboard");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  /* ===============================
     HELPERS
  ================================ */
  const calculateRating = (course) => {
    if (!course?.courseRatings || course.courseRatings.length === 0) return 0;
    const total = course.courseRatings.reduce(
      (sum, r) => sum + r.rating,
      0
    );
    return Number((total / course.courseRatings.length).toFixed(1));
  };

  const calculateChapterTime = (chapter) => {
    if (!chapter || !Array.isArray(chapter.chapterContent)) return "0 min";

    const totalMinutes = chapter.chapterContent.reduce(
      (sum, lec) => sum + (lec.lectureDuration || 0),
      0
    );

    return humanizeDuration(totalMinutes * 60000, {
      units: ["h", "m"],
      round: true,
    });
  };

  const calculateCourseDuration = (courseContent) => {
    if (!courseContent || !Array.isArray(courseContent)) return "0 min";

    let totalMinutes = 0;
    courseContent.forEach((chapter) => {
      chapter.chapterContent?.forEach((lecture) => {
        totalMinutes += lecture.lectureDuration || 0;
      });
    });

    return humanizeDuration(totalMinutes * 60000, {
      units: ["h", "m"],
      round: true,
    });
  };

  const calculateNoOfLectures = (course) => {
    if (!course || !Array.isArray(course.courseContent)) return 0;

    let count = 0;
    course.courseContent.forEach((chapter) => {
      count += chapter.chapterContent?.length || 0;
    });

    return count;
  };

  /* ===============================
     EFFECTS
  ================================ */
  useEffect(() => {
    fetchAllCourses();
  }, [fetchAllCourses]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserEnrolledCourses();
    } else {
      setIsEducator(false);
      setUserData(null);
      setEnrolledCourses([]);
    }
  }, [user, fetchUserData, fetchUserEnrolledCourses]);

  /* ===============================
     CONTEXT VALUE
  ================================ */
  const value = {
    currency,
    backendURL,

    allCourses,
    fetchAllCourses,

    userData,
    setUserData,

    enrolledCourses,
    fetchUserEnrolledCourses,

    isEducator,
    setIsEducator,
    becomeEducator,

    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,

    getToken,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
