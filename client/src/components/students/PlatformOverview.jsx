import React, { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const PlatformOverview = () => {
  const { platformHomeData } = useContext(AppContext)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-16 max-w-[1400px] mx-auto space-y-12">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {platformHomeData.stats ? (
          [
            { label: 'Active Students', value: platformHomeData.stats.totalStudents, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Expert Educators', value: platformHomeData.stats.totalEducators, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Curated Courses', value: platformHomeData.stats.totalCourses, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
            { label: 'Total Enrollments', value: platformHomeData.stats.totalEnrollments, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${stat.bg}`} />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold font-space-grotesk ${stat.color} dark:text-white`}>{stat.value}</p>
            </motion.div>
          ))
        ) : null}
      </div>

      {/* Categories & Announcements Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Categories */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white">Explore Categories</h2>
            <div className="h-1 w-12 bg-blue-600 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            {platformHomeData.categories.length > 0 ? (
              platformHomeData.categories.map((category) => (
                <span 
                  key={category.name} 
                  className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {category.name} <span className="ml-1 opacity-60">({category.count})</span>
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No categories are available yet.</p>
            )}
          </div>
        </motion.div>

        {/* Announcements */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white">Platform Updates</h2>
            <div className="h-1 w-12 bg-indigo-600 rounded-full" />
          </div>
          <div className="space-y-4">
            {platformHomeData.announcements.length > 0 ? (
              platformHomeData.announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="group rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-4 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {announcement.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {announcement.message}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No announcements published yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PlatformOverview