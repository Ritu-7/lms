import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Loading from '../../components/students/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { currency, backendURL, getToken, isEducator } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = useCallback(async () => {
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
  }, [backendURL, getToken]);

  useEffect(() => {
    if (isEducator) fetchDashboardData();
  }, [isEducator, fetchDashboardData]);

  if (!dashboardData) return <Loading />;

  const stats = [
    { label: 'Total Earnings', value: `${currency}${Number(dashboardData.totalEarnings || 0).toLocaleString()}`, icon: assets.earning_icon, color: 'text-blue-600' },
    { label: 'Total Courses', value: dashboardData.totalCourses || 0, icon: assets.appointments_icon, color: 'text-indigo-600' },
    { label: 'Total Students', value: dashboardData.totalEnrolledStudents || 0, icon: assets.patients_icon, color: 'text-cyan-600' },
    { label: 'Assignments', value: dashboardData.totalAssignments || 0, icon: assets.file_upload_icon, color: 'text-violet-600' },
    { label: 'Quizzes', value: dashboardData.totalQuizzes || 0, icon: assets.lesson_icon, color: 'text-emerald-600' },
  ];

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-8'>
      
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6'>
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className='bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4'
          >
            <img src={stat.icon} alt={stat.label} className='w-12 h-12' />
            <div>
              <p className={`text-2xl font-bold font-space-grotesk ${stat.color} dark:text-white`}>{stat.value}</p>
              <p className='text-sm text-slate-500 dark:text-slate-400 font-medium'>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[
          { label: 'Submissions', value: dashboardData.assignmentSubmissionCount || 0 },
          { label: 'Graded', value: dashboardData.assignmentGradedCount || 0 },
          { label: 'Upcoming Deadlines', value: dashboardData.upcomingAssignments || 0 },
          { label: 'Quiz Attempts', value: dashboardData.quizAttemptCount || 0 },
          { label: 'Quiz Passes', value: dashboardData.quizPassCount || 0 },
        ].map((item, idx) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className='bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm'
          >
            <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>{item.label}</p>
            <p className='mt-2 text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white'>{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className='bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden'>
        <div className='p-6 border-b border-slate-200 dark:border-white/10'>
          <h2 className='text-xl font-bold font-space-grotesk text-slate-900 dark:text-white'>Latest Enrollments</h2>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm'>
            <thead className='text-slate-500 bg-slate-50 dark:bg-slate-800/50'>
              <tr>
                <th className='px-6 py-4 font-semibold'>#</th>
                <th className='px-6 py-4 font-semibold'>Student Name</th>
                <th className='px-6 py-4 font-semibold'>Course Title</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
              {(dashboardData.enrolledStudentsData || dashboardData.enrolledStudents)?.length > 0 ? (
                (dashboardData.enrolledStudentsData || dashboardData.enrolledStudents).slice(0, 5).map((item, index) => {
                  const studentInfo = item.student || item.user;
                  const displayName = studentInfo?.name || 
                                     (studentInfo?.email ? studentInfo.email.split('@')[0] : "Student");

                  return (
                    <tr key={index} className='hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'>
                      <td className='px-6 py-4 text-slate-500'>{index + 1}</td>
                      <td className='px-6 py-4 flex items-center gap-3'>
                        <img 
                          src={studentInfo?.imageUrl || studentInfo?.image || assets.profile_img} 
                          className='w-10 h-10 rounded-full object-cover bg-slate-100' 
                          alt="" 
                          onError={(e) => { e.target.src = assets.profile_img }}
                        />
                        <span className='font-semibold text-slate-900 dark:text-slate-200 capitalize'>{displayName}</span>
                      </td>
                      <td className='px-6 py-4 text-slate-600 dark:text-slate-400'>{item.courseTitle || "Untitled Course"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-16 text-slate-400 italic">
                    No recent enrollments found.
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

export default Dashboard;
