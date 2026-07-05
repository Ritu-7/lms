import React from 'react'
import { assets } from '../../assets/assets'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { useAuthModal } from '../../contexts/AuthContext'
import NotificationBell from '../notifications/NotificationBell'

const SNavbar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { openAuth } = useAuthModal()

  const isCourseListPage = location.pathname.includes('course-list')
  const { user } = useUser()
  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
      
      <img 
  src={assets.logo} 
  alt="Logo" 
  width="128"   
  height="32"   
  className="w-28 lg:w-32 cursor-pointer" 
  onClick={() => navigate('/')} 
/>

      <div className="hidden md:flex items-center gap-5 text-gray-600">
        {user && (
          <>
            <Link to="/my-enrollments" className="hover:text-black">My Enrollments</Link>
            <Link to="/quizzes" className="hover:text-black">Quizzes</Link>
            <Link to="/assignments" className="hover:text-black">Assignments</Link>
          </>
        )}

        {user ? (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserButton />
          </div>
        ) : (
          <button onClick={() => openAuth('student')} className="bg-blue-600 text-white px-5 py-2 rounded-full">
            Create Account
          </button>
        )}
      </div>

      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-gray-500">
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {user && (
            <>
              <Link to="/my-enrollments">Enrollments</Link>
              <Link to="/quizzes">Quizzes</Link>
              <Link to="/assignments">Assignments</Link>
            </>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserButton />
          </div>
        ) : (
          <button onClick={() => openAuth('student')}>
            <img src={assets.user_icon} alt="User Icon" className="w-8 h-8 cursor-pointer" />
          </button>
        )}
      </div>
    </div>
  )
}

export default SNavbar


