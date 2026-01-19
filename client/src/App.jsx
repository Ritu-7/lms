// import React from 'react'
// import { Routes, Route } from 'react-router-dom'

// // Student pages
// import Home from './pages/students/Home.jsx'
// import CourseDetail from './pages/students/CourseDetail.jsx'
// import CourseList from './pages/students/CourseList.jsx'
// import MyEnrollments from './pages/students/MyEnrollments.jsx'
// import Player from './pages/students/Player.jsx'
// import Loading from './components/students/Loading.jsx'

// // Educator pages
// import Educator from './pages/educator/Educator.jsx'
// import Dashboard from './pages/educator/Dashboard.jsx'
// import AddCourse from './pages/educator/AddCourse.jsx'
// import StudentEnrolled from './pages/educator/StudentsEnrolled.jsx'
// import MyCourses from './pages/educator/MyCourses.jsx'
// // Global Components
// import Navbar from './components/students/SNavbar.jsx'

// // Text Editor Styles
// import 'quill/dist/quill.snow.css';

// const App = () => {
//   return (
//     <div className="text-default min-h-screen bg-white">
//       {/* Navbar stays visible across all routes */}
//       <Navbar />
      
//       <Routes>
//         {/* --- STUDENT ROUTES --- */}
//         <Route path="/" element={<Home />} />
//         <Route path="/course-list" element={<CourseList />} />
//         <Route path="/course-list/:input" element={<CourseList />} />
//         <Route path="/course/:id" element={<CourseDetail />} />
//         <Route path="/my-enrollments" element={<MyEnrollments />} />
//         <Route path="/player/:courseId" element={<Player />} />
//         <Route path="/loading/:path" element={<Loading />} />

//         {/* --- EDUCATOR ROUTES (NESTED) --- */}
//         {/* The Educator component acts as a Layout/Shell containing the Sidebar */}
//         <Route path="/educator" element={<Educator />}>
          
//           {/* 'index' renders Dashboard by default when visiting /educator */}
//           <Route index element={<Dashboard />} />
          
//           {/* Child routes render inside the <Outlet /> of Educator.jsx */}
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="add-course" element={<AddCourse />} />
//           <Route path="student-enrolled" element={<StudentEnrolled />} />
//           <Route path="my-courses" element={<MyCourses />} />
          
//         </Route>
//       </Routes>
//     </div>
//   )
// }

// export default App
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

// Navbar for Student side
import Navbar from './components/students/SNavbar.jsx'

// Quill Styles for Text Editor
import 'quill/dist/quill.snow.css';
  import { ToastContainer} from 'react-toastify';

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
      </Routes>
    </div>
  )
}

export default App

