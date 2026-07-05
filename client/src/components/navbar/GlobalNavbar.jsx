import React, { useState, useEffect, useRef, useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { useAuthModal } from '../../contexts/AuthContext'
import { assets } from '../../assets/assets'
import NotificationBell from '../notifications/NotificationBell'
import GlobalSearch from './GlobalSearch'
import CategoriesMegaMenu from './CategoriesMegaMenu'
import AIToolsDropdown from './AIToolsDropdown'
import ProfileDropdown from './ProfileDropdown'
import MobileDrawer from './MobileDrawer'
import Logo from '../common/Logo'

const GlobalNavbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { isEducator, isAdmin } = useContext(AppContext)
  const { openAuth } = useAuthModal()

  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [aiToolsOpen, setAiToolsOpen] = useState(false)

  const categoriesRef = useRef(null)
  const aiToolsRef = useRef(null)

  // Track scroll for shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Ctrl+K shortcut to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) setCategoriesOpen(false)
      if (aiToolsRef.current && !aiToolsRef.current.contains(e.target)) setAiToolsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinkClass = (path) =>
    `relative text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
    }`

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]'
            : 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* ── Logo ─────────────────────────────────────────────── */}
          <Link to="/" className="flex shrink-0 items-center mr-6">
            <Logo />
          </Link>

          {/* ── Desktop Nav Links ─────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/" className={`${navLinkClass('/')} px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5`}>
              Home
            </Link>
            <Link to="/course-list" className={`${navLinkClass('/course-list')} px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5`}>
              Courses
            </Link>

            {/* Categories Mega Menu */}
            <div ref={categoriesRef} className="relative">
              <button
                onClick={() => { setCategoriesOpen(o => !o); setAiToolsOpen(false) }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5 ${
                  categoriesOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Categories
                <motion.svg
                  animate={{ rotate: categoriesOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-3.5 w-3.5 opacity-60"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {categoriesOpen && (
                  <CategoriesMegaMenu onClose={() => setCategoriesOpen(false)} />
                )}
              </AnimatePresence>
            </div>

            {/* AI Tools Dropdown */}
            <div ref={aiToolsRef} className="relative">
              <button
                onClick={() => { setAiToolsOpen(o => !o); setCategoriesOpen(false) }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-white/5 ${
                  aiToolsOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                AI Tools
                <motion.svg
                  animate={{ rotate: aiToolsOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-3.5 w-3.5 opacity-60"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {aiToolsOpen && (
                  <AIToolsDropdown onClose={() => setAiToolsOpen(false)} />
                )}
              </AnimatePresence>
            </div>

            <Link to="/about" className={`${navLinkClass('/about')} px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5`}>
              About
            </Link>
            <Link to="/contact" className={`${navLinkClass('/contact')} px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5`}>
              Contact
            </Link>
          </nav>

          {/* ── Spacer ───────────────────────────────────────────── */}
          <div className="flex-1" />

          {/* ── Search ───────────────────────────────────────────── */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2 text-sm text-slate-400 dark:text-slate-500 transition hover:border-blue-200 dark:hover:border-blue-800 hover:bg-white dark:hover:bg-white/10 min-w-[180px] lg:min-w-[220px]"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <span className="flex-1 text-left">Search courses…</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-slate-300 dark:border-white/15 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500">
              ⌘K
            </kbd>
          </button>

          {/* ── Right Actions ─────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Role-based quick links (desktop) */}
                <div className="hidden lg:flex items-center gap-1">
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      className="text-sm font-medium px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  ) : isEducator ? (
                    <>
                      <Link to="/educator/dashboard" className="text-sm font-medium px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        Dashboard
                      </Link>
                      <Link to="/educator/add-course" className="text-sm font-medium px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        Create Course
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/my-enrollments" className="text-sm font-medium px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        My Learning
                      </Link>
                    </>
                  )}
                </div>

                {/* Notification bell */}
                <div className="relative">
                  <NotificationBell />
                </div>

                {/* Profile Dropdown */}
                <ProfileDropdown user={user} isEducator={isEducator} isAdmin={isAdmin} signOut={signOut} />
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => openAuth('student')}
                  className="text-sm font-medium px-4 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuth('student')}
                  className="text-sm font-semibold px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all hover:shadow-blue-600/30 hover:shadow-md"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Active route indicator bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
      </header>

      {/* ── Global Search Overlay ─────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <GlobalSearch onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <MobileDrawer
            onClose={() => setDrawerOpen(false)}
            user={user}
            isEducator={isEducator}
            isAdmin={isAdmin}
            openAuth={openAuth}
            signOut={signOut}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default GlobalNavbar
