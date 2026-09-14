import { useState, useContext, useCallback, useEffect } from 'react'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import OutreachModal, { type OutreachTarget } from './OutreachModal'

interface CourseSummary {
  courseTitle: string
  category: string
  isPublished: boolean
  enrolledCount: number
  avgRating: number | null
  completionRate: number
  avgQuizScore: number | null
  avgAssignmentScore: number | null
}

interface AiInsights {
  overallAssessment: string
  strengths: string[]
  areasForImprovement: string[]
  coursesNeedingAttention: { courseTitle: string; issue: string }[]
  recommendations: { title: string; detail: string }[]
  performanceRating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical'
}

interface InsightData {
  educatorName: string
  educatorEmail: string
  summary: {
    totalCourses: number
    publishedCourses: number
    totalEnrollments: number
    avgRating: number | null
    avgCompletionRate: number | null
    avgQuizScore: number | null
    avgAssignmentScore: number | null
  }
  courseMetrics: CourseSummary[]
  insights: AiInsights
  noCoursesMessage?: string
}

const buildOutreachDraft = (data: InsightData, educatorId: string): OutreachTarget => {
  const strList = data.insights.strengths.slice(0, 2).map(s => `• ${s}`).join('\n');
  const areaList = data.insights.areasForImprovement.slice(0, 2).map(a => `• ${a}`).join('\n');
  const recList = data.insights.recommendations.map(r => `• ${r.title}`).join('\n');
  const firstName = data.educatorName.split(' ')[0];

  return {
    recipientId: educatorId,
    recipientName: data.educatorName,
    recipientEmail: data.educatorEmail,
    context: 'educator_insights',
    suggestedSubject: `Insights & Performance Review — ${firstName}`,
    suggestedMessage:
`Hi ${firstName},

I recently reviewed your course performance metrics and wanted to share some insights with you.

You're doing great in these areas:
${strList}

There are a few areas we think could use some attention:
${areaList}

Based on this, here are some actionable recommendations:
${recList}

Let me know if you'd like to chat about any of this!

Best,
LearnSphereAI Admin Team`,
  };
};

const ratingColors: Record<string, string> = {
  Excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Needs Improvement': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const Stat = ({ label, value }: { label: string; value: string | number | null }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</span>
    <span className="text-base font-bold text-slate-800 dark:text-slate-100">
      {value === null || value === undefined ? 'N/A' : value}
    </span>
  </div>
)

interface Props {
  educatorId: string
  educatorName: string
  onClose: () => void
}

const EducatorInsightsPanel = ({ educatorId, educatorName, onClose }: Props) => {
  const { backendURL, getToken } = useContext(AppContext)
  const [data, setData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'insights' | 'courses'>('insights')
  const [outreachTarget, setOutreachTarget] = useState<OutreachTarget | null>(null)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const token = await getToken()
      const res = await axios.get(`${backendURL}/api/admin/educator-insights/${educatorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data.success) {
        setData(res.data.data)
      } else {
        throw new Error(res.data.message || 'Failed to fetch insights')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [educatorId, backendURL, getToken])

  // Auto-fetch on mount
  useEffect(() => { fetchInsights() }, [fetchInsights])

  return (
    <>
      {outreachTarget && (
        <OutreachModal target={outreachTarget} onClose={() => setOutreachTarget(null)} />
      )}
      
      <div className="mt-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10 shadow-sm overflow-hidden relative">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-blue-100 dark:border-blue-900/30 bg-white/70 dark:bg-dk-surface/70 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-blue-500 text-lg">✦</span>
            <div>
              <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-widest">AI Insights</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{educatorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchInsights}
              disabled={loading}
              title="Regenerate insights"
              className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : '↻ Refresh'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dk-border transition"
              title="Close insights"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Gemini is analyzing educator data…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={fetchInsights} className="text-xs text-blue-600 underline">Try again</button>
            </div>
          )}

          {!loading && !error && data?.noCoursesMessage && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">{data.noCoursesMessage}</p>
          )}

          {!loading && !error && data && !data.noCoursesMessage && (
            <>
              {/* Summary stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-5 bg-white/80 dark:bg-dk-surface/60 rounded-xl p-4 border border-slate-100 dark:border-dk-border">
                <Stat label="Courses" value={data.summary.totalCourses} />
                <Stat label="Published" value={data.summary.publishedCourses} />
                <Stat label="Enrollments" value={data.summary.totalEnrollments} />
                <Stat label="Avg Rating" value={data.summary.avgRating !== null ? `${data.summary.avgRating} ★` : null} />
                <Stat label="Completion" value={data.summary.avgCompletionRate !== null ? `${data.summary.avgCompletionRate}%` : null} />
                <Stat label="Quiz Score" value={data.summary.avgQuizScore !== null ? `${data.summary.avgQuizScore}%` : null} />
                <Stat label="Assignment" value={data.summary.avgAssignmentScore !== null ? `${data.summary.avgAssignmentScore}%` : null} />
              </div>

              {/* Tab switcher */}
              <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-dk-surface p-1 rounded-xl w-fit">
                {(['insights', 'courses'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      tab === t
                        ? 'bg-white dark:bg-dk-surface-2 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {t === 'insights' ? 'AI Insights' : 'Course Breakdown'}
                  </button>
                ))}
              </div>

              {/* ── INSIGHTS TAB ── */}
              {tab === 'insights' && data.insights && (
                <div className="space-y-4">
                  {/* Rating badge + assessment */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <span className={`self-start px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${ratingColors[data.insights.performanceRating] || ratingColors['Good']}`}>
                      {data.insights.performanceRating}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{data.insights.overallAssessment}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2.5">Strengths</h4>
                      <ul className="space-y-1.5">
                        {data.insights.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                            <span className="text-emerald-500 shrink-0">✓</span>
                            <span className="leading-snug">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for improvement */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2.5">Areas for Improvement</h4>
                      <ul className="space-y-1.5">
                        {data.insights.areasForImprovement.map((a, i) => (
                          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
                            <span className="text-amber-500 shrink-0">▲</span>
                            <span className="leading-snug">{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Courses needing attention */}
                  {data.insights.coursesNeedingAttention.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-2.5">Courses Needing Attention</h4>
                      <ul className="space-y-2">
                        {data.insights.coursesNeedingAttention.map((c, i) => (
                          <li key={i} className="flex flex-col sm:flex-row sm:items-start gap-1">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 min-w-[160px]">{c.courseTitle}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{c.issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2.5">Admin Recommendations</h4>
                    <div className="space-y-3">
                      {data.insights.recommendations.map((r, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{r.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notify Educator Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setOutreachTarget(buildOutreachDraft(data, educatorId))}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow-sm"
                    >
                      <span>📬</span> Notify Educator
                    </button>
                  </div>
                </div>
              )}

              {/* ── COURSES TAB ── */}
              {tab === 'courses' && (
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-dk-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-dk-surface text-left">
                        {['Course', 'Status', 'Enrollments', 'Rating', 'Completion', 'Quiz Avg', 'Assignment Avg'].map((col) => (
                          <th key={col} className="px-3 py-2.5 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dk-border">
                      {data.courseMetrics.map((c, i) => (
                        <tr key={i} className="bg-white dark:bg-dk-surface hover:bg-slate-50 dark:hover:bg-dk-surface-2 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={c.courseTitle}>{c.courseTitle}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                              {c.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{c.enrolledCount}</td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{c.avgRating !== null ? `${c.avgRating} ★` : '—'}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${c.completionRate >= 60 ? 'bg-emerald-500' : c.completionRate >= 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width: `${c.completionRate}%` }}
                                />
                              </div>
                              <span className="text-slate-600 dark:text-slate-400">{c.completionRate}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{c.avgQuizScore !== null ? `${c.avgQuizScore}%` : '—'}</td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{c.avgAssignmentScore !== null ? `${c.avgAssignmentScore}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default EducatorInsightsPanel

