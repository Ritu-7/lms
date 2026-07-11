import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const ProfileDropdown = ({ user, isEducator, isAdmin, signOut }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  // Build menu items based on role
  const menuItems = isAdmin
    ? [
        { label: 'Dashboard', icon: '⊞', href: '/admin' },
        { label: 'Users', icon: '👥', href: '/admin/students' },
        { label: 'Courses', icon: '📚', href: '/admin/courses' },
        { label: 'Categories', icon: '📁', href: '/admin/categories' },
        { label: 'Payments', icon: '💳', href: '/admin/payments' },
        { label: 'Reports', icon: '📊', href: '/admin/reports' },
        { label: 'Credits', icon: '🪙', href: '/admin/payments' }, // Placeholder to payments
        { label: 'Settings', icon: '⚙️', href: '/admin/settings' },
      ]
    : isEducator
    ? [
        { label: 'Dashboard', icon: '⊞', href: '/educator/dashboard' },
        { label: 'My Courses', icon: '📚', href: '/educator/my-courses' },
        { label: 'Analytics', icon: '📈', href: '/educator/dashboard' }, // Placeholder
        { label: 'Assignments', icon: '📝', href: '/educator/assignments' },
        { label: 'Quizzes', icon: '❓', href: '/educator/quizzes' },
        { label: 'Students', icon: '👥', href: '/educator/student-enrolled' },
        { label: 'Settings', icon: '⚙️', href: '/admin/settings' }, // Shared settings placeholder
      ]
    : [
        // Placeholder
        { label: 'Dashboard', icon: '🎓', href: '/my-enrollments' },
        { label: 'Certificates', icon: '📜', href: '/certificates' },
        { label: 'Bookmarks', icon: '🔖', href: '/bookmarks' }, 
        { label: 'AI Tools', icon: '🧠', href: '/ai-tutor' },
        { label: 'Settings', icon: '⚙️', href: '/settings' },
      
      ]

  const roleLabel = isAdmin ? 'Administrator' : isEducator ? 'Instructor' : 'Student'
  const roleColor = isAdmin ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30' : isEducator ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl p-1 pr-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
        aria-label="Profile menu"
      >
        <img
          src={user?.imageUrl}
          alt={user?.fullName || 'Profile'}
          className="h-8 w-8 rounded-lg object-cover ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all"
        />
        <div className="hidden xl:block text-left">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight max-w-[100px] truncate">
            {user?.firstName || user?.fullName || 'User'}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{roleLabel}</p>
        </div>
        <svg
          className={`hidden xl:block h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <img
                  src={user?.imageUrl}
                  alt=""
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColor}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
           <div className="p-1.5">
  {menuItems.map((item, index) => (
    <Link
      key={`${item.href}-${index}`}
      to={item.href}
      onClick={() => setOpen(false)}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      <span className="text-base leading-none w-5 text-center">{item.icon}</span>
      {item.label}
    </Link>
  ))}
</div>

            {/* Sign out */}
            <div className="p-1.5 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProfileDropdown
