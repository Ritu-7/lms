import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
  Zap, 
  Trophy, 
  TrendingUp, 
  Flame, 
  Clock, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  ArrowUpRight, 
  Search, 
  LayoutDashboard, 
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Mock Data ---
const usageKPIs = {
  totalConsumed: 1250,
  topTool: 'PDF Summarizer',
  efficiencyScore: 88,
  activeStreak: 12,
};

const weeklyUsage = [
  { day: 'Mon', credits: 120 },
  { day: 'Tue', credits: 180 },
  { day: 'Wed', credits: 150 },
  { day: 'Thu', credits: 210 },
  { day: 'Fri', credits: 160 },
  { day: 'Sat', credits: 90 },
  { day: 'Sun', credits: 70 },
];

const monthlyUsage = [
  { month: 'May', credits: 850 },
  { month: 'Jun', credits: 1100 },
  { month: 'Jul', credits: 1400 },
  { month: 'Aug', credits: 1200 },
  { month: 'Sep', credits: 1600 },
  { month: 'Oct', credits: 1250 },
];

const toolDistribution = [
  { name: 'PDF Summary', value: 450, color: '#2563EB' },
  { name: 'Quiz Gen', value: 300, color: '#0EA5E9' },
  { name: 'Note Taker', value: 250, color: '#6366F1' },
  { name: 'Code Helper', value: 200, color: '#8B5CF6' },
  { name: 'Study Guide', value: 50, color: '#A855F7' },
];

const courseEngagement = [
  { course: 'Full Stack Web Dev', usage: 450 },
  { course: 'Advanced React', usage: 320 },
  { course: 'Node.js Mastery', usage: 210 },
  { course: 'UI/UX Design', usage: 140 },
  { course: 'System Design', usage: 80 },
];

const AIUsageAnalytics = () => {
  const [timeFrame, setTimeFrame] = useState('weekly');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">AI Usage Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Deep dive into your AI interaction patterns and learning efficiency.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search activities..." 
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Credits Consumed', value: usageKPIs.totalConsumed, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', delta: '+12%' },
          { label: 'Most Used Tool', value: usageKPIs.topTool, icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Efficiency Score', value: `${usageKPIs.efficiencyScore}%`, icon: Trophy, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20' },
          { label: 'Active Streak', value: `${usageKPIs.activeStreak} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white">{stat.value}</p>
                {stat.delta && <span className="text-xs font-semibold text-emerald-600 flex items-center"><ArrowUpRight className="w-3 h-3" /> {stat.delta}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Consumption Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-white">Consumption Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track your AI spending patterns over time.</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Area type="monotone" dataKey="credits" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCredits)" />
                </AreaChart>
              ) : (
                <BarChart data={monthlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="credits" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tool Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold font-space-grotesk text-slate-900 dark:text-white">Tool Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Which AI tools are you utilizing most?</p>
          </div>
          <div className="flex-grow h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={toolDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {toolDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {toolDistribution.map((tool, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tool.color }} />
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIUsageAnalytics;
