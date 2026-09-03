import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'
import { Search, BookOpen, TrendingUp, Sparkles, ArrowRight, Check } from 'lucide-react'

const PlatformOverview = () => {
  const { platformHomeData } = useContext(AppContext)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-16 max-w-[1400px] mx-auto space-y-20">
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
              className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 h-24 w-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${stat.bg}`} />
              <p className="text-sm font-medium text-slate-500 dark:text-dk-text-2">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold font-space-grotesk ${stat.color} dark:text-dk-text`}>{stat.value}</p>
            </motion.div>
          ))
        ) : null}
      </div>

      {/* How LearnSphereAI Works Section */}
      <div className="relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text tracking-tight">How LearnSphereAI Works</h2>
          <p className="mt-3 text-lg text-slate-500 dark:text-dk-text-2 font-medium">A smarter way to learn, practice, and grow.</p>
        </div>

        {/* 3 Steps Cards */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-10">
          {/* Dashed line background (desktop) */}
          <div className="hidden md:block absolute top-[44px] left-[16%] right-[16%] h-0 border-t-2 border-dashed border-blue-200 dark:border-blue-900/40 z-0 pointer-events-none" />

          {/* Step 1: Choose */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 flex flex-col mt-4 md:mt-0">
            <div className="flex flex-col items-center h-full">
              {/* Icon Circle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-50/90 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center mb-0 relative z-10 shadow-inner">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              </div>
              {/* Badge */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-dk-base relative z-20 -mb-5">01</div>
              {/* Card Content */}
              <div className="w-full h-full rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-dk-border bg-white dark:bg-dk-surface pt-10 pb-6 px-5 sm:px-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 font-space-grotesk">Choose</h3>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-dk-text-2 leading-relaxed max-w-[260px] mx-auto">Discover courses that match your goals and interests.</p>
                </div>
                {/* Custom Graphic */}
                <div className="mt-8 w-full max-w-[260px] rounded-xl bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100/90 dark:border-blue-900/30 p-3.5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-11 shrink-0 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/50">
                      <svg className="w-4 h-4 text-blue-500 fill-blue-500 ml-0.5" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-2 w-full bg-blue-200/90 dark:bg-blue-800/80 rounded-full"></div>
                      <div className="h-1.5 w-2/3 bg-blue-100 dark:bg-blue-900/50 rounded-full"></div>
                      <div className="h-1.5 w-3/4 bg-blue-100 dark:bg-blue-900/50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[1,2,3,4].map(i => <div key={i} className="h-6 rounded-md bg-blue-100/70 dark:bg-blue-900/40 border border-blue-200/40 dark:border-blue-800/30"></div>)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 2: Learn */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="relative z-10 flex flex-col mt-4 md:mt-0">
            <div className="flex flex-col items-center h-full">
              {/* Icon Circle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-50/90 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center mb-0 relative z-10 shadow-inner">
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500 dark:text-emerald-400" strokeWidth={2} />
              </div>
              {/* Badge */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-dk-base relative z-20 -mb-5">02</div>
              {/* Card Content */}
              <div className="w-full h-full rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-dk-border bg-white dark:bg-dk-surface pt-10 pb-6 px-5 sm:px-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-emerald-500 dark:text-emerald-400 font-space-grotesk">Learn</h3>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-dk-text-2 leading-relaxed max-w-[260px] mx-auto">Learn with engaging lessons, hands-on practice, and assessments.</p>
                </div>
                {/* Custom Graphic */}
                <div className="mt-8 w-full max-w-[260px] rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100/90 dark:border-emerald-900/30 p-3.5 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 shrink-0 rounded-lg bg-emerald-100/90 dark:bg-emerald-900/40 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/50">
                      <svg className="w-5 h-5 text-emerald-500 fill-emerald-500 ml-0.5" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-2 w-full bg-emerald-200/90 dark:bg-emerald-800/80 rounded-full"></div>
                      <div className="h-1.5 w-2/3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full"></div>
                      <div className="h-1.5 w-4/5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full mt-4 overflow-hidden flex">
                    <div className="w-3/5 h-full bg-emerald-400 dark:bg-emerald-500 rounded-full"></div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-dk-surface">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 3: Grow */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="relative z-10 flex flex-col mt-4 md:mt-0">
            <div className="flex flex-col items-center h-full">
              {/* Icon Circle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-50/90 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 flex items-center justify-center mb-0 relative z-10 shadow-inner">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" strokeWidth={2} />
              </div>
              {/* Badge */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600 text-white font-bold text-sm sm:text-base flex items-center justify-center shadow-md ring-4 ring-white dark:ring-dk-base relative z-20 -mb-5">03</div>
              {/* Card Content */}
              <div className="w-full h-full rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-dk-border bg-white dark:bg-dk-surface pt-10 pb-6 px-5 sm:px-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 font-space-grotesk">Grow</h3>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-dk-text-2 leading-relaxed max-w-[260px] mx-auto">Track your progress, earn certificates, and get AI support.</p>
                </div>
                {/* Custom Graphic */}
                <div className="mt-8 w-full max-w-[260px] rounded-xl bg-purple-50/60 dark:bg-purple-900/10 border border-purple-100/90 dark:border-purple-900/30 p-3.5 flex items-center justify-between min-h-[76px]">
                  <div className="space-y-2 flex-1 mr-4">
                    <div className="h-2 w-full bg-purple-200/90 dark:bg-purple-800/80 rounded-full"></div>
                    <div className="h-1.5 w-2/3 bg-purple-100 dark:bg-purple-900/50 rounded-full"></div>
                    <div className="h-1.5 w-4/5 bg-purple-100 dark:bg-purple-900/50 rounded-full"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="relative">
                      <svg className="w-8 h-8 text-purple-400 dark:text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15.228l-4.326 2.274.826-4.817L4.996 9.27l4.836-.703L12 4.186l2.168 4.382 4.836.703-3.504 3.415.826 4.817z"/></svg>
                    </div>
                    <div className="flex items-end gap-1 ml-2.5 h-8">
                      <div className="w-1.5 h-3 bg-purple-300 dark:bg-purple-700 rounded-t-sm"></div>
                      <div className="w-1.5 h-5 bg-purple-400 dark:bg-purple-500 rounded-t-sm"></div>
                      <div className="w-1.5 h-7 bg-purple-500 dark:bg-purple-400 rounded-t-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>


      </div>

      {/* Platform Updates Section */}
      <div className="pt-6">
        <div className="text-center mb-8 relative flex flex-col sm:block">
          <h2 className="text-2xl sm:text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text tracking-tight">Platform Updates</h2>
          <Link to="/announcements" className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 mt-3 sm:mt-0 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1.5">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {platformHomeData.announcements.length > 0 ? (
            platformHomeData.announcements.slice(0, 3).map((announcement) => (
              <Link 
                key={announcement.id || announcement._id} 
                to="/announcements"
                className="group rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 transition-all hover:shadow-md hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-900/50 flex flex-col"
              >
                <p className="font-bold text-lg text-slate-900 dark:text-dk-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 font-space-grotesk">
                  {announcement.title}
                </p>
                <p className="mt-3 text-sm text-slate-600 dark:text-dk-text-2 line-clamp-3 leading-relaxed flex-1">
                  {announcement.message}
                </p>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface p-12 text-center">
               <p className="text-slate-500 dark:text-dk-text-2">No announcements published yet. Check back soon for updates!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlatformOverview
