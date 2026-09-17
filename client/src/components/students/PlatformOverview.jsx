import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'
import { Search, BookOpen, TrendingUp, Sparkles, ArrowRight, Check, Users, GraduationCap, Library, Award } from 'lucide-react'

const PlatformOverview = () => {
  const { platformHomeData } = useContext(AppContext)
  const [activeStep, setActiveStep] = React.useState(null)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-16 max-w-[1400px] mx-auto space-y-20">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {platformHomeData.stats ? (
          [
            { label: 'Active Students', value: platformHomeData.stats.totalStudents, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', glow: 'shadow-blue-500/10 hover:shadow-blue-500/25', icon: Users },
            { label: 'Expert Educators', value: platformHomeData.stats.totalEducators, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', glow: 'shadow-emerald-500/10 hover:shadow-emerald-500/25', icon: GraduationCap },
            { label: 'Curated Courses', value: platformHomeData.stats.totalCourses, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', glow: 'shadow-orange-500/10 hover:shadow-orange-500/25', icon: Library },
            { label: 'Total Enrollments', value: platformHomeData.stats.totalEnrollments, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', glow: 'shadow-violet-500/10 hover:shadow-violet-500/25', icon: Award },
          ].map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`group relative flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-5 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 dark:border-dk-border dark:bg-dk-surface dark:hover:border-white/20 sm:px-6 sm:py-6 ${stat.glow}`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <p className={`font-space-grotesk text-2xl font-bold leading-none ${stat.color} dark:text-dk-text`}>{stat.value}</p>
                <p className="mt-2 truncate text-xs font-semibold text-slate-700 dark:text-dk-text">{stat.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-dk-text-3">
                  {idx === 0 ? 'Learning every day' : idx === 1 ? 'Industry professionals' : idx === 2 ? 'Across multiple domains' : 'Growing achievements'}
                </p>
              </div>
            </motion.div>
          ))
        ) : null}
      </div>

      {/* How LearnSphereAI Works Section */}
      <div className="relative w-full rounded-[2.5rem] bg-bg-primary overflow-hidden p-8 sm:p-12 lg:p-16 border border-card-border shadow-2xl transition-colors duration-500">
        {/* Subtle background gradient / noise texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-text-primary/[0.03] via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] dark:opacity-20 mix-blend-overlay pointer-events-none transition-opacity duration-500"></div>

        <div className="relative z-10 text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold font-space-grotesk tracking-tight text-text-primary transition-colors"
          >
            How LearnSphereAI Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-text-secondary font-medium max-w-2xl mx-auto transition-colors"
          >
            A smarter way to learn, practice, and grow.
          </motion.p>
        </div>

        {/* 3 Steps Container */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-[2px] bg-text-primary/[0.05] z-0 overflow-hidden transition-colors">
             <motion.div 
               className="h-full bg-gradient-to-r from-transparent via-accent-blue/50 to-transparent w-1/3"
               animate={{ x: ['-100%', '300%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             />
          </div>
          
          {/* Connector Line (Mobile) */}
          <div className="md:hidden absolute left-[60px] top-[10%] bottom-[10%] w-[2px] bg-text-primary/[0.05] z-0 overflow-hidden transition-colors">
             <motion.div 
               className="w-full bg-gradient-to-b from-transparent via-accent-blue/50 to-transparent h-1/3"
               animate={{ y: ['-100%', '300%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             />
          </div>

          {[
            {
              id: 1,
              title: 'Choose',
              desc: 'Discover courses that match your goals and interests.',
              accent: 'blue',
              icon: Search,
              theme: {
                border: 'border-accent-blue/20',
                glow: 'shadow-glow-blue',
                hoverGlow: 'hover:shadow-glow-blue hover:shadow-lg',
                hoverBorder: 'hover:border-accent-blue/40',
                text: 'text-accent-blue',
                bg: 'bg-accent-blue/10',
                iconBg: 'bg-accent-blue/40',
                ring: 'ring-accent-blue'
              },
              Preview: () => (
                <div className="mt-8 w-full max-w-[260px] rounded-xl bg-text-primary/5 border border-card-border p-4 space-y-3 backdrop-blur-sm group-hover:bg-accent-blue/5 transition-colors duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-11 shrink-0 rounded-lg bg-accent-blue/20 flex items-center justify-center border border-accent-blue/30 transition-colors">
                      <Search className="w-4 h-4 text-accent-blue transition-colors" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-2 w-full bg-accent-blue/20 rounded-full overflow-hidden transition-colors">
                        <div className="h-full bg-accent-blue/40 w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
                      </div>
                      <div className="h-1.5 w-2/3 bg-accent-blue/10 rounded-full overflow-hidden transition-colors">
                        <div className="h-full bg-accent-blue/30 w-0 group-hover:w-full transition-all duration-1000 delay-100 ease-out"></div>
                      </div>
                      <div className="h-1.5 w-3/4 bg-accent-blue/10 rounded-full overflow-hidden transition-colors">
                        <div className="h-full bg-accent-blue/30 w-0 group-hover:w-full transition-all duration-1000 delay-200 ease-out"></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="h-6 rounded-md bg-accent-blue/10 border border-accent-blue/20 relative overflow-hidden transition-colors">
                        <div className={`absolute inset-0 bg-accent-blue/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500`} style={{ transitionDelay: `${i * 100}ms` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              id: 2,
              title: 'Learn',
              desc: 'Learn with engaging lessons, hands-on practice, and assessments.',
              accent: 'emerald',
              icon: BookOpen,
              theme: {
                border: 'border-accent-emerald/20',
                glow: 'shadow-glow-emerald',
                hoverGlow: 'hover:shadow-glow-emerald hover:shadow-lg',
                hoverBorder: 'hover:border-accent-emerald/40',
                text: 'text-accent-emerald',
                bg: 'bg-accent-emerald/10',
                iconBg: 'bg-accent-emerald/40',
                ring: 'ring-accent-emerald'
              },
              Preview: () => (
                <div className="mt-8 w-full max-w-[260px] rounded-xl bg-text-primary/5 border border-card-border p-4 relative backdrop-blur-sm group-hover:bg-accent-emerald/5 transition-colors duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 shrink-0 rounded-lg bg-accent-emerald/20 flex items-center justify-center border border-accent-emerald/30 relative overflow-hidden transition-colors">
                      <motion.div 
                        className="absolute inset-0 rounded-lg bg-accent-emerald/20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <svg className="w-5 h-5 text-accent-emerald fill-accent-emerald ml-0.5 relative z-10 transition-colors" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-2 w-full bg-accent-emerald/20 rounded-full transition-colors"></div>
                      <div className="h-1.5 w-2/3 bg-accent-emerald/10 rounded-full transition-colors"></div>
                      <div className="h-1.5 w-4/5 bg-accent-emerald/10 rounded-full transition-colors"></div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-accent-emerald/10 rounded-full mt-4 overflow-hidden flex transition-colors">
                    <div className="h-full bg-accent-emerald w-1/3 group-hover:w-full transition-all duration-1000 ease-out"></div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-accent-emerald text-white flex items-center justify-center shadow-lg shadow-glow-emerald opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 delay-500 ease-out">
                    <Check className="w-5 h-5" strokeWidth={3} />
                  </div>
                </div>
              )
            },
            {
              id: 3,
              title: 'Grow',
              desc: 'Track your progress, earn certificates, and get AI support.',
              accent: 'purple',
              icon: TrendingUp,
              theme: {
                border: 'border-accent-purple/20',
                glow: 'shadow-glow-purple',
                hoverGlow: 'hover:shadow-glow-purple hover:shadow-lg',
                hoverBorder: 'hover:border-accent-purple/40',
                text: 'text-accent-purple',
                bg: 'bg-accent-purple/10',
                iconBg: 'bg-accent-purple/40',
                ring: 'ring-accent-purple'
              },
              Preview: () => (
                <div className="mt-8 w-full max-w-[260px] rounded-xl bg-text-primary/5 border border-card-border p-4 flex items-center justify-between min-h-[76px] backdrop-blur-sm group-hover:bg-accent-purple/5 transition-colors duration-500">
                  <div className="space-y-2 flex-1 mr-4">
                    <div className="h-2 w-full bg-accent-purple/20 rounded-full transition-colors"></div>
                    <div className="h-1.5 w-2/3 bg-accent-purple/10 rounded-full transition-colors"></div>
                    <div className="h-1.5 w-4/5 bg-accent-purple/10 rounded-full transition-colors"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="relative">
                       <motion.div
                         animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                         transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                       >
                         <svg className="w-8 h-8 text-accent-purple transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15.228l-4.326 2.274.826-4.817L4.996 9.27l4.836-.703L12 4.186l2.168 4.382 4.836.703-3.504 3.415.826 4.817z"/></svg>
                       </motion.div>
                    </div>
                    <div className="flex items-end gap-1 ml-2.5 h-8">
                      <div className="w-1.5 bg-accent-purple/40 rounded-t-sm h-3 group-hover:h-5 transition-all duration-500"></div>
                      <div className="w-1.5 bg-accent-purple/60 rounded-t-sm h-5 group-hover:h-7 transition-all duration-500 delay-100"></div>
                      <div className="w-1.5 bg-accent-purple rounded-t-sm h-4 group-hover:h-8 transition-all duration-500 delay-200"></div>
                    </div>
                  </div>
                </div>
              )
            }
          ].map((step, idx) => {
             const isDimmed = activeStep !== null && activeStep !== step.id;
             const isActive = activeStep === step.id;
             
             return (
               <motion.div
                 key={step.id}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                 className={`relative z-10 flex flex-col md:mt-0 transition-all duration-500 ease-out cursor-pointer
                   ${isDimmed ? 'opacity-40 scale-95 grayscale-[0.5]' : 'opacity-100'}
                   ${isActive ? 'scale-[1.02]' : ''}
                 `}
                 onClick={() => setActiveStep(isActive ? null : step.id)}
               >
                 <div className="flex flex-col items-center h-full group">
                   {/* Icon Circle */}
                   <div className="relative mb-0 z-10">
                     <div className={`absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 ${step.theme.bg}`}></div>
                     <motion.div 
                       animate={{ scale: [1, 1.05, 1] }}
                       transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                       className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full border border-card-border bg-card-bg backdrop-blur-md flex items-center justify-center relative shadow-xl ${step.theme.border} group-hover:border-text-primary/20 transition-colors`}
                     >
                        <step.icon className={`w-8 h-8 sm:w-12 sm:h-12 ${step.theme.text} transition-colors`} strokeWidth={1.5} />
                     </motion.div>
                   </div>
                   
                   {/* Badge */}
                   <motion.div 
                     initial={{ scale: 0 }}
                     whileInView={{ scale: 1 }}
                     viewport={{ once: true }}
                     transition={{ type: "spring", bounce: 0.5, delay: idx * 0.15 + 0.3 }}
                     className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${step.theme.bg} backdrop-blur-md border border-card-border text-text-primary font-bold text-sm sm:text-base flex items-center justify-center shadow-lg relative z-20 -mb-6 ring-4 ring-bg-primary transition-colors`}
                   >
                     0{step.id}
                   </motion.div>
                   
                   {/* Card Content */}
                   <div className={`w-full h-full rounded-3xl border border-card-border bg-card-bg backdrop-blur-sm pt-12 pb-8 px-6 sm:px-8 shadow-xl transition-all duration-500
                     group-hover:-translate-y-2 ${step.theme.hoverGlow} ${step.theme.hoverBorder}
                     flex flex-col items-center text-center justify-between
                     ${isActive ? `${step.theme.glow} ${step.theme.border} bg-text-primary/[0.02]` : ''}
                   `}>
                     <div>
                       <h3 className={`text-2xl font-bold font-space-grotesk ${step.theme.text} transition-colors`}>{step.title}</h3>
                       <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-[260px] mx-auto transition-colors">{step.desc}</p>
                     </div>
                     
                     {/* Custom Graphic */}
                     <step.Preview />
                   </div>
                 </div>
               </motion.div>
             )
          })}
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
