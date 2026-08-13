import React, { useEffect, useState, useContext } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Zap, Trophy, TrendingUp, Flame, ArrowUpRight, Search, Calendar, Loader2, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { AppContext } from '../../context/AppContext'
import { aiGetRequest } from '../../utils/aiClient'

const COLORS = ['#2563EB', '#0EA5E9', '#6366F1', '#8B5CF6', '#A855F7']

const AIUsageAnalytics = () => {
  const [timeFrame, setTimeFrame] = useState('weekly')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
  const { getToken } = useContext(AppContext)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { analytics: data } = await aiGetRequest({
          backendURL,
          getToken,
          path: '/api/ai/analytics',
          retries: 1,
        })
        setAnalytics(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [backendURL, getToken])

  const usageKPIs = analytics
    ? {
        totalConsumed: analytics.totalOutputLength || 0,
        topTool: analytics.byFeature?.[0]?.feature || 'No data',
        efficiencyScore: analytics.successRate || 0,
        activeStreak: analytics.totalRequests || 0,
      }
    : null

  const weeklyUsage = analytics?.byDay?.map((item) => ({ day: item.date?.slice(-2) || '—', credits: item.count })) || []
  const monthlyUsage = analytics?.byDay?.map((item) => ({ month: item.date?.slice(5, 7) || '—', credits: item.count })) || []
  const toolDistribution = analytics?.byFeature?.map((item, index) => ({ name: item.feature, value: item.count, color: COLORS[index % COLORS.length] })) || []
  const hasData = Boolean(analytics?.totalRequests)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dk-base p-6 lg:p-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">AI Usage Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-2">Deep dive into your AI interaction patterns and learning efficiency.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search activities..." className="pl-9 pr-4 py-2 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <button className="bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Calendar className="w-5 h-5 text-slate-600 dark:text-dk-text-2" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500"><Loader2 className="animate-spin" size={16} />Loading real AI activity…</div>
      ) : error ? (
        <div className="flex items-center gap-3 text-rose-600 bg-white dark:bg-dk-surface border border-rose-200 dark:border-rose-900/40 rounded-2xl px-4 py-3"><AlertTriangle size={16} />{error}</div>
      ) : !hasData ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-dk-border bg-white dark:bg-dk-surface px-6 py-14 text-center text-slate-500 dark:text-dk-text-2">
          No AI activity is available yet. Use the AI Tutor, summaries, or coding assistant to populate this dashboard.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Credits Consumed', value: usageKPIs.totalConsumed, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', delta: analytics.successRate ? `+${analytics.successRate}% success rate` : null },
              { label: 'Most Used Tool', value: usageKPIs.topTool, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Efficiency Score', value: `${usageKPIs.efficiencyScore}%`, icon: Trophy, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
              { label: 'Active Requests', value: usageKPIs.activeStreak, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-dk-surface p-6 rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm flex items-center gap-4">
                <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}><stat.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-dk-text-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">{stat.value}</p>
                    {stat.delta && <span className="text-xs font-semibold text-emerald-600 flex items-center"><ArrowUpRight className="w-3 h-3" /> {stat.delta}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white dark:bg-dk-surface p-6 rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Consumption Trend</h3>
                  <p className="text-xs text-slate-500 dark:text-dk-text-2">Track your AI usage over time.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-dk-surface-2 p-1 rounded-xl">
                  <button onClick={() => setTimeFrame('weekly')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeFrame === 'weekly' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}>Weekly</button>
                  <button onClick={() => setTimeFrame('monthly')} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${timeFrame === 'monthly' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}>Monthly</button>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {timeFrame === 'weekly' ? (
                    <AreaChart data={weeklyUsage}>
                      <defs>
                        <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Area type="monotone" dataKey="credits" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCredits)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={monthlyUsage}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                      <Bar dataKey="credits" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-dk-surface p-6 rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Tool Distribution</h3>
                <p className="text-xs text-slate-500 dark:text-dk-text-2">Which AI tools are you utilizing most?</p>
              </div>
              <div className="flex-grow h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={toolDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {toolDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {toolDistribution.map((tool, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tool.color }} />
                    <span className="text-xs text-slate-600 dark:text-dk-text-2 truncate">{tool.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dk-surface rounded-2xl border border-slate-200 dark:border-dk-border shadow-sm p-6">
            <h3 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-dk-text mb-4">Recent AI Activity</h3>
            {analytics.recent?.length ? (
              <div className="grid gap-3">
                {analytics.recent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-dk-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-dk-text">{item.title || item.feature}</p>
                      <p className="text-xs text-slate-400">{item.feature} · {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">{item.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No activity entries yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AIUsageAnalytics
