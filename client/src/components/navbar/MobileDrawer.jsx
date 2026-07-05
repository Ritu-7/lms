import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const CollapseSection = ({ id, title, children, toggle, expandedSection }) => (
  <div className="border-b border-slate-100 dark:border-white/5">
    <button
      onClick={() => toggle(id)}
      className="flex items-center justify-between w-full py-3.5 px-4 text-sm font-medium text-slate-700 dark:text-slate-200"
    >
      {title}
      <motion.svg
        animate={{ rotate: expandedSection === id ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="h-4 w-4 text-slate-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </motion.svg>
    </button>
    {expandedSection === id && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="pb-2"
      >
        {children}
      </motion.div>
    )}
  </div>
)

const MobileDrawer = ({ onClose, user, isEducator, isAdmin, openAuth, signOut }) => {
  const navigate = useNavigate()
  const [expandedSection, setExpandedSection] = useState(null)

  const toggle = (key) => setExpandedSection(prev => prev === key ? null : key)

  const handleSignOut = async () => {
    onClose()
    await signOut()
    navigate('/')
  }

  const categories = [
    'Development', 'AI & ML', 'Data Science', 'Design',
    'Business', 'Marketing', 'Cyber Security', 'Cloud & DevOps',
  ]

  const aiTools = [
    { label: 'AI Tutor', href: '/ai-tutor' },
    { label: 'PDF Summary', href: '/ai-pdf-summary' },
    { label: 'Video Summary', href: '/ai-video-summary' },
    { label: 'Quiz Generator', href: '/ai-quiz-generator' },
    { label: 'Flashcards', href: '/ai-flashcards' },
    { label: 'Mind Maps', href: '/ai-mind-maps' },
  ]

  const roleLinks = isAdmin
    ? [
        { label: 'Admin Dashboard', href: '/admin' },
        { label: 'Students', href: '/admin/students' },
        { label: 'Courses', href: '/admin/courses' },
        { label: 'Reports', href: '/admin/reports' },
        { label: 'Settings', href: '/admin/settings' },
        { label: 'Notifications', href: '/admin/notifications' },
      ]
    : isEducator
    ? [
        { label: 'Dashboard', href: '/educator/dashboard' },
        { label: 'Create Course', href: '/educator/add-course' },
        { label: 'My Courses', href: '/educator/my-courses' },
        { label: 'Assignments', href: '/educator/assignments' },
        { label: 'Quizzes', href: '/educator/quizzes' },
      ]
    : [
        { label: 'My Enrollments', href: '/my-enrollments' },
        { label: 'Quizzes', href: '/quizzes' },
        { label: 'Assignments', href: '/assignments' },
        { label: 'Notifications', href: '/notifications' },
      ]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-white/5">
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.imageUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {user.fullName || user.firstName || 'User'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {isAdmin ? 'Administrator' : isEducator ? 'Instructor' : 'Student'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Menu</p>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto">
          {/* Main links */}
          <div className="p-2">
            {[
              { label: 'Home', href: '/' },
              { label: 'Courses', href: '/course-list' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Collapsible sections */}
          <CollapseSection id="categories" title="Categories" toggle={toggle} expandedSection={expandedSection}>
            <div className="px-3 space-y-0.5">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/course-list/${encodeURIComponent(cat.toLowerCase())}`}
                  onClick={onClose}
                  className="flex items-center rounded-xl px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </CollapseSection>

          <CollapseSection id="ai-tools" title="🤖 AI Tools" toggle={toggle} expandedSection={expandedSection}>
            <div className="px-3 space-y-0.5">
              {aiTools.map((tool) => (
                <Link
                  key={tool.href}
                  to={tool.href}
                  onClick={onClose}
                  className="flex items-center rounded-xl px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {tool.label}
                </Link>
              ))}
            </div>
          </CollapseSection>

          {/* Role links */}
          {user && (
            <CollapseSection id="role" title={isAdmin ? '⊞ Admin' : isEducator ? '🎓 Instructor' : '📚 My Learning'} toggle={toggle} expandedSection={expandedSection}>
              <div className="px-3 space-y-0.5">
                {roleLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className="flex items-center rounded-xl px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </CollapseSection>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 dark:border-white/5 p-4 space-y-2">
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          ) : (
            <>
              <button
                onClick={() => { onClose(); openAuth('student') }}
                className="flex w-full items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { onClose(); openAuth('student') }}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Get Started — It's Free
              </button>
            </>
          )}
        </div>
      </motion.aside>
    </>
  )
}

export default MobileDrawer;
