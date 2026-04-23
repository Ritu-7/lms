import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/students/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MyCourses = () => {
  const { currency, backendURL, isEducator, getToken } = useContext(AppContext);
  const navigate = useNavigate();
  
  // ✅ FIX 1: Initializing as null ensures Loading component shows correctly
  const [courses, setCourses] = useState(null);

  const fetchEducatorCourses = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendURL}/api/educator/courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses();
    }
  }, [isEducator, fetchEducatorCourses]);

  const togglePublish = async (courseId) => {
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        `${backendURL}/api/educator/publish-course/${courseId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        fetchEducatorCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const deleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        const token = await getToken();
        const { data } = await axios.delete(
          `${backendURL}/api/educator/delete-course/${courseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success(data.message);
          fetchEducatorCourses();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
      }
    }
  };

  if (!courses) return <Loading />;

  return (
    <div className='min-h-screen flex flex-col items-start md:p-8 p-4 pt-8 bg-gray-50/30'>
      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>

        <div className='max-w-5xl w-full bg-white border rounded-md overflow-hidden shadow-sm'>
          <table className='w-full text-sm text-left'>
            <thead className='border-b bg-gray-50 text-gray-900'>
              <tr>
                <th className='px-4 py-3 font-semibold'>Course</th>
                <th className='px-4 py-3 font-semibold'>Earnings</th>
                <th className='px-4 py-3 font-semibold'>Students</th>
                <th className='px-4 py-3 font-semibold'>Status</th>
                <th className='px-4 py-3 font-semibold text-center'>Action</th>
              </tr>
            </thead>

            <tbody className='text-gray-600'>
              {courses.length > 0 ? (
                courses.map(course => {
                  // ✅ FIX 2: Check both naming conventions (enrolledStudents vs studentsEnrolled)
                  const studentCount = course.enrolledStudents?.length || course.studentsEnrolled?.length || 0;
                  
                  return (
                    <tr key={course._id} className='border-b hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3 flex gap-3 items-center'>
                        <img
                          src={course.courseThumbnail || null}
                          className='w-16 h-10 object-cover rounded bg-gray-100'
                          alt='course'
                        />
                        <div className='flex flex-col'>
                          <span className='font-medium text-gray-800 line-clamp-1'>
                            {course.courseTitle}
                          </span>
                          <div className='flex gap-2 mt-1'>
                            <button
                              onClick={() => navigate(`/educator/edit-course/${course._id}`)}
                              className='text-blue-600 hover:underline text-[10px] font-bold'
                            >
                              Edit
                            </button>
                            <span className='text-gray-300 text-[10px]'>|</span>
                            <button
                              onClick={() => deleteCourse(course._id)}
                              className='text-red-500 hover:underline text-[10px] font-bold'
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className='px-4 py-3'>
                        {currency}
                        {Math.floor(
                          studentCount * (course.coursePrice - (course.discount * course.coursePrice) / 100)
                        )}
                      </td>

                      <td className='px-4 py-3 font-medium text-gray-800'>
                        {/* ✅ Displaying the corrected student count */}
                        {studentCount}
                      </td>

                      <td className='px-4 py-3'>
                        {course.isPublished ? (
                          <span className='text-green-600 font-medium'>Published</span>
                        ) : (
                          <span className='text-red-500 font-medium'>Unpublished</span>
                        )}
                      </td>

                      <td className='px-4 py-3 text-center'>
                        <button
                          onClick={() => togglePublish(course._id)}
                          className={`px-3 py-1 rounded text-white text-xs font-medium transition-all ${
                            course.isPublished
                              ? 'bg-orange-500 hover:bg-orange-600'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {course.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400">
                    No courses found. Start by adding your first course!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;