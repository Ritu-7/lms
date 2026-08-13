import AdminSection from '../../components/admin/AdminSection'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B']

const Analytics = () => {
  const { adminOverview } = useContext(AppContext)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const analyticsTrend = adminOverview.analytics?.trend || []
  const analyticsBreakdown = adminOverview.analytics?.breakdown || []
  const topCourses = adminOverview.analytics?.topCourses || []

  // Dynamic Chart Colors
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB'
  const axisColor = isDark ? '#71717A' : '#6B7280'
  const tooltipStyle = {
    backgroundColor: isDark ? '#18181B' : '#FFFFFF',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
    color: isDark ? '#FAFAFA' : '#111827',
  }

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10]">
      <div>
        <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Analytics</h1>
        <p className="mt-2 text-slate-500 dark:text-dk-text-2">Track platform growth, content momentum, and learner activity trends.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSection title="Growth Trends" description="Students, courses, and enrollments over time.">
          {analyticsTrend.length > 0 ? (
            <div className="h-80 w-full rounded-xl bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={axisColor} tick={{ fill: axisColor }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="courses" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="enrollments" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState
              title="No analytics data connected"
              description="Connect backend analytics endpoints to render growth trends here."
            />
          )}
        </AdminSection>

        <AdminSection title="Learner Breakdown" description="Active, pending, and suspended user mix.">
          {analyticsBreakdown.length > 0 ? (
            <div className="h-80 w-full rounded-xl bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4} stroke="none">
                    {analyticsBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState
              title="No breakdown data connected"
              description="Provide learner status data to visualize the distribution here."
            />
          )}
        </AdminSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminSection title="Top Courses" description="Highest performing courses by enrollments.">
          {topCourses.length > 0 ? (
            <div className="h-80 w-full rounded-xl bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCourses} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor }} />
                  <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fill: axisColor }} width={140} />
                  <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="enrollments" fill="#3B82F6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState
              title="No course ranking data connected"
              description="Connect course performance data to render the top courses chart."
            />
          )}
        </AdminSection>

        <AdminSection title="Key Metrics" description="Quick operational indicators.">
          <AdminEmptyState
            title="No key metrics connected"
            description="Connect backend analytics to show platform KPIs in this panel."
          />
        </AdminSection>
      </div>
    </div>
  )
}

export default Analytics

