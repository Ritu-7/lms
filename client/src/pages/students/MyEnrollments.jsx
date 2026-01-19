import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Line } from 'rc-progress';
import Footer from '../../components/students/Footer';

const MyEnrollments = () => {
  const navigate = useNavigate();
  const { enrolledCourses, calculateCourseDuration,userData,fetchUserEnrolledCourses,backendUrl,getToken,calculateNoOflectures} = useContext(AppContext);

  const [progressArray] = useState([

  ]);

  const getCourseProgress = async()=>{
    try{
      const token = await getToken();
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async(course)=>{
          const{data}=await axios.post(`${backendURL}/api/user/get-course-progress`{
            courseId:course._id},{headers:{
              Authorization:`Bearer ${token}`
            }}
          })
          let totalLectures = calculateNoOflectures(course);
          const lectureCompleted = data.progressData?data.progressData.lectureCompleted.length:0;
          return {totalLectures,lectureCompleted}
        })
        setProgressarray(tempProgressArray);
      )catch(error){
        toast.error(error.message);
      }
    }
  }

  useEffect(()=>{
    if(userData){
      fetchUserEnrolledCourses()
    }
  },[userData])

  useEffect(()=>{
    if(enrolledCourses.length>0){
      getCourseProgress()
    }
  },[enrolledCourses])
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-grow md:px-24 lg:px-36 px-4 pt-10">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Enrollments</h1>
          <p className="text-gray-500 mt-2">Manage your learning journey and track your progress.</p>
        </header>

        <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            {/* TABLE HEAD - Clean and professional */}
            <thead className="bg-gray-50 border-b border-gray-200 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Course</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {enrolledCourses.map((course, index) => {
                const stats = progressArray[index] || { lectureCompleted: 0, totalLectures: 1 };
                const percentage = Math.round((stats.lectureCompleted / stats.totalLectures) * 100);
                const isFinished = percentage === 100;

                return (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                    {/* COURSE INFO */}
                    <td className="px-4 md:px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img
                          src={course.courseThumbnail}
                          alt="course"
                          className="w-20 h-12 md:w-28 md:h-16 object-cover rounded-lg shadow-sm"
                        />
                        <div className="min-w-0">
                          <h2 className="text-sm md:text-base font-semibold text-gray-800 truncate">
                            {course.courseTitle}
                          </h2>
                          {/* Mobile-only lecture count */}
                          <p className="md:hidden text-xs text-gray-500 mt-1">
                            {stats.lectureCompleted}/{stats.totalLectures} Lectures
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* DURATION */}
                    <td className="px-6 py-5 text-sm text-gray-600 hidden md:table-cell">
                      {calculateCourseDuration(course)}
                    </td>

                    {/* PROGRESS - This shows the lecture count clearly on desktop */}
                    <td className="px-6 py-5 hidden md:table-cell">
                      <div className="flex flex-col w-40 lg:w-52">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-700">{percentage}%</span>
                          <span className="text-[11px] font-medium text-gray-400">
                            {stats.lectureCompleted} / {stats.totalLectures} Lectures
                          </span>
                        </div>
                        <Line
                          strokeWidth={3}
                          percent={percentage}
                          strokeColor={isFinished ? "#16a34a" : "#2563eb"}
                          trailColor="#e5e7eb"
                          strokeLinecap="round"
                          className="h-1.5"
                        />
                      </div>
                    </td>

                    {/* ACTION BUTTON */}
                    <td className="px-4 md:px-6 py-5 text-right">
                      <button
                        onClick={() => navigate(`/player/${course._id}`)}
                        className={`inline-flex items-center justify-center px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                          isFinished
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100 hover:-translate-y-0.5'
                        }`}
                      >
                        {isFinished ? 'Completed' : 'On Going'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-auto pt-20">
        <Footer />
      </div>
    </div>
  );
};

export default MyEnrollments;