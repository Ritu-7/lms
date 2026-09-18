import React, { useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Users,
  BookOpen,
  DollarSign,
  Award,
  Calendar,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
} from 'lucide-react'

import AdminSection from '../../components/admin/AdminSection'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminAIInsights from '../../components/admin/AdminAIInsights'
import AdminAIRecommendations from '../../components/admin/AdminAIRecommendations'
import { AppContext } from '../../context/AppContext'
import { useTheme } from '../../contexts/ThemeContext'

// Color Palette for Charts & Badges
const BREAKDOWN_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']
const BAR_GRADIENTS = [
  '#3B82F6',
  '#60A5FA',
  '#10B981',
  '#34D399',
  '#8B5CF6',
]

const DATE_RANGES = ['Last 30 Days', 'Last 90 Days', 'Last 6 Months']

// Custom Tooltip Component for Charts
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 dark:border-dk-border bg-white dark:bg-dk-surface backdrop-blur-md p-3.5 shadow-xl text-xs space-y-1.5">
        <p className="font-bold text-slate-800 dark:text-dk-text font-space-grotesk border-b border-slate-100 dark:border-dk-border pb-1">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-dk-text-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900 dark:text-dk-text">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const Analytics = () => {
  const { adminOverview } = useContext(AppContext)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [dateRange, setDateRange] = useState('Last 6 Months')
  const [showDropdown, setShowDropdown] = useState(false)

  // Series visibility state for Growth Trends Chart
  const [visibleSeries, setVisibleSeries] = useState({
    students: true,
    courses: true,
    enrollments: true,
  })

  const toggleSeries = (key: 'students' | 'courses' | 'enrollments') => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Data from AppContext or graceful defaults
  const analyticsTrend = adminOverview.analytics?.trend || [
    { month: 'Jan', students: 85, courses: 12, enrollments: 140 },
    { month: 'Feb', students: 120, courses: 15, enrollments: 190 },
    { month: 'Mar', students: 190, courses: 18, enrollments: 270 },
    { month: 'Apr', students: 240, courses: 22, enrollments: 340 },
    { month: 'May', students: 310, courses: 28, enrollments: 420 },
    { month: 'Jun', students: 450, courses: 35, enrollments: 580 },
  ]

  const analyticsBreakdown = adminOverview.analytics?.breakdown || [
    { name: 'Students', value: 1240 },
    { name: 'Educators', value: 85 },
    { name: 'Admins', value: 8 },
  ]

  const topCourses = adminOverview.analytics?.topCourses || [
    { name: 'Full-Stack React & Node', enrollments: 340 },
    { name: 'Python for Data Science', enrollments: 280 },
    { name: 'UI/UX Design Masterclass', enrollments: 210 },
    { name: 'DevOps & Kubernetes', enrollments: 175 },
    { name: 'Cyber Security Essentials', enrollments: 140 },
  ]

  const stats = adminOverview.stats || {}
  const totalStudents = stats.totalStudents || 1240
  const totalCourses = stats.totalCourses || 35
  const totalRevenue = stats.totalRevenue || '42,850'
  const totalBreakdownCount = analyticsBreakdown.reduce((sum: number, item: any) => sum + item.value, 0)

  // Dynamic Chart Styling Colors
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'
  const axisColor = isDark ? '#71717A' : '#94A3B8'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] transition-colors"
    >
      {/* Page Header + Global Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text tracking-tight flex items-center gap-3">
            Analytics & Reports
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
              Live
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-dk-text-2 max-w-xl">
            Track platform growth, content momentum, and learner activity trends.
          </p>
        </div>

        {/* Global Date Range Filter */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-dk-surface border border-slate-200/80 dark:border-dk-border text-slate-700 dark:text-dk-text hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-slate-200/80 dark:border-dk-border bg-white dark:bg-dk-surface shadow-xl z-30 overflow-hidden p-1.5">
              {DATE_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range)
                    setShowDropdown(false)
                  }}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-dk-text-2 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <AdminStatCard
          label="Total Students"
          value={totalStudents}
          trend={{ value: '+12.4%', positive: true }}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <AdminStatCard
          label="Active Courses"
          value={totalCourses}
          trend={{ value: '+8.2%', positive: true }}
          icon={<BookOpen className="w-5 h-5" />}
          color="emerald"
        />
        <AdminStatCard
          label="Total Revenue"
          value={totalRevenue}
          prefix="$"
          trend={{ value: '+15.3%', positive: true }}
          icon={<DollarSign className="w-5 h-5" />}
          color="purple"
        />
        <AdminStatCard
          label="Completion Rate"
          value={78.4}
          suffix="%"
          trend={{ value: '+4.1%', positive: true }}
          icon={<Award className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Row 1: Growth Trends & Learner Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Growth Trends Chart */}
        <AdminSection
          title="Growth Trends"
          description="Students, courses, and enrollments over time."
          actions={
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => toggleSeries('students')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                  visibleSeries.students
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Students
              </button>
              <button
                type="button"
                onClick={() => toggleSeries('courses')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                  visibleSeries.courses
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Courses
              </button>
              <button
                type="button"
                onClick={() => toggleSeries('enrollments')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
                  visibleSeries.enrollments
                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Enrollments
              </button>
            </div>
          }
        >
          {analyticsTrend.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientCourses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientEnrollments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />

                  {visibleSeries.students && (
                    <Area
                      type="monotone"
                      dataKey="students"
                      name="Students"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradientStudents)"
                      isAnimationActive={true}
                    />
                  )}
                  {visibleSeries.courses && (
                    <Area
                      type="monotone"
                      dataKey="courses"
                      name="Courses"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradientCourses)"
                      isAnimationActive={true}
                    />
                  )}
                  {visibleSeries.enrollments && (
                    <Area
                      type="monotone"
                      dataKey="enrollments"
                      name="Enrollments"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gradientEnrollments)"
                      isAnimationActive={true}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState
              title="No analytics data connected"
              description="Connect backend analytics endpoints to render growth trends here."
              icon={<BarChart3 className="w-7 h-7" />}
              actionLabel="Connect Analytics"
            />
          )}
        </AdminSection>

        {/* Learner Breakdown (Donut Chart) */}
        <AdminSection title="Learner Breakdown" description="Active distribution across platform roles.">
          {analyticsBreakdown.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 h-80">
              {/* Donut Chart with Center Text */}
              <div className="relative w-full md:w-1/2 h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={105}
                      paddingAngle={5}
                      stroke="none"
                      isAnimationActive={true}
                    >
                      {analyticsBreakdown.map((entry: any, index: number) => (
                        <Cell
                          key={entry.name}
                          fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]}
                          className="hover:opacity-85 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Label inside Donut */}
                <div className="absolute pointer-events-none text-center">
                  <p className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
                    {totalBreakdownCount.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-dk-text-3 uppercase tracking-wider">
                    Total Users
                  </p>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="w-full md:w-1/2 space-y-3 px-2">
                {analyticsBreakdown.map((entry: any, index: number) => {
                  const color = BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]
                  const pct = totalBreakdownCount > 0 ? ((entry.value / totalBreakdownCount) * 100).toFixed(1) : 0
                  return (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dk-surface-2 border border-slate-100 dark:border-dk-border hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-dk-text">
                          {entry.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-dk-text mr-2">
                          {entry.value.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-dk-text-3">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <AdminEmptyState
              title="No breakdown data connected"
              description="Provide learner status data to visualize the distribution here."
              icon={<PieChartIcon className="w-7 h-7" />}
              actionLabel="Connect Analytics"
            />
          )}
        </AdminSection>
      </div>

      {/* Row 2: Top Courses & Key Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Top Courses (Horizontal Bar Chart) */}
        <AdminSection title="Top Courses" description="Highest performing courses by enrollments.">
          {topCourses.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCourses} layout="vertical" margin={{ top: 10, right: 35, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={axisColor}
                    tick={{ fill: isDark ? '#FAFAFA' : '#1E293B', fontSize: 12 }}
                    width={150}
                  />
                  <Tooltip cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }} content={<CustomTooltip isDark={isDark} />} />
                  <Bar dataKey="enrollments" radius={[0, 8, 8, 0]} isAnimationActive={true}>
                    {topCourses.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={BAR_GRADIENTS[index % BAR_GRADIENTS.length]} />
                    ))}
                    <LabelList
                      dataKey="enrollments"
                      position="right"
                      fill={isDark ? '#A1A1AA' : '#64748B'}
                      fontSize={12}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <AdminEmptyState
              title="No course ranking data connected"
              description="Connect course performance data to render the top courses chart."
              icon={<Layers className="w-7 h-7" />}
              actionLabel="Connect Analytics"
            />
          )}
        </AdminSection>

        {/* Key Metrics — Redesigned Empty State */}
        <AdminSection title="Key Metrics" description="Quick operational indicators.">
          <AdminEmptyState
            title="No key metrics connected"
            description="Connect backend analytics endpoints to visualize platform KPIs and engagement indicators in this panel."
            icon={<Sparkles className="w-7 h-7" />}
            actionLabel="Connect Analytics"
            onAction={() => alert('Connect analytics integration selected.')}
          />
        </AdminSection>
      </div>

      {/* AI Insights — Isolated Panel */}
      <AdminAIInsights />

      {/* AI Platform Recommendations — Isolated Panel */}
      <AdminAIRecommendations />
    </motion.div>
  )
}

export default Analytics
