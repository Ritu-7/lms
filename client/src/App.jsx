import React, { useEffect, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import { AppContext } from './context/AppContext'

// Student pages
import Home from './pages/students/Home.jsx'
import CourseDetail from './pages/students/CourseDetail.jsx'
import CourseList from './pages/students/CourseList.jsx'
import MyEnrollments from './pages/students/MyEnrollments.jsx'
import StudentQuizzes from './pages/students/Quizzes.jsx'
import QuizPlayer from './pages/students/QuizPlayer.jsx'
import StudentAssignments from './pages/students/Assignments.jsx'
import VerifyCertificate from './pages/students/VerifyCertificate.jsx'
import Player from './pages/students/Player.jsx'
import Loading from './components/students/Loading.jsx'
import AITutor from './pages/students/AITutor.jsx'
import PDFSummary from './pages/students/PDFSummary.jsx'
import VideoSummary from './pages/students/VideoSummary.jsx'
import NotesGenerator from './pages/students/NotesGenerator.jsx'
import CreditDashboard from './pages/students/CreditDashboard.jsx'
import AIUsageAnalytics from './pages/students/AIUsageAnalytics.jsx'
import AICodingAssistant from './pages/students/AICodingAssistant.jsx'

// Educator pages
import Educator from './pages/educator/Educator.jsx'
import Dashboard from './pages/educator/Dashboard.jsx'
import AddCourse from './pages/educator/AddCourse.jsx'
import StudentEnrolled from './pages/educator/StudentsEnrolled.jsx'
import MyCourses from './pages/educator/MyCourses.jsx'
import EditCourse from "./pages/educator/EditCourse";
import EducatorAssignments from './pages/educator/Assignments.jsx'
import EducatorQuizzes from './pages/educator/Quizzes.jsx'
import Login from './pages/Login.tsx'
import AdminLayout from './pages/admin/AdminLayout.tsx'
import AdminDashboard from './pages/admin/Dashboard.tsx'
import AdminStudents from './pages/admin/Students.tsx'
import AdminEducators from './pages/admin/Educators.tsx'
import AdminCourses from './pages/admin/Courses.tsx'
import AdminCategories from './pages/admin/Categories.tsx'
import AdminEnrollments from './pages/admin/Enrollments.tsx'
import AdminAssignments from './pages/admin/Assignments.tsx'
import AdminCertificates from './pages/admin/Certificates.tsx'
import AdminAnnouncements from './pages/admin/Announcements.tsx'
import AdminPayments from './pages/admin/Payments.tsx'
import AdminReports from './pages/admin/Reports.tsx'
import AdminAnalytics from './pages/admin/Analytics.tsx'
import AdminSettings from './pages/admin/Settings.tsx'
import RoleRoute from './components/auth/RoleRoute.tsx'

// Notification pages
import StudentNotifications from './pages/students/Notifications.jsx'
import EducatorNotifications from './pages/educator/Notifications.jsx'
import AdminNotifications from './pages/admin/Notifications.tsx'

// Navbar
import Navbar from './components/navbar/GlobalNavbar.jsx'

// Styles & Toast
import 'quill/dist/quill.snow.css'
import { ToastContainer } from 'react-toastify'

const App = () => {
  const { user } = useUser();
  const { backendURL, getToken } = useContext(AppContext);

  // --- SYNC USER DATA WITH MONGODB ---
  useEffect(() => {
    const syncUserWithDB = async () => {
      if (user && backendURL) {
        try {
          const userData = {
            clerkUserId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || `${user.firstName} ${user.lastName}`,
            imageUrl: user.imageUrl
          };

          // Sends data to your backend to create/update the user record
          const token = await getToken();
          await axios.post(`${backendURL}/api/user/sync`, userData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error("Error syncing user with MongoDB:", error.message);
        }
      }
    };

    syncUserWithDB();
  }, [user, backendURL, getToken]);

  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* --- STUDENT ROUTES --- */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/course-list" element={<><Navbar /><CourseList /></>} />
        <Route path="/course-list/:input" element={<><Navbar /><CourseList /></>} />
        <Route path="/course/:id" element={<><Navbar /><CourseDetail /></>} />
        <Route path="/my-enrollments" element={<><Navbar /><MyEnrollments /></>} />
        <Route path="/quizzes" element={<><Navbar /><StudentQuizzes /></>} />
        <Route path="/assignments" element={<><Navbar /><StudentAssignments /></>} />
        <Route path="/certificate/verify/:verificationCode" element={<><Navbar /><VerifyCertificate /></>} />
        <Route path="/player/:courseId" element={<><Navbar /><Player /></>} />
        <Route path="/quiz/:quizId" element={<><Navbar /><QuizPlayer /></>} />
        <Route path="/loading/:path" element={<><Navbar /><Loading /></>} />
        <Route path="/notifications" element={<><Navbar /><StudentNotifications /></>} />
        <Route path="/ai-tutor" element={<><Navbar /><AITutor /></>} />
        <Route path="/pdf-summary" element={<><Navbar /><PDFSummary /></>} />
        <Route path="/video-summary" element={<><Navbar /><VideoSummary /></>} />
        <Route path="/notes-generator" element={<><Navbar /><NotesGenerator /></>} />
        <Route path="/credits" element={<><Navbar /><CreditDashboard /></>} />
        <Route path="/ai-analytics" element={<><Navbar /><AIUsageAnalytics /></>} />
        <Route path="/ai-coding-assistant" element={<><Navbar /><AICodingAssistant /></>} />

        {/* --- EDUCATOR ROUTES --- */}
        <Route path="/educator" element={<RoleRoute roles={['educator', 'admin']}><Educator /></RoleRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentEnrolled />} />
          <Route path="assignments" element={<EducatorAssignments />} />
          <Route path="quizzes" element={<EducatorQuizzes />} />
          <Route path="notifications" element={<EducatorNotifications />} />
        </Route>
        <Route path="/educator/edit-course/:courseId" element={<RoleRoute roles={['educator', 'admin']}><EditCourse /></RoleRoute>} />

        {/* --- ADMIN ROUTES --- */}
        <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminLayout /></RoleRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="educators" element={<AdminEducators />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="certificates" element={<AdminCertificates />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
