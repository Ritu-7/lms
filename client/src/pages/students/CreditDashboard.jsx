import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
  CreditCard, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  History, 
  Cpu 
} from 'lucide-react';

// Mock Data
const creditStats = {
  total: 5000,
  used: 1250,
  remaining: 3750,
};

const usageData = [
  { day: '1 Oct', usage: 45 },
  { day: '2 Oct', usage: 80 },
  { day: '3 Oct', usage: 60 },
  { day: '4 Oct', usage: 120 },
  { day: '5 Oct', usage: 90 },
  { day: '6 Oct', usage: 150 },
  { day: '7 Oct', usage: 110 },
];

const recentActivity = [
  { id: 1, action: 'PDF Summary', cost: 15, time: '2 hours ago', icon: <Cpu className="w-4 h-4" /> },
  { id: 2, action: 'Notes Generation', cost: 25, time: '5 hours ago', icon: <Zap className="w-4 h-4" /> },
  { id: 3, action: 'Quiz Generation', cost: 40, time: 'Yesterday', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 4, action: 'Video Insight', cost: 20, time: '2 days ago', icon: <Cpu className="w-4 h-4" /> },
  { id: 5, action: 'Essay Critique', cost: 30, time: '3 days ago', icon: <TrendingUp className="w-4 h-4" /> },
];

const transactions = [
  { id: 'TX1024', date: '2026-06-15', amount: '$29.00', credits: '+1000', status: 'Completed' },
  { id: 'TX1012', date: '2026-05-12', amount: '$49.00', credits: '+2000', status: 'Completed' },
  { id: 'TX0988', date: '2026-04-01', amount: '$19.00', credits: '+500', status: 'Completed' },
];

const pricingPlans = [
  {
    name: 'Basic',
    price: 'Free',
    credits: '1,000 / mo',
    features: ['Standard AI Models', 'PDF Summary', '5 Projects'],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29 / mo',
    credits: '5,000 / mo',
    features: ['Advanced AI Models', 'Priority Processing', 'Unlimited Projects', 'Custom Notes'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$99 / mo',
    credits: '20,000 / mo',
    features: ['Custom Model Training', 'Dedicated Support', 'API Access', 'Team Collaboration'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const COLORS = ['#2563EB', '#E5E7EB'];

const CreditDashboard = () => {
  const progressData = [
    { name: 'Used', value: creditStats.used },
    { name: 'Remaining', value: creditStats.remaining },
  ];

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8 pt-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Credit Balance & Usage</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your AI credits and monitor your consumption trends.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm">
          <CreditCard className="w-4 h-4" />
          Top Up Credits
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Current Credits</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{creditStats.total.toLocaleString()}</p>
            <div className="mt-4 flex items-center text-xs text-blue-600 font-medium">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +20% from last month
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Credits Used</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{creditStats.used.toLocaleString()}</p>
            <p className="mt-4 text-xs text-gray-400">25% of total quota</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Credits Remaining</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{creditStats.remaining.toLocaleString()}</p>
            <p className="mt-4 text-xs text-gray-400">Valid until next cycle</p>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center relative">
          <p className="text-sm font-medium text-gray-500 absolute top-6">Usage Progress</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-800">{Math.round((creditStats.remaining / creditStats.total) * 100)}%</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: AI Usage & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-800">Usage Trend</h3>
              <p className="text-xs text-gray-500">Credits consumed over the last 7 days</p>
            </div>
            <div className="flex gap-2">
               <span className="flex items-center gap-1 text-xs text-gray-500">
                 <div className="w-2 h-2 rounded-full bg-blue-600" /> Credits
               </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#9CA3AF'}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#9CA3AF'}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#2563EB" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorUsage)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent AI Usage */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-800">Recent AI Usage</h3>
          </div>
          <div className="flex flex-col gap-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.action}</p>
                    <p className="text-[11px] text-gray-400">{item.time}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">-{item.cost}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
            View Full History
          </button>
        </div>
      </div>

      {/* Bottom Row: Subscriptions & Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pricing Cards */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingPlans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`p-6 rounded-xl border transition-all flex flex-col ${
                plan.highlight 
                ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600 scale-105 z-10' 
                : 'border-gray-200 bg-white'
              }`}
            >
              <p className={`text-sm font-bold uppercase tracking-wider ${plan.highlight ? 'text-blue-600' : 'text-gray-500'}`}>
                {plan.name}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-800">{plan.price}</span>
                {plan.price !== 'Free' && <span className="text-sm text-gray-500">/mo</span>}
              </div>
              <p className="text-sm font-medium text-gray-600 mt-1">{plan.credits}</p>
              
              <div className="mt-6 flex flex-col gap-3 mb-8">
                {plan.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    {feat}
                  </div>
                ))}
              </div>

              <button className={`mt-auto py-2.5 rounded-lg font-medium transition-all ${
                plan.highlight 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-800">Billing History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="group">
                    <td className="py-3 text-gray-600">{tx.date}</td>
                    <td className="py-3 font-medium text-gray-800">{tx.amount}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditDashboard;
