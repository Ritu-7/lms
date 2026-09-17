import React from 'react'
import { assets } from '../../assets/assets'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { useAuthModal } from '../../contexts/AuthContext'
import NotificationBell from '../notifications/NotificationBell'
import Logo from '../common/Logo'
import ThemeToggle from '../common/ThemeToggle'

const SNavbar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { openAuth } = useAuthModal()

  const isCourseListPage = location.pathname.includes('course-list')
  const { user } = useUser()
  
  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-card-border py-4 sticky top-0 z-50 backdrop-blur-md transition-colors duration-500 bg-bg-primary`}>
      
      <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/')}>
        <Logo />
      </div>

      <div className="hidden md:flex items-center gap-5 text-text-secondary font-medium">
        {user && (
          <>
            <Link to="/my-enrollments" className="hover:text-text-primary transition-colors">My Enrollments</Link>
            <Link to="/quizzes" className="hover:text-text-primary transition-colors">Quizzes</Link>
            <Link to="/assignments" className="hover:text-text-primary transition-colors">Assignments</Link>
          </>
        )}

        {user ? (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
            <UserButton />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => openAuth('student')} className="bg-accent-blue text-white px-5 py-2 rounded-full hover:bg-accent-blue/90 transition-colors shadow-sm shadow-glow-blue font-semibold">
              Create Account
            </button>
          </div>
        )}
      </div>

      <div className="md:hidden flex items-center gap-2 sm:gap-5 text-text-secondary">
        <div className="flex items-center gap-1 sm:gap-2 max-sm:text-xs">
          {user && (
            <>
              <Link to="/my-enrollments" className="hover:text-text-primary">Enrollments</Link>
              <Link to="/quizzes" className="hover:text-text-primary hidden sm:block">Quizzes</Link>
            </>
          )}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <UserButton />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => openAuth('student')} className="text-text-primary hover:text-accent-blue transition-colors">
              <img src={assets.user_icon} alt="User Icon" className="w-8 h-8 cursor-pointer" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SNavbar


