import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { AlertTriangle, Lightbulb, RefreshCw, Sparkles, TrendingDown, TrendingUp, ChevronDown } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
interface Anomaly {
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
}

interface Recommendation {
  title: string
  action: string
  priority: 'low' | 'medium' | 'high'
}

interface InsightData {
  summary: string
  anomalies: Anomaly[]
  recommendations: Recommendation[]
  dataInsufficient: boolean
  generatedAt: string
  dateRange: string
  cached?: boolean
}

type DateRange = '30d' | '90d' | '6m'
type Status = 'idle' | 'loading' | 'success' | 'error' | 'no_key'

// ─── Helpers ─────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '6m': 'Last 6 Months',
}

const severityBadge = (severity: string) => {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  }
  return map[severity] ?? map.low
}

const priorityBadge = (priority: string) => {
  const map: Record<string, string> = {
    high: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  }
  return map[priority] ?? map.low
}

// ─── Sub-components ───────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-violet-200 dark:bg-violet-900/40" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64" />
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
      ))}
    </div>
    <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">
      AI is analyzing your platform data across 6 data sources…
    </p>
  </div>
)

const ErrorState = ({ message, onRetry, isLoading }: { message: string; onRetry: () => void; isLoading?: boolean }) => {
  const [showDetails, setShowDetails] = useState(false)
  
  // Format message to ensure it's humanized
  const isRawJson = message.trim().startsWith('{') || message.trim().startsWith('[')
  const humanMessage = isRawJson 
    ? "We encountered an issue communicating with the AI service. Please verify your connection or try again."
    : message.replace(/Error:\s*/gi, '')

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 px-4 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-dk-text text-base">We couldn't generate insights right now</h3>
        <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-1.5 leading-relaxed">{humanMessage}</p>
      </div>

      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm shadow-rose-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Retrying...' : 'Try Again'}
        </button>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline transition-colors"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="w-full text-left mt-3 p-3 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800"
        >
          <p className="text-slate-400 text-[10px] uppercase font-sans font-bold mb-1">Technical Debug Log:</p>
          <code>{message}</code>
        </motion.div>
      )}
    </div>
  )
}

const NoKeyState = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
      <Sparkles className="w-6 h-6 text-amber-500" />
    </div>
    <div>
      <p className="font-semibold text-slate-800 dark:text-dk-text">Gemini API Key Required</p>
      <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1 max-w-sm">
        AI Insights uses your personal Gemini API key. Configure it in Admin Settings to enable this feature.
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

const InsufficientDataState = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
      <TrendingDown className="w-6 h-6 text-slate-400" />
    </div>
    <div>
      <p className="font-semibold text-slate-700 dark:text-dk-text">Not enough data yet</p>
      <p className="text-sm text-slate-400 dark:text-dk-text-2 mt-1 max-w-sm">
        There isn't enough platform activity in the selected period for meaningful AI analysis. Try a wider date range or check back later.
      </p>
    </div>
  </div>
)

const SeverityDot = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-400',
    low: 'bg-slate-400',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[severity] ?? colors.low} flex-shrink-0 mt-1.5`} />
}

// ─── Main Component ───────────────────────────────────────────────
const AdminAIInsights = () => {
  const { getToken } = useAuth()
  const [status, setStatus] = useState<Status>('idle')
  const [insights, setInsights] = useState<InsightData | null>(null)
  const [error, setError] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange>('6m')
  const [showRangeDropdown, setShowRangeDropdown] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0)

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const fetchInsights = useCallback(async (range: DateRange, bust = false) => {
    setStatus('loading')
    setError('')
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${BACKEND_URL}/api/admin/analytics/ai-insights`,
        { dateRange: range, bust },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setInsights({ ...data.data, cached: data.cached })
        setStatus('success')
        setIsFirstLoad(false)
        if (bust) {
          setCooldownSeconds(60) // 60-second visible cooldown after manual refresh
        }
      } else {
        throw new Error(data.message || 'Unknown error')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'An error occurred.'
      if (msg === 'NO_API_KEY' || err?.response?.status === 403) {
        setStatus('no_key')
      } else {
        setError(msg)
        setStatus('error')
      }
    }
  }, [getToken])

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range)
    setShowRangeDropdown(false)
    setInsights(null)
    fetchInsights(range)
  }

  const handleRegenerate = () => {
    if (cooldownSeconds > 0) return
    fetchInsights(dateRange, true)
  }

  const handleInitialLoad = () => fetchInsights(dateRange)

  return (
    <section className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-dk-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-violet-50/60 to-blue-50/40 dark:from-violet-900/10 dark:to-blue-900/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-dk-text font-space-grotesk flex items-center gap-2">
              AI Insights
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                Powered by Gemini
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-dk-text-2">
              Real-time platform analysis across users, revenue, completion, and performance.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Date Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-dk-surface-2 border border-slate-200 dark:border-dk-border text-slate-600 dark:text-dk-text-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              {DATE_RANGE_LABELS[dateRange]}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showRangeDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-lg z-20 overflow-hidden">
                {(Object.entries(DATE_RANGE_LABELS) as [DateRange, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleRangeChange(key)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      dateRange === key
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium'
                        : 'text-slate-700 dark:text-dk-text hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Regenerate */}
          {status === 'success' && (
            <button
              onClick={handleRegenerate}
              disabled={status === 'loading' || cooldownSeconds > 0}
              title={cooldownSeconds > 0 ? `Please wait ${cooldownSeconds}s before refreshing again` : "Refresh insights (bypasses cache)"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-dk-surface-2 border border-slate-200 dark:border-dk-border text-slate-600 dark:text-dk-text-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3 h-3 ${status === 'loading' ? 'animate-spin' : ''}`} />
              {cooldownSeconds > 0 ? `Refresh (${cooldownSeconds}s)` : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Idle — Show Generate Button */}
        {status === 'idle' && isFirstLoad && (
          <div className="flex flex-col items-center justify-center gap-5 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-dk-text text-lg font-space-grotesk">
                Generate AI Insights
              </p>
              <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-1 max-w-sm">
                Analyze platform data across {DATE_RANGE_LABELS[dateRange].toLowerCase()} to surface trends, anomalies, and actionable recommendations.
              </p>
            </div>
            <button
              onClick={handleInitialLoad}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all shadow-md shadow-violet-500/30"
            >
              <Sparkles className="w-4 h-4" />
              Analyze Now
            </button>
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && <LoadingSkeleton />}

        {/* No API Key */}
        {status === 'no_key' && <NoKeyState />}

        {/* Error */}
        {status === 'error' && <ErrorState message={error} onRetry={handleRegenerate} />}

        {/* Success */}
        {status === 'success' && insights && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Cached badge + timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <span>
                  Generated {new Date(insights.generatedAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
                {insights.cached && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    Cached
                  </span>
                )}
                {cooldownSeconds > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 animate-pulse">
                    Refresh cooldown active ({cooldownSeconds}s)
                  </span>
                )}
              </div>
            </div>

            {/* Insufficient data */}
            {insights.dataInsufficient ? (
              <InsufficientDataState />
            ) : (
              <>
                {/* Summary */}
                {insights.summary && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/10 dark:to-blue-900/10 border border-violet-100 dark:border-violet-800/30">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
                          Platform Summary
                        </p>
                        <p className="text-sm text-slate-700 dark:text-dk-text-2 leading-relaxed">
                          {insights.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anomalies */}
                {insights.anomalies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-dk-text">
                        Anomalies Detected
                      </h3>
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        {insights.anomalies.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {insights.anomalies.map((anomaly, i) => (
                        <div
                          key={i}
                          className="flex gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50/50 dark:bg-dk-surface-2 hover:border-amber-200 dark:hover:border-amber-700/50 transition-colors"
                        >
                          <SeverityDot severity={anomaly.severity} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800 dark:text-dk-text">
                                {anomaly.title}
                              </p>
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md capitalize flex-shrink-0 ${severityBadge(anomaly.severity)}`}>
                                {anomaly.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5 leading-relaxed">
                              {anomaly.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {insights.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-blue-500" />
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-dk-text">
                        Recommendations
                      </h3>
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {insights.recommendations.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {insights.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dk-border bg-slate-50/50 dark:bg-dk-surface-2 hover:border-blue-200 dark:hover:border-blue-700/50 transition-colors"
                        >
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800 dark:text-dk-text">
                                {rec.title}
                              </p>
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md capitalize flex-shrink-0 ${priorityBadge(rec.priority)}`}>
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-dk-text-2 mt-0.5 leading-relaxed">
                              {rec.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No anomalies / recommendations */}
                {insights.anomalies.length === 0 && insights.recommendations.length === 0 && !insights.dataInsufficient && (
                  <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
                    Everything looks healthy! No anomalies or recommendations for this period.
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default AdminAIInsights
