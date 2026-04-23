import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Line } from 'rc-progress';
import Footer from '../../components/students/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';

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
            
            const totalLectures = calculateNoOfLectures(course) || 0;
            const lectureCompleted = data.success && data.progressData 
              ? data.progressData.completedLectures.length 
              : 0;
            
            progressDataMap[course._id] = { totalLectures, lectureCompleted };
          } catch (err) {
            progressDataMap[course._id] = { totalLectures: calculateNoOfLectures(course), lectureCompleted: 0 };
          }
        })
      );
      
      setCourseProgress(progressDataMap);
    } catch (error) {
      toast.error("Failed to load course progress");
    }
  }, [backendURL, getToken, enrolledCourses, calculateNoOfLectures]);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      {/* Content Wrapper */}
      <div className="flex-grow md:px-24 lg:px-36 px-4 pt-10 pb-12">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Enrollments</h1>
          <p className="text-gray-500 mt-2">Track your learning progress and certificates.</p>
        </header>

        <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200 hidden md:table-header-group">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course) => {
                    const stats = courseProgress[course._id] || { lectureCompleted: 0, totalLectures: 0 };
                    const total = stats.totalLectures || 1;
                    const percentage = Math.min(Math.round((stats.lectureCompleted / total) * 100), 100);
                    const isFinished = percentage === 100;

                    return (
                      <tr key={course._id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Course Column */}
                        <td className="px-4 md:px-6 py-5">
                          <div className="flex items-center gap-4">
                            <img
                              src={course.courseThumbnail}
                              alt="thumb"
                              className="w-16 h-10 md:w-24 md:h-14 object-cover rounded-lg border border-gray-100"
                            />
                            <div className="min-w-0">
                              <h2 className="text-sm md:text-base font-semibold text-gray-800 truncate">
                                {course.courseTitle}
                              </h2>
                              <p className="md:hidden text-[11px] text-gray-500 mt-1">
                                {stats.lectureCompleted}/{stats.totalLectures} Lessons
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Duration Column */}
                        <td className='px-6 py-5 hidden md:table-cell'>
                          <span className='text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap'>
                            {calculateCourseDuration(course)}
                          </span>
                        </td>

                        {/* Progress Column */}
                        <td className="px-6 py-5 hidden md:table-cell">
                          <div className="flex flex-col w-40 lg:w-52">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-xs font-bold ${isFinished ? 'text-green-600' : 'text-blue-600'}`}>
                                {percentage}%
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {stats.lectureCompleted} / {stats.totalLectures}
                              </span>
                            </div>
                            <Line
                              strokeWidth={3}
                              percent={percentage}
                              strokeColor={isFinished ? "#10b981" : "#2563eb"}
                              trailColor="#f3f4f6"
                              strokeLinecap="round"
                              className="h-1.5"
                            />
                          </div>
                        </td>

                        {/* Action Column */}
                        <td className="px-4 md:px-6 py-5 text-right">
                          <button
                            onClick={() => navigate(`/player/${course._id}`)}
                            className={`px-4 py-2 md:px-6 rounded-lg text-xs md:text-sm font-bold transition-all ${
                              isFinished
                                ? 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
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
                    <td colSpan="4" className="py-24 text-center">
                      <p className="text-gray-500">No enrollments found.</p>
                      <button 
                        onClick={() => navigate('/course-list')}
                        className="mt-4 text-blue-600 font-bold hover:underline"
                      >
                        Browse Courses
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Screen Footer */}
      <Footer />
    </div>
  );
};

export default MyEnrollments;