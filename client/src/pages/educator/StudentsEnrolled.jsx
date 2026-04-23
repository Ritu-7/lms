import React, { useEffect, useContext, useState, useCallback } from 'react';
import { AppContext } from "../../context/AppContext";
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';
import Loading from '../../components/students/Loading';

const StudentsEnrolled = () => {
  const { backendURL, getToken, isEducator } = useContext(AppContext);
  const [enrolledStudents, setEnrolledStudents] = useState(null);

  const fetchEnrolledStudents = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/educator/enrolled-students`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (data.success) {
        // Reverse to show newest enrollments first
        setEnrolledStudents(Array.isArray(data.enrolledStudentsData) ? data.enrolledStudentsData.reverse() : []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    if (isEducator) fetchEnrolledStudents();
  }, [isEducator, fetchEnrolledStudents]);

  if (!enrolledStudents) return <Loading />;

  return (
    <div className='min-h-screen flex flex-col items-start md:p-8 p-4 pt-8 bg-gray-50/30'>
      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium text-gray-800'>Enrolled Students</h2>
        <div className='max-w-4xl w-full bg-white border border-gray-500/20 rounded-md overflow-hidden shadow-sm'>
          <table className='table-auto w-full text-left'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm bg-gray-50'>
              <tr>
                <th className='px-4 py-3 font-semibold hidden sm:table-cell'>#</th>
                <th className='px-4 py-3 font-semibold'>Student Name</th>
                <th className='px-4 py-3 font-semibold'>Course Title</th>
                <th className='px-4 py-3 font-semibold hidden md:table-cell'>Date</th>
              </tr>
            </thead>
            <tbody className='text-sm text-gray-600'>
              {enrolledStudents.length > 0 ? (
                enrolledStudents.map((item, index) => {
                  
                  // ✅ FIX: Logic to handle cases where 'name' is empty
                  // If name exists, use it. Otherwise, use email prefix. Otherwise, "Student".
                  const studentInfo = item.student || item.user; // Safety check for both keys
                  const displayName = studentInfo?.name || 
                                     (studentInfo?.email ? studentInfo.email.split('@')[0] : "Student");

                  return (
                    <tr key={index} className='border-b border-gray-500/20 hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3 text-center hidden sm:table-cell text-gray-400'>
                        {index + 1}
                      </td>
                      <td className='px-4 py-3 flex items-center space-x-3'>
                        {/* ✅ FIX: Multi-field image check + Error fallback */}
                        <img 
                          src={studentInfo?.imageUrl || studentInfo?.image || assets.profile_img} 
                          alt="" 
                          className='w-9 h-9 rounded-full bg-gray-100 object-cover border border-gray-100 shadow-sm' 
                          onError={(e) => { e.target.src = assets.profile_img }}
                        />
                        <span className='truncate font-semibold text-gray-800 capitalize'>
                          {displayName}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-gray-600 font-medium'>
                        {item.courseTitle || "Untitled Course"}
                      </td>
                      <td className='px-4 py-3 hidden md:table-cell text-gray-500'>
                        {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-400 italic">
                    No students enrolled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentsEnrolled;