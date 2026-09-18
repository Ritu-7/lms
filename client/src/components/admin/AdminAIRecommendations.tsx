import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  Users,
  BookOpen,
  BarChart3,
  GraduationCap,
  ExternalLink,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────
type Priority = 'High' | 'Medium' | 'Low'
type Category = 'Engagement' | 'Completion' | 'Educator' | 'Growth'
type Status = 'idle' | 'loading' | 'success' | 'error' | 'no_key'

interface Recommendation {
  title: string
  category: Category
  priority: Priority
  reason: string
  supporting_metrics: Record<string, string | number>
  suggested_action: string
  impact_estimate: string | null
}

interface RecData {
  recommendations: Recommendation[]
  dataInsufficient: boolean
  generatedAt: string
}

// ─── Constants ────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

// Priority → badge styles
const PRIORITY_BADGE: Record<Priority, string> = {
  High: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

// Priority → left-border accent
const PRIORITY_BORDER: Record<Priority, string> = {
  High: 'border-l-rose-500',
  Medium: 'border-l-amber-400',
  Low: 'border-l-slate-300 dark:border-l-slate-600',
}

// Category → tag styles + icon
const CATEGORY_CONFIG: Record<
  Category,
  { tag: string; icon: React.ReactNode; ctaLabel: string; ctaPath: string }
> = {
  Engagement: {
    tag: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: <Users className="w-3.5 h-3.5" />,
    ctaLabel: 'View Students',
    ctaPath: '/admin/users-insights',
  },
  Completion: {
    tag: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    ctaLabel: 'Course Health',
    ctaPath: '/admin/course-health',
  },
  Educator: {
    tag: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    icon: <GraduationCap className="w-3.5 h-3.5" />,
    ctaLabel: 'View Educators',
    ctaPath: '/admin/users-insights',
  },
  Growth: {
    tag: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    ctaLabel: 'View Enrollments',
    ctaPath: '/admin/enrollments',
  },
}

// ─── Animation variants ───────────────────────────────────────────
const fadeSlideUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const liftHover = { y: -3 }

// ─── Skeleton ─────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-1 lg:grid-cols-2 gap-4"
  >
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        variants={fadeSlideUp}
        className="animate-pulse rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="w-20 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
        </div>
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg w-28" />
      </motion.div>
    ))}
  </motion.div>
)

// ─── Error State ──────────────────────────────────────────────────
const ErrorState = ({
  message,
  onRetry,
  isLoading,
}: {
  message: string
  onRetry: () => void
  isLoading?: boolean
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const isRawJson =
    message.trim().startsWith('{') || message.trim().startsWith('[')
  const humanMessage = isRawJson
    ? 'We encountered an issue communicating with the AI service. Please verify your connection or try again.'
    : message.replace(/Error:\s*/gi, '')

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-4 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-dk-text text-base">
          Couldn't generate recommendations right now
        </h3>
        <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-1.5 leading-relaxed">
          {humanMessage}
        </p>
      </div>

      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm shadow-rose-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Retrying…' : 'Try Again'}
        </button>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline transition-colors"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full text-left mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800"
          >
            <p className="text-slate-400 text-[10px] uppercase font-sans font-bold mb-1">
              Technical Debug Log:
            </p>
            <code>{message}</code>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── No Key State ─────────────────────────────────────────────────
const NoKeyState = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
      <Sparkles className="w-6 h-6 text-amber-500" />
    </div>
    <div>
      <p className="font-semibold text-slate-800 dark:text-dk-text">
        Gemini API Key Required
      </p>
      <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1 max-w-sm">
        AI Recommendations uses your Gemini API key. Configure it in Admin Settings to enable this feature.
      </p>
    </div>
    <a
      href="/admin/settings"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm"
    >
      Go to Settings
    </a>
  </div>
)

// ─── Empty / Healthy State ────────────────────────────────────────
const PlatformHealthyState = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
    <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shadow-sm">
      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
    </div>
    <div>
      <p className="font-semibold text-slate-800 dark:text-dk-text text-base">
        Platform looks healthy!
      </p>
      <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1 max-w-sm leading-relaxed">
        The AI analyzed your data and found no significant signals that need attention right now.
        Check back after more activity accumulates.
      </p>
    </div>
  </div>
)

// ─── Insufficient Data State ──────────────────────────────────────
const InsufficientDataState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
      <TrendingUp className="w-6 h-6 text-slate-400" />
    </div>
    <div>
      <p className="font-semibold text-slate-700 dark:text-dk-text">
        Not enough platform data yet
      </p>
      <p className="text-sm text-slate-400 dark:text-dk-text-2 mt-1 max-w-sm">
        Once students enroll and start learning, the AI can generate targeted recommendations
        across all four areas.
      </p>
    </div>
  </div>
)

// ─── Single Recommendation Card ───────────────────────────────────
const RecommendationCard = ({
  rec,
  index,
}: {
  rec: Recommendation
  index: number
}) => {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const catConfig = CATEGORY_CONFIG[rec.category] ?? CATEGORY_CONFIG.Engagement
  const metricsEntries = Object.entries(rec.supporting_metrics || {})

  return (
    <motion.div
      variants={fadeSlideUp}
      whileHover={liftHover}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-xl border border-l-4 border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden transition-shadow hover:shadow-md ${PRIORITY_BORDER[rec.priority]}`}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-2 flex-wrap mb-2.5">
          {/* Priority badge */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[rec.priority]}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                rec.priority === 'High'
                  ? 'bg-rose-500'
                  : rec.priority === 'Medium'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
              }`}
            />
            {rec.priority} Priority
          </span>

          {/* Category tag */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${catConfig.tag}`}
          >
            {catConfig.icon}
            {rec.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-dk-text leading-snug">
          {rec.title}
        </h3>

        {/* Suggested action (always visible) */}
        <p className="mt-1.5 text-xs text-slate-500 dark:text-dk-text-2 leading-relaxed">
          {rec.suggested_action}
        </p>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Why this matters
            </>
          )}
        </button>
      </div>

      {/* Expandable section */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-dk-border pt-3 space-y-3">
              {/* Reason */}
              {rec.reason && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Analysis
                  </p>
                  <p className="text-xs text-slate-600 dark:text-dk-text-2 leading-relaxed">
                    {rec.reason}
                  </p>
                </div>
              )}

              {/* Supporting metrics */}
              {metricsEntries.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Supporting Metrics
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {metricsEntries.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex flex-col px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-dk-surface-2 border border-slate-100 dark:border-dk-border"
                      >
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                          {k.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-dk-text truncate">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact estimate */}
              {rec.impact_estimate && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-0.5">
                      Potential Impact
                    </p>
                    <p className="text-xs text-slate-600 dark:text-dk-text-2">
                      {rec.impact_estimate}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA footer */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate(catConfig.ctaPath)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-dk-surface-2 text-white dark:text-dk-text border border-transparent dark:border-dk-border hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <ExternalLink className="w-3 h-3" />
          {catConfig.ctaLabel}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
const AdminAIRecommendations = () => {
  const { getToken } = useAuth()
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<RecData | null>(null)
  const [error, setError] = useState<string>('')
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const fetchRecommendations = useCallback(
    async (bust = false) => {
      setStatus('loading')
      setError('')
      try {
        const token = await getToken()
        const url = `${BACKEND_URL}/api/admin/analytics/recommendations${bust ? '?bust=true' : ''}`
        const { data: res } = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.success) {
          setData({ ...res.data, cached: res.cached })
          setStatus('success')
          setIsFirstLoad(false)
          if (bust) {
            setCooldownSeconds(60)
          }
        } else {
          throw new Error(res.message || 'Unknown error')
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'An error occurred.'
        if (msg === 'NO_API_KEY' || err?.response?.status === 403) {
          setStatus('no_key')
        } else {
          setError(msg)
          setStatus('error')
        }
      }
    },
    [getToken]
  )

  const handleGenerate = () => fetchRecommendations(false)
  const handleRefresh = () => {
    if (cooldownSeconds > 0) return
    fetchRecommendations(true)
  }

  // Cast to include cached flag from API
  const recData = data as (RecData & { cached?: boolean }) | null

  return (
    <section className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-dk-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-purple-50/60 to-blue-50/40 dark:from-purple-900/10 dark:to-blue-900/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-dk-text font-space-grotesk flex items-center gap-2">
              AI Platform Recommendations
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                Powered by Gemini
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-dk-text-2">
              Engagement, completion, educator performance, and growth signals — all in one place.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {status === 'success' && (
            <button
              onClick={handleRefresh}
              disabled={cooldownSeconds > 0}
              title={
                cooldownSeconds > 0
                  ? `Please wait ${cooldownSeconds}s before refreshing again`
                  : 'Refresh recommendations (bypasses cache)'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-dk-surface-2 border border-slate-200 dark:border-dk-border text-slate-600 dark:text-dk-text-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-3 h-3 ${status === 'loading' ? 'animate-spin' : ''}`}
              />
              {cooldownSeconds > 0 ? `Refresh (${cooldownSeconds}s)` : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6">
        {/* Idle — Show Generate Button */}
        {status === 'idle' && isFirstLoad && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-5 py-10 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-dk-text text-lg font-space-grotesk">
                Generate Platform Recommendations
              </p>
              <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1 max-w-sm leading-relaxed">
                Analyze engagement, completion, educator performance, and growth signals to surface
                prioritized, data-grounded actions for your platform.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all shadow-md shadow-purple-500/30"
            >
              <Sparkles className="w-4 h-4" />
              Analyze Now
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {status === 'loading' && <LoadingSkeleton />}

        {/* No API Key */}
        {status === 'no_key' && <NoKeyState />}

        {/* Error */}
        {status === 'error' && (
          <ErrorState
            message={error}
            onRetry={handleRefresh}
            isLoading={status === 'loading'}
          />
        )}

        {/* Success */}
        {status === 'success' && recData && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeSlideUp}
            className="space-y-5"
          >
            {/* Timestamp + cache badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span>
                  Last updated{' '}
                  {new Date(recData.generatedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {recData.cached && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    Cached
                  </span>
                )}
                {cooldownSeconds > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 animate-pulse">
                    Refresh cooldown ({cooldownSeconds}s)
                  </span>
                )}
              </div>

              {/* Category summary pills */}
              {!recData.dataInsufficient && recData.recommendations.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['Engagement', 'Completion', 'Educator', 'Growth'] as Category[]).map(
                    (cat) => {
                      const count = recData.recommendations.filter(
                        (r) => r.category === cat
                      ).length
                      if (count === 0) return null
                      return (
                        <span
                          key={cat}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_CONFIG[cat].tag}`}
                        >
                          {cat} · {count}
                        </span>
                      )
                    }
                  )}
                </div>
              )}
            </div>

            {/* Insufficient data */}
            {recData.dataInsufficient && <InsufficientDataState />}

            {/* Empty (data exists, AI found nothing) */}
            {!recData.dataInsufficient && recData.recommendations.length === 0 && (
              <PlatformHealthyState />
            )}

            {/* Recommendation cards grid */}
            {!recData.dataInsufficient && recData.recommendations.length > 0 && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {recData.recommendations.map((rec, i) => (
                  <RecommendationCard key={`${rec.category}-${i}`} rec={rec} index={i} />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default AdminAIRecommendations
