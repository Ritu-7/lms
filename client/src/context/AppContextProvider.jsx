import { useEffect, useState, useCallback } from "react";
import humanizeDuration from "humanize-duration";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "./AppContext";
import { normalizeResourceCollection, resourceToLegacyAttachment } from "../utils/resourceUtils";

export const AppContextProvider = ({ children }) => {
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setAllCourses] = useState([]);
  const [platformHomeData, setPlatformHomeData] = useState({
    stats: null,
    featuredCourses: [],
    latestCourses: [],
    topEducators: [],
    categories: [],
    testimonials: [],
    announcements: [],
  });
  const [adminOverview, setAdminOverview] = useState({
    stats: null,
    students: [],
    educators: [],
    courses: [],
    categories: [],
    enrollments: [],
    assignments: [],
    certificates: [],
    announcements: [],
    payments: [],
    reports: [],
    analytics: { trend: [], breakdown: [], topCourses: [] },
    settingsSections: [],
  });
  const [isEducator, setIsEducator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // Notification system states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationTotalPages, setNotificationTotalPages] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);


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

  const fetchPlatformHomeData = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/platform/home`);
      if (data.success) {
        setPlatformHomeData({
          stats: data.data?.stats || null,
          featuredCourses: Array.isArray(data.data?.featuredCourses) ? data.data.featuredCourses : [],
          latestCourses: Array.isArray(data.data?.latestCourses) ? data.data.latestCourses : [],
          topEducators: Array.isArray(data.data?.topEducators) ? data.data.topEducators : [],
          categories: Array.isArray(data.data?.categories) ? data.data.categories : [],
          testimonials: Array.isArray(data.data?.testimonials) ? data.data.testimonials : [],
          announcements: Array.isArray(data.data?.announcements) ? data.data.announcements : [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch platform overview:", error.message);
    }
  }, [backendURL]);

  const fetchAdminOverview = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get(`${backendURL}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setAdminOverview({
          stats: data.data?.stats || null,
          students: Array.isArray(data.data?.students) ? data.data.students : [],
          educators: Array.isArray(data.data?.educators) ? data.data.educators : [],
          courses: Array.isArray(data.data?.courses) ? data.data.courses : [],
          categories: Array.isArray(data.data?.categories) ? data.data.categories : [],
          enrollments: Array.isArray(data.data?.enrollments) ? data.data.enrollments : [],
          assignments: Array.isArray(data.data?.assignments) ? data.data.assignments : [],
          certificates: Array.isArray(data.data?.certificates) ? data.data.certificates : [],
          announcements: Array.isArray(data.data?.announcements) ? data.data.announcements : [],
          payments: Array.isArray(data.data?.payments) ? data.data.payments : [],
          reports: Array.isArray(data.data?.reports) ? data.data.reports : [],
          analytics: data.data?.analytics || { trend: [], breakdown: [], topCourses: [] },
          settingsSections: Array.isArray(data.data?.settingsSections) ? data.data.settingsSections : [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin overview:", error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken]);

  /*
     FETCH USER DATA (CLERK + DB)
  */
  const fetchUserData = useCallback(async () => {
   try {
     if (!user) return;

     const token = await getToken();

     if (!token) {
       return;
     }

     const { data } = await axios.get(`${backendURL}/api/user/data`, {
       headers: { Authorization: `Bearer ${token}` },
     });

     if (data.success) {
       setUserData(data.user);
       setIsEducator(data.user.role === "educator");
      setIsAdmin(data.user.role === "admin");
     } else {
       toast.error(data.message);
     }
   } catch (error) {
     console.error("Fetch user data error:", error);
     toast.error(error.response?.data?.message || "Failed to fetch user data");
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
     NOTIFICATION SYSTEM LOGIC
  ================================ */
  const fetchNotifications = useCallback(
    async (pageNum = 1, filters = {}) => {
      if (!user) return;
      setIsLoadingNotifications(true);
      setNotificationsError(null);
      try {
        const token = await getToken();
        if (!token) return;

        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "15",
        });
        if (filters.type) params.set("type", filters.type);
        if (filters.unread) params.set("unread", "true");

        const { data } = await axios.get(
          `${backendURL}/api/notifications?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          if (pageNum === 1) {
            setNotifications(data.notifications || []);
          } else {
            setNotifications((prev) => [...prev, ...(data.notifications || [])]);
          }
          setNotificationPage(data.page || pageNum);
          setNotificationTotalPages(data.totalPages || 1);
          setHasMoreNotifications((data.page || pageNum) < (data.totalPages || 1));
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch (err) {
        setNotificationsError(err.response?.data?.message || err.message || "Failed to fetch notifications");
      } finally {
        setIsLoadingNotifications(false);
      }
    },
    [backendURL, getToken, user]
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      if (!token) return;

      const { data } = await axios.get(
        `${backendURL}/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // Silently ignore
    }
  }, [backendURL, getToken, user]);

  const markNotificationRead = useCallback(
    async (id) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const token = await getToken();
        await axios.patch(
          `${backendURL}/api/notifications/${id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        fetchNotifications(1);
      }
    },
    [backendURL, getToken, fetchNotifications]
  );

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      const token = await getToken();
      await axios.patch(
        `${backendURL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      fetchNotifications(1);
    }
  }, [backendURL, getToken, fetchNotifications]);

  const deleteNotification = useCallback(
    async (id) => {
      const target = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        const token = await getToken();
        await axios.delete(`${backendURL}/api/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        fetchNotifications(1);
      }
    },
    [backendURL, getToken, notifications, fetchNotifications]
  );

  const loadMoreNotifications = useCallback(() => {
    if (hasMoreNotifications && !isLoadingNotifications) {
      fetchNotifications(notificationPage + 1);
    }
  }, [hasMoreNotifications, isLoadingNotifications, notificationPage, fetchNotifications]);

  // Initial fetch and unread count polling
  useEffect(() => {
    if (user) {
      fetchNotifications(1);
      fetchUnreadCount();

      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  /* ===============================
     BECOME EDUCATOR (IMPORTANT)
  ================================ */
  const becomeEducator = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.post(
        `${backendURL}/api/educator/update-role`,
        {},
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

  const getChapterLectures = useCallback((chapter) => {
    if (Array.isArray(chapter?.chapterContent)) {
      return chapter.chapterContent.map((lecture, index) => ({
        lectureId: lecture.lectureId || lecture.lessonId || lecture._id?.toString() || `${index + 1}`,
        lectureTitle: lecture.lectureTitle || lecture.lessonTitle || `Lesson ${index + 1}`,
        lectureDuration: Number(lecture.lectureDuration || lecture.lessonDuration || 0),
        lectureUrl:
          lecture.lectureUrl ||
          lecture.lessonVideoUrl ||
          lecture.lessonPdfUrl ||
          lecture.lessonExternalLink ||
          "",
        lectureType: lecture.lectureType || lecture.lessonType || "video",
        lectureVideoUrl: lecture.lectureVideoUrl || lecture.lessonVideoUrl || "",
        lecturePdfUrl: lecture.lecturePdfUrl || lecture.lessonPdfUrl || "",
        lectureRichTextContent: lecture.lectureRichTextContent || lecture.lessonRichTextContent || "",
        lectureExternalLink: lecture.lectureExternalLink || lecture.lessonExternalLink || "",
        lectureTranscriptPlaceholder:
          lecture.lectureTranscriptPlaceholder || lecture.lessonTranscriptPlaceholder || "",
        lessonCompletionRules: lecture.lessonCompletionRules || lecture.lectureCompletionRules || lecture.completionRules || {},
        lectureResources: normalizeResourceCollection(
          lecture.lectureResources,
          lecture.lessonResources,
          lecture.resources,
          lecture.lectureAttachments,
          lecture.lessonAttachments
        ),
        lectureAttachments: normalizeResourceCollection(
          lecture.lectureResources,
          lecture.lessonResources,
          lecture.resources,
          lecture.lectureAttachments,
          lecture.lessonAttachments
        ).map(resourceToLegacyAttachment),
        lectureStatus: lecture.lectureStatus || lecture.lessonStatus || "draft",
        contentType: lecture.contentType || lecture.lessonType || lecture.lectureType || "video",
        isPreviewFree: Boolean(lecture.isPreviewFree),
        previewMode: Boolean(lecture.previewMode),
        lectureOrder: Number(lecture.lectureOrder || lecture.lessonOrder || index + 1),
      }));
    }
    if (!Array.isArray(chapter?.lessons)) return [];

    return chapter.lessons.map((lesson, index) => ({
      lectureId: lesson.lessonId || lesson._id?.toString() || `${index + 1}`,
      lectureTitle: lesson.lessonTitle || `Lesson ${index + 1}`,
      lectureDuration: Number(lesson.lessonDuration || 0),
      lectureUrl: lesson.lessonVideoUrl || lesson.lessonPdfUrl || lesson.lessonExternalLink || "",
      lectureType: lesson.lessonType || "video",
      lectureVideoUrl: lesson.lessonVideoUrl || "",
      lecturePdfUrl: lesson.lessonPdfUrl || "",
      lectureRichTextContent: lesson.lessonRichTextContent || "",
      lectureExternalLink: lesson.lessonExternalLink || "",
      lectureTranscriptPlaceholder: lesson.lessonTranscriptPlaceholder || "",
      lessonCompletionRules: lesson.lessonCompletionRules || lesson.lectureCompletionRules || lesson.completionRules || {},
      lectureResources: normalizeResourceCollection(lesson.lessonResources, lesson.resources, lesson.lessonAttachments),
      lectureAttachments: normalizeResourceCollection(lesson.lessonResources, lesson.resources, lesson.lessonAttachments).map(
        resourceToLegacyAttachment
      ),
      lectureStatus: lesson.lessonStatus || "draft",
      contentType: lesson.lessonType || "video",
      isPreviewFree: Boolean(lesson.isPreviewFree),
      previewMode: Boolean(lesson.previewMode),
      lectureOrder: Number(lesson.lessonOrder || index + 1),
    }));
  }, []);

  const getCourseChapters = useCallback((course) => {
    if (Array.isArray(course?.courseContent) && course.courseContent.length > 0) {
      return course.courseContent;
    }

    if (!Array.isArray(course?.modules)) return [];

    return course.modules.map((module, index) => ({
      chapterId: module.moduleId || module._id?.toString() || `${index + 1}`,
      chapterOrder: Number(module.moduleOrder || index + 1),
      chapterTitle: module.moduleTitle || `Module ${index + 1}`,
      collapsed: Boolean(module.collapsed),
      chapterContent: getChapterLectures(module),
    }));
  }, [getChapterLectures]);

  const calculateChapterTime = (chapter) => {
    const chapterContent = getChapterLectures(chapter);
    if (!chapterContent.length) return "0 min";

    const totalMinutes = chapterContent.reduce(
      (sum, lec) => sum + (lec.lectureDuration || 0),
      0
    );

    return humanizeDuration(totalMinutes * 60000, {
      units: ["h", "m"],
      round: true,
    });
  };

  // Inside AppContext.jsx

const calculateCourseDuration = (course) => {
    let totalDuration = 0;

    getCourseChapters(course).forEach(chapter => {
        getChapterLectures(chapter).forEach(lecture => {
            totalDuration += Number(lecture.lectureDuration || 0);
        });
    });

    if (totalDuration === 0) return "0m";

    const hours = Math.floor(totalDuration / 60);
    const mins = Math.round(totalDuration % 60); // Use Math.round to kill decimals

    if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
};

  const calculateNoOfLectures = (course) => {
    if (!course) return 0;

    let count = 0;
    getCourseChapters(course).forEach((chapter) => {
      count += getChapterLectures(chapter).length;
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
      setIsAdmin(false);
      setUserData(null);
      setEnrolledCourses([]);
    }
  }, [user, fetchUserData, fetchUserEnrolledCourses]);

  useEffect(() => {
    fetchPlatformHomeData();
  }, [fetchPlatformHomeData]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminOverview();
    } else {
      setAdminOverview({
        stats: null,
        students: [],
        educators: [],
        courses: [],
        categories: [],
        enrollments: [],
        assignments: [],
        certificates: [],
        announcements: [],
        payments: [],
        reports: [],
        analytics: { trend: [], breakdown: [], topCourses: [] },
        settingsSections: [],
      });
    }
  }, [isAdmin, fetchAdminOverview]);

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
    isAdmin,
    setIsAdmin,
    becomeEducator,

    platformHomeData,
    fetchPlatformHomeData,

    adminOverview,
    fetchAdminOverview,

    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    getCourseChapters,

    getToken,

    // Notification system context variables
    notifications,
    unreadCount,
    isLoadingNotifications,
    notificationsError,
    notificationPage,
    notificationTotalPages,
    hasMoreNotifications,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    loadMoreNotifications,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
