import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'rc-progress';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkX, BookOpen, Layers, RefreshCw, Search, Trash2, UserRound } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/students/Footer';

const getCourseId = (courseOrId) => {
  if (!courseOrId) return '';
  if (typeof courseOrId === 'string') return courseOrId;
  return courseOrId._id || courseOrId.id || '';
};

const getInstructorName = (course) => (
  course?.educator?.name ||
  course?.instructor?.name ||
  course?.educatorName ||
  course?.instructorName ||
  'Unknown Instructor'
);

const getCategoryName = (course) => (
  course?.category ||
  course?.courseCategory ||
  course?.courseLevel ||
  'General'
);

const Bookmarks = () => {
  const navigate = useNavigate();
  const {
    allCourses,
    enrolledCourses,
    backendURL,
    getToken,
    calculateNoOfLectures,
    fetchUserEnrolledCourses,
    userData,
  } = useContext(AppContext);

  const [bookmarks, setBookmarks] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [removingId, setRemovingId] = useState('');

  const courseLookup = useMemo(() => {
    const lookup = new Map();
    [...(Array.isArray(allCourses) ? allCourses : []), ...(Array.isArray(enrolledCourses) ? enrolledCourses : [])].forEach((course) => {
      if (course?._id) lookup.set(course._id, course);
    });
    return lookup;
  }, [allCourses, enrolledCourses]);

  const bookmarkedCourses = useMemo(() => bookmarks.map((bookmark) => {
    const bookmarkCourseId = getCourseId(bookmark.course);
    const matchedCourse = courseLookup.get(bookmarkCourseId) || (typeof bookmark.course === 'object' ? bookmark.course : null) || {};

    return {
      ...bookmark,
      courseId: bookmarkCourseId,
      course: matchedCourse,
      title: matchedCourse.courseTitle || bookmark.courseTitle || bookmark.lessonTitle || 'Untitled Course',
      thumbnail: matchedCourse.courseThumbnail || matchedCourse.thumbnail || '',
      instructor: getInstructorName(matchedCourse),
      category: getCategoryName(matchedCourse),
    };
  }), [bookmarks, courseLookup]);

  const filteredBookmarks = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return bookmarkedCourses;

    return bookmarkedCourses.filter((bookmark) => [
      bookmark.title,
      bookmark.instructor,
      bookmark.category,
      bookmark.lessonTitle,
      bookmark.positionLabel,
      bookmark.note,
    ].filter(Boolean).join(' ').toLowerCase().includes(searchTerm));
  }, [bookmarkedCourses, query]);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();

      if (!token) {
        setBookmarks([]);
        setError('Please sign in to view your bookmarks.');
        return;
      }

      const { data } = await axios.get(`${backendURL}/api/study-library/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setBookmarks(Array.isArray(data.bookmarks) ? data.bookmarks : []);
      } else {
        setError(data.message || 'Failed to load bookmarks.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  }, [backendURL, getToken]);

  const fetchProgress = useCallback(async () => {
    const coursesToCheck = bookmarkedCourses.filter((bookmark) => bookmark.courseId);
    if (!coursesToCheck.length) return;

    try {
      setProgressLoading(true);
      const token = await getToken();
      if (!token) return;

      const progressDataMap = {};

      await Promise.all(coursesToCheck.map(async (bookmark) => {
        try {
          const { data } = await axios.post(
            `${backendURL}/api/user/get-course-progress`,
            { courseId: bookmark.courseId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const totalLectures = data.success && data.progressData?.totalLessons
            ? data.progressData.totalLessons
            : calculateNoOfLectures(bookmark.course) || 0;
          const lectureCompleted = data.success && data.progressData
            ? (data.progressData.completedCount ?? data.progressData.completedLessons?.length ?? data.progressData.completedLectures?.length ?? 0)
            : 0;

          progressDataMap[bookmark.courseId] = { totalLectures, lectureCompleted };
        } catch {
          progressDataMap[bookmark.courseId] = {
            totalLectures: calculateNoOfLectures(bookmark.course) || 0,
            lectureCompleted: 0,
          };
        }
      }));

      setCourseProgress(progressDataMap);
    } finally {
      setProgressLoading(false);
    }
  }, [backendURL, bookmarkedCourses, calculateNoOfLectures, getToken]);

  const handleRemoveBookmark = async (bookmarkId) => {
    try {
      setRemovingId(bookmarkId);
      const token = await getToken();
      await axios.delete(`${backendURL}/api/study-library/bookmarks/${bookmarkId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookmarks((prev) => prev.filter((bookmark) => bookmark._id !== bookmarkId));
      toast.success('Bookmark removed');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove bookmark');
    } finally {
      setRemovingId('');
    }
  };

  useEffect(() => {
    if (userData) fetchUserEnrolledCourses();
  }, [fetchUserEnrolledCourses, userData]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  useEffect(() => {
    if (!loading) fetchProgress();
  }, [fetchProgress, loading]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-4">
              <Bookmark size={16} />
              Saved learning
            </div>
            <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">My Bookmarks</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Pick up right where you left off with your saved courses and lessons.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search bookmarks..."
                className="w-full sm:w-72 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <button
              onClick={fetchBookmarks}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        <div className="grid gap-6 mb-10 md:grid-cols-3">
          {[
            { label: 'Saved Courses', value: bookmarkedCourses.length, icon: Bookmark, color: 'text-blue-600' },
            { label: 'Categories', value: new Set(bookmarkedCourses.map((bookmark) => bookmark.category)).size, icon: Layers, color: 'text-violet-600' },
            { label: 'Ready to Resume', value: bookmarkedCourses.filter((bookmark) => bookmark.courseId).length, icon: BookOpen, color: 'text-emerald-600' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <Icon size={20} className={stat.color} />
                </div>
                <p className={`mt-2 text-3xl font-bold font-space-grotesk ${stat.color} dark:text-white`}>{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-4">
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-8 text-center">
            <BookmarkX className="mx-auto text-rose-500" size={44} />
            <h2 className="mt-4 text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Could not load bookmarks</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button onClick={fetchBookmarks} className="mt-6 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 transition-all">
              Try Again
            </button>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 p-10 sm:p-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
              <Bookmark size={38} />
            </div>
            <h2 className="mt-6 text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white">
              {query ? 'No matching bookmarks found' : 'Your bookmark shelf is empty'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
              {query
                ? 'Try searching by course, instructor, lesson, or category.'
                : 'Save important courses or lessons while learning, and they will appear here as quick resume cards.'}
            </p>
            <button
              onClick={() => navigate('/course-list')}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/25"
            >
              <BookOpen size={16} />
              Explore Courses
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBookmarks.map((bookmark, index) => {
              const stats = courseProgress[bookmark.courseId] || { lectureCompleted: 0, totalLectures: calculateNoOfLectures(bookmark.course) || 0 };
              const total = stats.totalLectures || 1;
              const percentage = Math.min(Math.round((stats.lectureCompleted / total) * 100), 100);

              return (
                <motion.article
                  key={bookmark._id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl"
                >
                  <button
                    onClick={() => bookmark.courseId && navigate(`/course/${bookmark.courseId}`)}
                    className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-100 to-slate-100 dark:from-blue-950 dark:via-indigo-950 dark:to-slate-900 text-left"
                  >
                    {bookmark.thumbnail ? (
                      <img src={bookmark.thumbnail} alt={bookmark.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-blue-500 dark:text-blue-300">
                        <BookOpen size={44} />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 dark:bg-slate-950/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur">
                      {bookmark.category}
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="line-clamp-2 text-base font-bold font-space-grotesk text-slate-900 dark:text-white">{bookmark.title}</h2>
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <UserRound size={14} />
                      <span className="truncate">{bookmark.instructor}</span>
                    </div>

                    {bookmark.lessonTitle && (
                      <div className="mt-4 rounded-xl bg-slate-50 dark:bg-white/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved lesson</p>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{bookmark.lessonTitle}</p>
                        {bookmark.positionLabel && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{bookmark.positionLabel}</p>}
                      </div>
                    )}

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Progress</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{progressLoading ? '...' : `${percentage}%`}</span>
                      </div>
                      <Line strokeWidth={4} percent={percentage} strokeColor={percentage >= 100 ? '#10b981' : '#2563eb'} trailColor="#e2e8f0" strokeLinecap="round" className="h-1.5" />
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
                      <button
                        onClick={() => bookmark.courseId && navigate(`/player/${bookmark.courseId}`)}
                        disabled={!bookmark.courseId}
                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => handleRemoveBookmark(bookmark._id)}
                        disabled={removingId === bookmark._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-all hover:bg-rose-100 dark:hover:bg-rose-950/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {removingId === bookmark._id ? 'Removing' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Bookmarks;