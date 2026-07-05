import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Line } from 'rc-progress';
import Footer from '../../components/students/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { BookOpen, Award, CheckCircle2, Search } from 'lucide-react';

const MyEnrollments = () => {
  const navigate = useNavigate();
  const { 
    enrolledCourses, 
    calculateCourseDuration, 
    userData, 
    fetchUserEnrolledCourses, 
    backendURL, 
    getToken, 
    calculateNoOfLectures 
  } = useContext(AppContext);

  const [courseProgress, setCourseProgress] = useState({});
  const [studyLibrary, setStudyLibrary] = useState({ bookmarks: [], notes: [], stats: { bookmarkCount: 0, noteCount: 0 } });
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const certificates = Array.isArray(userData?.certificates) ? userData.certificates : [];

  const getCourseProgress = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !enrolledCourses || enrolledCourses.length === 0) return;

      const progressDataMap = {};

      await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            const { data } = await axios.post(
              `${backendURL}/api/user/get-course-progress`,
              { courseId: course._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const totalLectures = data.success && data.progressData?.totalLessons
              ? data.progressData.totalLessons
              : calculateNoOfLectures(course) || 0;
            const lectureCompleted = data.success && data.progressData
              ? (data.progressData.completedCount ?? data.progressData.completedLessons?.length ?? data.progressData.completedLectures?.length ?? 0)
              : 0;
            
            progressDataMap[course._id] = { totalLectures, lectureCompleted };
          } catch {
            progressDataMap[course._id] = { totalLectures: calculateNoOfLectures(course), lectureCompleted: 0 };
          }
        })
      );
      
      setCourseProgress(progressDataMap);
    } catch {
      toast.error("Failed to load course progress");
    }
  }, [backendURL, getToken, enrolledCourses, calculateNoOfLectures]);

  const fetchStudyLibrary = useCallback(async (query = "") => {
    try {
      setLibraryLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/study-library/me`, {
        params: query ? { query } : {},
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
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLibraryLoading(false);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses();
    }
  }, [userData, fetchUserEnrolledCourses]);

  useEffect(() => {
    if (enrolledCourses && enrolledCourses.length > 0) {
      getCourseProgress();
    }
  }, [enrolledCourses, getCourseProgress]);

  useEffect(() => {
    if (!userData) return undefined;
    const timer = window.setTimeout(() => {
      fetchStudyLibrary(libraryQuery);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [fetchStudyLibrary, libraryQuery, userData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">My Learning</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Track your progress, assignments, and earned certificates.</p>
          </div>
          <button
            onClick={() => navigate('/assignments')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
          >
            <BookOpen size={16} />
            My Assignments
          </button>
        </header>

        {/* Stats */}
        <div className="grid gap-6 mb-10 md:grid-cols-3">
          {[
            { label: 'Learner', value: userData?.name || "Student", color: 'text-slate-900' },
            { label: 'Certificates', value: certificates.length, color: 'text-blue-600' },
            { label: 'Completed', value: Object.values(courseProgress).filter((stats) => Math.round((stats.lectureCompleted / (stats.totalLectures || 1)) * 100) >= 100).length, color: 'text-emerald-600' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold font-space-grotesk ${stat.color} dark:text-white`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Courses Table */}
        <div className="mb-10 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Active Courses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4 hidden md:table-cell">Duration</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course) => {
                    const stats = courseProgress[course._id] || { lectureCompleted: 0, totalLectures: 0 };
                    const total = stats.totalLectures || 1;
                    const percentage = Math.min(Math.round((stats.lectureCompleted / total) * 100), 100);
                    const isFinished = percentage === 100;

                    return (
                      <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <img src={course.courseThumbnail} className="w-16 h-10 object-cover rounded-lg border border-slate-200 dark:border-white/10" alt="" />
                            <h2 className="font-semibold text-slate-900 dark:text-white">{course.courseTitle}</h2>
                          </div>
                        </td>
                        <td className="px-6 py-5 hidden md:table-cell text-slate-600 dark:text-slate-400">
                          {calculateCourseDuration(course)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="w-40">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{percentage}%</span>
                            </div>
                            <Line strokeWidth={4} percent={percentage} strokeColor={isFinished ? "#10b981" : "#2563eb"} trailColor="#e2e8f0" strokeLinecap="round" className="h-1.5" />
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => navigate(`/player/${course._id}`)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isFinished
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
                            }`}
                          >
                            {isFinished ? 'Review' : 'Continue'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-slate-500">No enrollments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Certificates & Library (Briefly styled for now as part of redesign) */}
      </div>
      <Footer />
    </div>
  );
};

export default MyEnrollments;
