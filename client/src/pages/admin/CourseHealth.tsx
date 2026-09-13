import { useState, useEffect, useCallback, useContext } from 'react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { AppContext } from '../../context/AppContext'
import { useTheme } from '../../contexts/ThemeContext'
import AdminSection from '../../components/admin/AdminSection'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubScore {
  score: number
  weight: number
}

interface SubScores {
  completion: SubScore
  quiz: SubScore
  assignment: SubScore
  activity: SubScore
  ratings: SubScore
  content: SubScore
}

interface Metrics {
  enrolledCount: number
  completionRate: number
  dropOffLecture: string | null
  quizAttemptCount: number
  quizPassRate: number
  quizAvgPercentage: number
  assignmentCount: number
  assignmentSubmissionRate: number
  assignmentAvgScore: number
  activeRatio: number
  ratingCount: number
  avgRating: number
  publishedLectures: number
  totalLectures: number
}

interface Problem {
  code: string
  severity: 'critical' | 'warning'
  title: string
  reason: string
  suggestions: string[]
}

interface CourseHealthEntry {
  courseId: string
  courseTitle: string
  category: string
  courseThumbnail: string | null
  educator: { name: string; email: string; imageUrl?: string } | null
  isPublished: boolean
  healthScore: number
  subScores: SubScores
  metrics: Metrics
  problems: Problem[]
  problemCount: number
  severity: 'healthy' | 'warning' | 'critical'
  createdAt: string
}

interface Summary {
  totalCourses: number
  avgPlatformScore: number
  criticalCount: number
  warningCount: number
  healthyCount: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const severityConfig = {
  healthy: {
    label: 'Healthy',
    color: '#10B981',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    ring: '#10B981',
  },
  warning: {
    label: 'Warning',
    color: '#F59E0B',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    ring: '#F59E0B',
  },
  critical: {
    label: 'Critical',
    color: '#EF4444',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    ring: '#EF4444',
  },
}

const subScoreLabels: Record<string, string> = {
  completion: 'Completion Rate',
  quiz: 'Quiz Performance',
  assignment: 'Assignment Engagement',
  activity: 'Learner Activity',
  ratings: 'Ratings',
  content: 'Content Completeness',
}

const subScoreColors: Record<string, string> = {
  completion: '#3B82F6',
  quiz: '#8B5CF6',
  assignment: '#F59E0B',
  activity: '#10B981',
  ratings: '#F97316',
  content: '#06B6D4',
}

function pct(v: number) {
  return `${Math.round(v)}%`
}
function rating(v: number) {
  return v.toFixed(1)
}

// ─── Circular Score Gauge ─────────────────────────────────────────────────────

function ScoreGauge({ score, severity }: { score: number; severity: 'healthy' | 'warning' | 'critical' }) {
  const cfg = severityConfig[severity]
  const data = [{ name: 'score', value: score, fill: cfg.color }]

  return (
    <div className="relative w-20 h-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={8}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            background={{ fill: 'rgba(148,163,184,0.15)' }}
            dataKey="value"
            cornerRadius={6}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold font-space-grotesk" style={{ color: cfg.color }}>
          {score}
        </span>
        <span className="text-[9px] text-slate-400">/ 100</span>
      </div>
    </div>
  )
}

// ─── Sub-score dimension bar ──────────────────────────────────────────────────

function DimensionBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 dark:text-dk-text-2">{label}</span>
        <span className="font-semibold text-slate-800 dark:text-dk-text">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-dk-surface-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ─── Problem Card ─────────────────────────────────────────────────────────────

function ProblemCard({ problem }: { problem: Problem }) {
  const [open, setOpen] = useState(false)
  const cfg = severityConfig[problem.severity]
  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <button
        type="button"
        className="w-full flex items-start justify-between gap-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold ${problem.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}>
            {problem.severity === 'critical' ? '!' : '⚠'}
          </span>
          <span className={`font-semibold text-sm truncate ${cfg.text}`}>{problem.title}</span>
        </div>
        <svg
          className={`shrink-0 w-4 h-4 ${cfg.text} transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <p className="text-xs text-slate-600 dark:text-dk-text-2 leading-relaxed">
                <span className="font-semibold">Why: </span>{problem.reason}
              </p>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">Suggestions:</p>
                <ul className="space-y-1">
                  {problem.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-dk-text-2">
                      <span className="text-blue-500 shrink-0">›</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Detail Panel (Drawer / Inline Expansion) ─────────────────────────────────

function DetailPanel({
  entry,
  onClose,
}: {
  entry: CourseHealthEntry
  onClose: () => void
}) {
  const subEntries = Object.entries(entry.subScores) as [string, SubScore][]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="col-span-full rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200 dark:border-dk-border bg-slate-50/50 dark:bg-dk-surface-2/30">
        <div className="min-w-0">
          <h3 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text truncate">
            {entry.courseTitle}
          </h3>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500 dark:text-dk-text-2">
            {entry.educator && <span>Educator: {entry.educator.name}</span>}
            <span>·</span>
            <span>{entry.category}</span>
            <span>·</span>
            <span>{entry.metrics.enrolledCount} enrolled</span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <ScoreGauge score={entry.healthScore} severity={entry.severity} />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dk-surface-2 text-slate-500"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 grid gap-8 lg:grid-cols-2">
        {/* Score Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-dk-text-2">
            Score Breakdown
          </h4>
          <div className="space-y-3">
            {subEntries.map(([key, val]) => (
              <DimensionBar
                key={key}
                label={subScoreLabels[key] || key}
                score={val.score}
                color={subScoreColors[key] || '#3B82F6'}
              />
            ))}
          </div>

          {/* Quick metrics grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Completion', value: pct(entry.metrics.completionRate * 100) },
              { label: 'Avg Rating', value: entry.metrics.ratingCount > 0 ? `${rating(entry.metrics.avgRating)} ★` : 'No ratings' },
              { label: 'Quiz Pass Rate', value: entry.metrics.quizAttemptCount > 0 ? pct(entry.metrics.quizPassRate * 100) : 'N/A' },
              { label: 'Avg Quiz Score', value: entry.metrics.quizAttemptCount > 0 ? pct(entry.metrics.quizAvgPercentage) : 'N/A' },
              { label: 'Assignment Rate', value: entry.metrics.assignmentCount > 0 ? pct(entry.metrics.assignmentSubmissionRate * 100) : 'N/A' },
              { label: 'Active (30d)', value: pct(entry.metrics.activeRatio * 100) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 border border-slate-200 dark:border-dk-border p-3"
              >
                <p className="text-xs text-slate-500 dark:text-dk-text-3">{label}</p>
                <p className="text-base font-bold text-slate-900 dark:text-dk-text">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Problems */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-dk-text-2">
            Detected Problems ({entry.problems.length})
          </h4>
          {entry.problems.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-6 text-center">
              <div className="text-3xl mb-2">✓</div>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold">No problems detected</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                This course is performing well across all dimensions.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {entry.problems.map((p) => (
                <ProblemCard key={p.code} problem={p} />
              ))}
            </div>
          )}

          {/* Drop-off callout */}
          {entry.metrics.dropOffLecture && (
            <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">
                🎯 Drop-off Hotspot Detected
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-300">
                Learners tend to stop after: <strong>"{entry.metrics.dropOffLecture}"</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({
  entry,
  isSelected,
  onSelect,
}: {
  entry: CourseHealthEntry
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  const cfg = severityConfig[entry.severity]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border bg-white dark:bg-dk-surface shadow-sm overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-700'
          : `border-slate-200 dark:border-dk-border hover:shadow-md`
      }`}
      onClick={() => onSelect(isSelected ? '' : entry.courseId)}
    >
      {/* Severity strip */}
      <div className="h-1 w-full" style={{ backgroundColor: cfg.color }} />

      <div className="p-5">
        {/* Top row: thumbnail + score gauge */}
        <div className="flex items-start gap-4 mb-4">
          {entry.courseThumbnail ? (
            <img
              src={entry.courseThumbnail}
              alt=""
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
              <span className="text-white text-lg font-bold">
                {entry.courseTitle?.[0] || 'C'}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-dk-text text-sm leading-tight line-clamp-2">
              {entry.courseTitle}
            </h3>
            <p className="text-xs text-slate-400 dark:text-dk-text-3 mt-0.5 truncate">
              {entry.educator?.name || 'Unknown educator'} · {entry.category}
            </p>
          </div>
          <ScoreGauge score={entry.healthScore} severity={entry.severity} />
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Enrolled', value: entry.metrics.enrolledCount.toString() },
            { label: 'Completion', value: pct(entry.metrics.completionRate * 100) },
            { label: 'Rating', value: entry.metrics.ratingCount > 0 ? `${rating(entry.metrics.avgRating)}★` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center rounded-lg bg-slate-50 dark:bg-dk-surface-2 py-2 px-1">
              <p className="text-sm font-bold text-slate-900 dark:text-dk-text">{value}</p>
              <p className="text-[10px] text-slate-400 dark:text-dk-text-3">{label}</p>
            </div>
          ))}
        </div>

        {/* Bottom row: severity badge + problem count + action */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: cfg.color }}
            />
            {cfg.label}
          </span>

          <div className="flex items-center gap-2">
            {entry.problemCount > 0 && (
              <span className="text-xs text-slate-500 dark:text-dk-text-2">
                {entry.problemCount} issue{entry.problemCount !== 1 ? 's' : ''}
              </span>
            )}
            <button
              type="button"
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {isSelected ? 'Collapse' : 'Details →'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-slate-200 dark:bg-dk-border" />
      <div className="p-5 space-y-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-dk-surface-2 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-dk-surface-2 rounded w-3/4" />
            <div className="h-2 bg-slate-200 dark:bg-dk-surface-2 rounded w-1/2" />
          </div>
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-dk-surface-2 shrink-0" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-dk-surface-2" />
          ))}
        </div>
        <div className="h-7 rounded-full bg-slate-100 dark:bg-dk-surface-2 w-1/3" />
      </div>
    </div>
  )
}

// ─── Summary Banner ───────────────────────────────────────────────────────────

function SummaryBanner({ summary }: { summary: Summary }) {
  const scoreColor =
    summary.avgPlatformScore >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : summary.avgPlatformScore >= 40
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="sm:col-span-2 lg:col-span-1 rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-5 shadow-sm">
        <p className="text-xs text-slate-500 dark:text-dk-text-2 uppercase tracking-wide font-medium">
          Platform Avg Score
        </p>
        <p className={`text-4xl font-bold font-space-grotesk mt-1 ${scoreColor}`}>
          {summary.avgPlatformScore}
          <span className="text-lg text-slate-400 font-normal">/100</span>
        </p>
        <p className="text-xs text-slate-400 dark:text-dk-text-3 mt-1">{summary.totalCourses} courses analyzed</p>
      </div>

      {[
        { label: 'Critical', count: summary.criticalCount, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', desc: 'Need immediate attention' },
        { label: 'Warning', count: summary.warningCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Have room for improvement' },
        { label: 'Healthy', count: summary.healthyCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', desc: 'Performing well' },
      ].map(({ label, count, color, bg, desc }) => (
        <div
          key={label}
          className={`rounded-2xl border border-slate-200 dark:border-dk-border ${bg} p-5 shadow-sm`}
        >
          <p className="text-xs text-slate-500 dark:text-dk-text-2 uppercase tracking-wide font-medium">
            {label}
          </p>
          <p className={`text-4xl font-bold font-space-grotesk mt-1 ${color}`}>{count}</p>
          <p className="text-xs text-slate-400 dark:text-dk-text-3 mt-1">{desc}</p>
        </div>
      ))}

      <div className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-5 shadow-sm">
        <p className="text-xs text-slate-500 dark:text-dk-text-2 uppercase tracking-wide font-medium">
          Health Distribution
        </p>
        <div className="mt-3 space-y-2">
          {[
            { label: 'Healthy', pct: summary.totalCourses ? (summary.healthyCount / summary.totalCourses) * 100 : 0, color: '#10B981' },
            { label: 'Warning', pct: summary.totalCourses ? (summary.warningCount / summary.totalCourses) * 100 : 0, color: '#F59E0B' },
            { label: 'Critical', pct: summary.totalCourses ? (summary.criticalCount / summary.totalCourses) * 100 : 0, color: '#EF4444' },
          ].map(({ label, pct: p, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-12 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-dk-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${p}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[10px] text-slate-400 w-6 text-right">{Math.round(p)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CourseHealth = () => {
  const { backendURL } = useContext(AppContext)
  const { getToken } = useAuth()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [scores, setScores] = useState<CourseHealthEntry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')

  // Filters
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('score_asc')
  const [page, setPage] = useState(1)

  const fetchHealthScores = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelectedId('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const params: Record<string, string | number> = {
        page,
        limit: 12,
        sort: sortBy,
      }
      if (search.trim()) params.search = search.trim()
      if (severityFilter) params.severity = severityFilter
      if (categoryFilter) params.category = categoryFilter

      const { data } = await axios.get(`${backendURL}/api/admin/course-health`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })

      if (data.success) {
        setScores(data.scores || [])
        setSummary(data.summary || null)
        setCategories(data.categories || [])
        setPagination(data.pagination || null)
      } else {
        throw new Error(data.message || 'Failed to fetch health scores')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [backendURL, getToken, page, sortBy, search, severityFilter, categoryFilter])

  useEffect(() => {
    fetchHealthScores()
  }, [fetchHealthScores])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, severityFilter, categoryFilter, sortBy])

  const selectedEntry = scores.find((s) => s.courseId === selectedId) || null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0D10] p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
            Course Health Score
          </h1>
          <p className="mt-2 text-slate-500 dark:text-dk-text-2">
            AI-powered analysis of each course — scoring completion, quiz performance, engagement, ratings, and more.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchHealthScores}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
          </svg>
          {loading ? 'Analyzing…' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Summary Banner */}
      {summary && <SummaryBanner summary={summary} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <input
            type="text"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-sm text-slate-900 dark:text-dk-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Severity filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-sm text-slate-900 dark:text-dk-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="">All Severities</option>
          <option value="critical">🔴 Critical (&lt;40)</option>
          <option value="warning">🟡 Warning (40–70)</option>
          <option value="healthy">🟢 Healthy (&gt;70)</option>
        </select>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-sm text-slate-900 dark:text-dk-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-sm text-slate-900 dark:text-dk-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="score_asc">Score: Lowest First</option>
          <option value="score_desc">Score: Highest First</option>
          <option value="enrollments_desc">Most Enrolled</option>
          <option value="title_asc">Title A–Z</option>
        </select>

        {/* Active filter chips */}
        {(severityFilter || categoryFilter || search) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSeverityFilter(''); setCategoryFilter('') }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors px-3 py-2 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
            Clear filters
          </button>
        )}

        {pagination && (
          <span className="ml-auto text-xs text-slate-400 dark:text-dk-text-3 shrink-0">
            {pagination.total} course{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Failed to load health scores</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchHealthScores}
              className="mt-3 text-sm font-semibold text-red-700 dark:text-red-400 hover:underline"
            >
              Try again →
            </button>
          </div>
        </div>
      )}

      {/* Score Cards Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !error && scores.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg font-semibold text-slate-700 dark:text-dk-text">No courses match your filters</p>
          <p className="text-sm text-slate-400 dark:text-dk-text-3 mt-1">
            Try adjusting the search or severity filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {scores.map((entry) => (
              <>
                <ScoreCard
                  key={entry.courseId}
                  entry={entry}
                  isSelected={selectedId === entry.courseId}
                  onSelect={setSelectedId}
                />
                <AnimatePresence>
                  {selectedId === entry.courseId && selectedEntry && (
                    <DetailPanel
                      key={`detail-${entry.courseId}`}
                      entry={selectedEntry}
                      onClose={() => setSelectedId('')}
                    />
                  )}
                </AnimatePresence>
              </>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-sm font-medium text-slate-700 dark:text-dk-text hover:bg-slate-50 dark:hover:bg-dk-surface-2 disabled:opacity-40 transition"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-500 dark:text-dk-text-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-sm font-medium text-slate-700 dark:text-dk-text hover:bg-slate-50 dark:hover:bg-dk-surface-2 disabled:opacity-40 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default CourseHealth
