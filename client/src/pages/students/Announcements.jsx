import React, { useState, useEffect, useContext, useMemo } from 'react'
import { AppContext } from '../../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { Bell, Search, Calendar, Users, ShieldAlert, Sparkles, Megaphone, ArrowLeft, CheckCircle2 } from 'lucide-react'

const AUDIENCE_TABS = [
  { id: 'all', label: 'All Updates' },
  { id: 'students', label: 'For Students' },
  { id: 'educators', label: 'For Educators' },
  { id: 'admins', label: 'Admin Notices' },
]

const audienceBadgeStyles = {
  all: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  students: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  educators: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  admins: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
}

const formatPublishDate = (dateString) => {
  if (!dateString) return 'Recent update'
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getRelativeTime = (dateString) => {
  if (!dateString) return 'Just now'
  const now = new Date()
  const past = new Date(dateString)
  const diffMs = now - past
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const Announcements = () => {
  const { backendURL, platformHomeData } = useContext(AppContext)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(`${backendURL}/api/platform/announcements`)
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements)
      } else if (platformHomeData?.announcements?.length > 0) {
        setAnnouncements(platformHomeData.announcements)
      }
    } catch (err) {
      console.error('Failed to load announcements:', err.message)
      if (platformHomeData?.announcements?.length > 0) {
        setAnnouncements(platformHomeData.announcements)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [backendURL])

  const filteredAnnouncements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return announcements.filter((item) => {
      // Tab filter
      if (activeTab !== 'all') {
        const itemAudience = (item.audience || 'all').toLowerCase()
        if (itemAudience !== 'all' && itemAudience !== activeTab) {
          return false
        }
      }

      // Search filter
      if (query) {
        const titleMatch = (item.title || '').toLowerCase().includes(query)
        const messageMatch = (item.message || '').toLowerCase().includes(query)
        if (!titleMatch && !messageMatch) return false
      }

      return true
    })
  }, [announcements, activeTab, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dk-base text-slate-900 dark:text-dk-text transition-colors duration-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-dk-text-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
            <Megaphone className="w-3.5 h-3.5" />
            Platform Feed
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 dark:from-blue-900 dark:via-indigo-950 dark:to-dk-surface p-8 sm:p-12 text-white shadow-xl">
          <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 -left-12 h-48 w-48 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Latest Platform News & Updates
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-space-grotesk tracking-tight">
              Announcements & Notices
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Stay in the loop with scheduled updates, new course releases, community announcements, and important alerts across LearnSphere.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white dark:bg-dk-surface p-4 rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-dk-text-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements by keyword..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 text-slate-900 dark:text-dk-text placeholder-slate-400 dark:placeholder-dk-text-3 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-dk-surface transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {AUDIENCE_TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                      : 'text-slate-600 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-1/3 bg-slate-200 dark:bg-dk-surface-2 rounded" />
                    <div className="h-5 w-20 bg-slate-200 dark:bg-dk-surface-2 rounded-full" />
                  </div>
                  <div className="h-4 w-full bg-slate-200 dark:bg-dk-surface-2 rounded" />
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-dk-surface-2 rounded" />
                </div>
              ))}
            </div>
          ) : filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((item, index) => {
              const audienceKey = (item.audience || 'all').toLowerCase()
              const badgeClass = audienceBadgeStyles[audienceKey] || audienceBadgeStyles.all
              const isRecent = index === 0

              return (
                <motion.article
                  key={item._id || item.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  className={`group relative rounded-2xl border bg-white dark:bg-dk-surface p-6 sm:p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900/60 ${
                    isRecent
                      ? 'border-blue-200 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/20 to-transparent dark:from-blue-950/10'
                      : 'border-slate-200 dark:border-dk-border'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isRecent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        <h2 className="text-lg sm:text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-dk-text-2">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatPublishDate(item.publishAt || item.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{getRelativeTime(item.publishAt || item.createdAt)}</span>
                      </div>
                    </div>

                    <span className={`self-start text-xs font-semibold px-3 py-1 rounded-full border ${badgeClass} uppercase tracking-wider`}>
                      {item.audience ? item.audience : 'All'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-dk-text-2 leading-relaxed whitespace-pre-line mt-2">
                    {item.message}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dk-border flex items-center justify-between text-xs text-slate-500 dark:text-dk-text-3">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verified Platform Update
                    </span>
                    <button
                      onClick={() => setSelectedAnnouncement(item)}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      View Full Details →
                    </button>
                  </div>
                </motion.article>
              )
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-dk-border bg-white dark:bg-dk-surface p-12 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-dk-surface-2 text-slate-400 dark:text-dk-text-3">
                <Bell className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-dk-text">No announcements found</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2 max-w-sm mx-auto">
                  {searchQuery
                    ? `No updates matching "${searchQuery}". Try adjusting your search term or filter.`
                    : 'There are no active announcements for the selected category at this time.'}
                </p>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Detailed Modal */}
        <AnimatePresence>
          {selectedAnnouncement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-dk-border pb-4">
                  <div className="space-y-1">
                    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${audienceBadgeStyles[(selectedAnnouncement.audience || 'all').toLowerCase()] || audienceBadgeStyles.all} uppercase tracking-wider mb-2`}>
                      {selectedAnnouncement.audience || 'All'}
                    </span>
                    <h2 className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
                      {selectedAnnouncement.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-dk-text-2 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Published on {formatPublishDate(selectedAnnouncement.publishAt || selectedAnnouncement.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="rounded-xl border border-slate-200 dark:border-dk-border p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-slate-700 dark:text-dk-text text-sm leading-relaxed whitespace-pre-line space-y-4">
                  {selectedAnnouncement.message}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-dk-border flex justify-end">
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Announcements
