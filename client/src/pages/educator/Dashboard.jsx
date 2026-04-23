import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Loading from '../../components/students/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { currency, backendURL, getToken, isEducator } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendURL}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setDashboardData(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }

  useEffect(() => {
    if (isEducator) fetchDashboardData();
  }, [isEducator]);

  if (!dashboardData) return <Loading />;

  return (
    <div className='min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30'>
      
      <div className='flex flex-wrap gap-5 items-center'>
        
        {/* Total Earnings Card */}
        <div className='flex items-center gap-4 p-6 bg-white border border-gray-500/20 rounded-md shadow-sm min-w-[220px] flex-1'>
          <img src={assets.earning_icon} alt="" className='w-12' />
          <div>
            <p className='text-2xl font-bold text-gray-800'>
              {currency}{Number(dashboardData.totalEarnings || 0).toLocaleString()}
            </p>
            <p className='text-sm text-gray-500 font-medium'>Total Earnings</p>
          </div>
        </div>

        {/* Total Courses Card */}
        <div className='flex items-center gap-4 p-6 bg-white border border-gray-500/20 rounded-md shadow-sm min-w-[220px] flex-1'>
          <img src={assets.appointments_icon} alt="" className='w-12' />
          <div>
            <p className='text-2xl font-bold text-gray-800'>{dashboardData.totalCourses || 0}</p>
            <p className='text-sm text-gray-500 font-medium'>Total Courses</p>
          </div>
        </div>

        {/* Total Students Card */}
        <div className='flex items-center gap-4 p-6 bg-white border border-gray-500/20 rounded-md shadow-sm min-w-[220px] flex-1'>
          <img src={assets.patients_icon} alt="" className='w-12' />
          <div>
            <p className='text-2xl font-bold text-gray-800'>{dashboardData.totalEnrolledStudents || 0}</p>
            <p className='text-sm text-gray-500 font-medium'>Total Students</p>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium text-gray-800'>Latest Enrollments</h2>
        <div className='max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 shadow-sm'>
          <table className='table-auto w-full text-left'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm bg-gray-50'>
              <tr>
                <th className='px-4 py-3 font-semibold'>#</th>
                <th className='px-4 py-3 font-semibold'>Student Name</th>
                <th className='px-4 py-3 font-semibold'>Course Title</th>
              </tr>
            </thead>
            <tbody className='text-sm text-gray-600'>
              {dashboardData.enrolledStudents?.length > 0 ? (
                dashboardData.enrolledStudents.slice(0, 5).map((item, index) => (
                  <tr key={index} className='border-b border-gray-500/20 hover:bg-gray-50 transition-colors'>
                    <td className='px-4 py-3'>{index + 1}</td>
                    <td className='px-4 py-3 flex items-center gap-3'>
                      <img src={item.student?.imageUrl || assets.profile_img} className='w-9 h-9 rounded-full object-cover' alt="" />
                      <span className='font-medium text-gray-800'>{item.student?.name || "Test Student"}</span>
                    </td>
                    <td className='px-4 py-3 text-gray-600'>{item.courseTitle}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="text-center py-12 text-gray-400 italic">No recent test enrollments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;