import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/students/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MyCourses = () => {
  const { currency, backendURL, isEducator, getToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

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
      toast.error(error.message);
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
      toast.error(error.message);
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
        toast.error(error.message);
      }
    }
  };

  return courses ? (
    <div className='h-screen flex flex-col items-start justify-between md:p-8 p-4 pt-8'>
      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>

        <div className='max-w-4xl w-full bg-white border rounded-md'>
          <table className='w-full text-sm'>
            <thead className='border-b'>
              <tr>
                <th className='px-4 py-3 text-left'>Course</th>
                <th className='px-4 py-3 text-left'>Earnings</th>
                <th className='px-4 py-3 text-left'>Students</th>
                <th className='px-4 py-3 text-left'>Status</th>
                <th className='px-4 py-3 text-left'>Action</th>
              </tr>
            </thead>

            <tbody>
              {courses.map(course => (
                <tr key={course._id} className='border-b'>
                  <td className='px-4 py-3 flex gap-3 items-center'>
                    <img
                      src={course.courseThumbnail}
                      className='w-16 rounded'
                      alt=''
                    />
                    <span className='hidden md:block truncate'>
                      {course.courseTitle}
                    </span>

                    <div className='flex gap-2'>
                      <button
                        onClick={() =>
                          navigate(`/educator/edit-course/${course._id}`)
                        }
                        className='px-3 py-1 bg-blue-600 text-white rounded text-xs'
                      >
                        Edit Course
                      </button>
                      <button
                        onClick={() => deleteCourse(course._id)}
                        className='px-3 py-1 bg-red-600 text-white rounded text-xs'
                      >
                        Delete Course
                      </button>
                    </div>
                  </td>

                  <td className='px-4 py-3'>
                    {currency}
                    {Math.floor(
                      (course.enrolledStudents?.length || 0) *
                        (course.coursePrice -
                          (course.discount * course.coursePrice) / 100)
                    )}
                  </td>

                  <td className='px-4 py-3'>
                    {course.enrolledStudents?.length || 0}
                  </td>

                  <td className='px-4 py-3'>
                    {course.isPublished ? (
                      <span className='text-green-600'>Published</span>
                    ) : (
                      <span className='text-red-500'>Unpublished</span>
                    )}
                  </td>

                  <td className='px-4 py-3'>
                    <button
                      onClick={() => togglePublish(course._id)}
                      className={`px-3 py-1 rounded text-white text-xs ${
                        course.isPublished
                          ? 'bg-red-500'
                          : 'bg-green-600'
                      }`}
                    >
                      {course.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MyCourses;
