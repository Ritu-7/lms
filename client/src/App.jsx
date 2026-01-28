import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Student pages
import Home from './pages/students/Home.jsx'
import CourseDetail from './pages/students/CourseDetail.jsx'
import CourseList from './pages/students/CourseList.jsx'
import MyEnrollments from './pages/students/MyEnrollments.jsx'
import Player from './pages/students/Player.jsx'
import Loading from './components/students/Loading.jsx'

// Educator pages
import Educator from './pages/educator/Educator.jsx'
import Dashboard from './pages/educator/Dashboard.jsx'
import AddCourse from './pages/educator/AddCourse.jsx'
import StudentEnrolled from './pages/educator/StudentsEnrolled.jsx'
import MyCourses from './pages/educator/MyCourses.jsx'
import EditCourse from "./pages/educator/EditCourse";


// Navbar
import Navbar from './components/students/SNavbar.jsx'

// Styles & Toast
import 'quill/dist/quill.snow.css'
import { ToastContainer } from 'react-toastify'


const App = () => {
  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer position="top-center" />
      <Routes>
        {/* --- STUDENT ROUTES --- 
          The Navbar is included only in these specific routes. 
        */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/course-list" element={<><Navbar /><CourseList /></>} />
        <Route path="/course-list/:input" element={<><Navbar /><CourseList /></>} />
        <Route path="/course/:id" element={<><Navbar /><CourseDetail /></>} />
        <Route path="/my-enrollments" element={<><Navbar /><MyEnrollments /></>} />
        <Route path="/player/:courseId" element={<><Navbar /><Player /></>} />
        <Route path="/loading/:path" element={<><Navbar /><Loading /></>} />

        {/* --- EDUCATOR ROUTES --- 
          This group uses the 'Educator.jsx' layout. 
          The student Navbar is NOT here, so it will not be rendered.
        */}
        <Route path="/educator" element={<Educator />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentEnrolled />} />
        </Route>
        <Route
  path="/educator/edit-course/:courseId"
  element={<EditCourse />}
/>

      </Routes>
    </div>
  )
}

export default App