import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import Loading from "../../components/students/Loading";

const Dashboard = () => {
  // ✅ FIXED: proper const + isEducator from context
  const { currency, backendURL, getToken, isEducator } =
    useContext(AppContext);

  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(
        `${backendURL}/api/educator/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        // ✅ backend sends data inside `data`
        setDashboardData(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backendURL, getToken]);

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData();
    }
  }, [isEducator, fetchDashboardData]);

  if (!dashboardData) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex flex-col gap-8 p-4 md:p-8">
      {/* Stats Cards */}
      <div className="flex flex-wrap gap-5 items-center">
        <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white">
          <img src={assets.patients_icon} alt="students" />
          <div>
            <p className="text-2xl font-medium text-gray-600">
              {dashboardData.totalEnrolledStudents}
            </p>
            <p className="text-base text-gray-500">Total Enrolments</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white">
          <img src={assets.appointments_icon} alt="courses" />
          <div>
            <p className="text-2xl font-medium text-gray-600">
              {dashboardData.totalCourses}
            </p>
            <p className="text-base text-gray-500">Total Courses</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white">
          <img src={assets.earning_icon} alt="earning" />
          <div>
            <p className="text-2xl font-medium text-gray-600">
              {currency}
              {dashboardData.totalEarning}
            </p>
            <p className="text-base text-gray-500">Total Earnings</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium">Latest Enrolments</h2>

        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="table-auto w-full text-left">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Course Title</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {dashboardData.enrolledStudents.map((item, index) => (
                <tr key={index} className="border-b border-gray-500/20">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <img
                      src={item.student.imageUrl}
                      alt="profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{item.student.name}</span>
                  </td>
                  <td className="px-4 py-3">{item.courseTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
