import React, { useState, useEffect, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'

const POPULAR_SEARCHES = [
  'React for beginners',
  'Python machine learning',
  'UI/UX design fundamentals',
  'AWS certification',
  'Data structures & algorithms',
]

const GlobalSearch = ({ onClose }) => {
  const navigate = useNavigate()
  const { allCourses } = useContext(AppContext)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('lms-recent-searches') || '[]')
      setRecentSearches(Array.isArray(stored) ? stored.slice(0, 5) : [])
    } catch {
      setRecentSearches([])
    }
  }, [])

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Search logic
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const filtered = (allCourses || [])
      .filter(c =>
        c.courseTitle?.toLowerCase().includes(q) ||
        c.courseCategory?.toLowerCase().includes(q) ||
        c.instructor?.name?.toLowerCase().includes(q)
      )
      .slice(0, 6)
    setResults(filtered)
  }, [query, allCourses])

  const saveRecent = (term) => {
    try {
      const existing = JSON.parse(localStorage.getItem('lms-recent-searches') || '[]')
      const updated = [term, ...existing.filter(s => s !== term)].slice(0, 5)
      localStorage.setItem('lms-recent-searches', JSON.stringify(updated))
    } catch {}
  }

  const handleSearch = (term = query) => {
    const t = term.trim()
    if (!t) return
    saveRecent(t)
    onClose()
    navigate(`/course-list/${encodeURIComponent(t)}`)
  }

  const handleClearRecent = () => {
    localStorage.removeItem('lms-recent-searches')
    setRecentSearches([])
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/5">
          <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            placeholder="Search courses, instructors, categories…"
            className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 transition-colors"
          >
            Esc
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Live results */}
          {results.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Courses</span>
              </div>
              {results.map((course) => (
                <button
                  key={course._id}
                  onClick={() => { onClose(); navigate(`/course/${course._id}`) }}
                  className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  {course.courseThumbnail && (
                    <img src={course.courseThumbnail} alt="" className="h-9 w-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.courseTitle}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{course.courseCategory}</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
              {query.trim() && (
                <button
                  onClick={() => handleSearch()}
                  className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors text-left"
                >
                  <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Search for "<span className="font-semibold">{query}</span>"
                  </span>
                </button>
              )}
            </div>
          )}

          {/* No results */}
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">No courses found for "{query}"</p>
              <button onClick={() => handleSearch()} className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Browse all courses
              </button>
            </div>
          )}

          {/* Empty state */}
          {!query.trim() && (
            <>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recent</span>
                    <button onClick={handleClearRecent} className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">Clear</button>
                  </div>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); handleSearch(s) }}
                      className="flex items-center gap-3 w-full rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{s}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular searches */}
              <div>
                <div className="px-2 py-1.5">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Popular</span>
                </div>
                {POPULAR_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); handleSearch(s) }}
                    className="flex items-center gap-3 w-full rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <svg className="h-4 w-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{s}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 dark:border-white/10 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 dark:border-white/10 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-slate-200 dark:border-white/10 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> Close</span>
          </div>
          <span>Powered by LearnOS</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GlobalSearch
