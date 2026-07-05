import AdminSection from '../../components/admin/AdminSection'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
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

const COLORS = ['#2563EB', '#22C55E', '#F59E0B']

const Analytics = () => {
  const { adminOverview } = useContext(AppContext)
  const analyticsTrend = adminOverview.analytics?.trend || []
  const analyticsBreakdown = adminOverview.analytics?.breakdown || []
  const topCourses = adminOverview.analytics?.topCourses || []

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Track platform growth, content momentum, and learner activity trends.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSection title="Growth Trends" description="Students, courses, and enrollments over time.">
          {analyticsTrend.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Line type="monotone" dataKey="students" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="courses" stroke="#14B8A6" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="enrollments" stroke="#22C55E" strokeWidth={3} dot={{ r: 3 }} />
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
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                    {analyticsBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
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
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCourses} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" width={140} />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#2563EB" radius={[0, 8, 8, 0]} />
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
