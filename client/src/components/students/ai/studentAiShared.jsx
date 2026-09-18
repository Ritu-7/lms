import React, { useCallback, useContext } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react'
import { AppContext } from '../../../context/AppContext'
import { aiGetRequest, aiRequest } from '../../../utils/aiClient'
import NoApiKeyState from '../../ai/NoApiKeyState'

export const fadeSlideUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export const liftHover = { y: -3 }

export const glassCard =
  'rounded-2xl border border-white/50 dark:border-white/10 bg-white/75 dark:bg-dk-surface/80 backdrop-blur-xl shadow-lg shadow-slate-900/5'

export const hrefForLearningResource = (item = {}) => {
  if (item.hrefHint === 'quiz' && (item.entityId || item.lessonId || item.quizId)) {
    return `/quiz/${item.entityId || item.lessonId || item.quizId}`
  }
  if (item.hrefHint === 'assignment' || (item.kind === 'practice' && item.hrefHint === 'assignment')) {
    return '/assignments'
  }
  if (item.hrefHint === 'catalog' && item.courseId) {
    return `/course/${item.courseId}`
  }
  if (item.kind === 'course' && item.courseId) {
    return `/course/${item.courseId}`
  }
  if (item.courseId) {
    return `/player/${item.courseId}`
  }
  return '/course-list'
}

export const useStudentAi = () => {
  const { backendURL, getToken } = useContext(AppContext)

  const post = useCallback(async (path, data = {}) => {
    const result = await aiRequest({ backendURL, getToken, path, data, retries: 1 })
    return result.data
  }, [backendURL, getToken])

  const get = useCallback(async (path, params) => {
    const result = await aiGetRequest({ backendURL, getToken, path, params, retries: 1 })
    return result.data
  }, [backendURL, getToken])

  return { backendURL, getToken, post, get }
}

export const StudentAiStatus = ({ loading, error, empty, emptyMessage, children, compact = false }) => {
  if (loading) {
    return (
      <div className={`flex items-center gap-3 text-slate-500 dark:text-dk-text-2 ${compact ? 'py-4' : 'py-10 justify-center'}`}>
        <Loader2 className="animate-spin" size={16} />
        Generating from your real learning records…
      </div>
    )
  }

  if (error?.isNoKey) {
    return compact ? (
      <p className="text-sm text-slate-500 dark:text-dk-text-2">
        Add your Gemini API key in AI Settings to generate this insight.
      </p>
    ) : (
      <NoApiKeyState />
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p>{error.message || 'Something went wrong. Please try again.'}</p>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-dk-border px-4 py-8 text-center text-sm text-slate-500 dark:text-dk-text-2">
        {emptyMessage}
      </div>
    )
  }

  return children
}

export const StudentAiHeader = ({ icon: Icon = Sparkles, title, subtitle, action }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
        <Icon size={14} />
        Student AI
      </div>
      <h2 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">{subtitle}</p> : null}
    </div>
    {action}
  </div>
)

export const GenerateButton = ({ onClick, loading, label = 'Generate', disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading || disabled}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
  >
    {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
    {loading ? 'Working…' : label}
  </button>
)

export const MotionCard = ({ children, className = '' }) => (
  <motion.div
    variants={fadeSlideUp}
    whileHover={liftHover}
    className={`${glassCard} p-5 ${className}`}
  >
    {children}
  </motion.div>
)
