import React, { useEffect, useState, useContext } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, BarChart3, Bot, BookOpen, TrendingUp } from 'lucide-react'
import { AppContext } from '../../context/AppContext'

/* ───────────── tiny animated counter ───────────── */
const AnimatedCounter = ({ target, suffix = '', duration = 2 }) => {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v * 10) / 10)
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const controls = animate(count, target, { duration, ease: 'easeOut' })
    const unsub = rounded.on('change', (v) => setDisplay(v.toString()))
    return () => { controls.stop(); unsub() }
  }, [target])

  return <span>{display}{suffix}</span>
}

/* ───────────── starfield particles ───────────── */
const Particles = () => {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white/30 dark:bg-white/40"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: s.duration, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ───────────── floating card wrapper ───────────── */
const FloatingCard = ({ children, className = '', delay = 0, y = 0, rotate = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 60, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    <motion.div
      animate={{ y: [0, y, 0] }}
      transition={{ repeat: Infinity, duration: 5 + delay, ease: 'easeInOut' }}
      style={{ rotate }}
    >
      {children}
    </motion.div>
  </motion.div>
)

/* ───────────── mini bar chart ───────────── */
const MiniBarChart = () => {
  const bars = [40, 65, 50, 80, 60, 90, 75]
  return (
    <div className="flex items-end gap-1.5 h-16">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-4 rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-400"
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.6, delay: 1.2 + i * 0.08, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

/* ───────────── typing dots ───────────── */
const TypingDots = () => (
  <span className="inline-flex gap-1 ml-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
      />
    ))}
  </span>
)

/* ───────────── progress ring ───────────── */
const ProgressRing = ({ progress = 84, size = 32, stroke = 3 }) => {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/10" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#grad)" strokeWidth={stroke} strokeLinecap="round"
        initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - progress / 100) }}
        transition={{ duration: 1.5, delay: 1, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="grad"><stop stopColor="#3B82F6" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient>
      </defs>
    </svg>
  )
}

/* ══════════════════════════════════════════════════
   HERO
   ══════════════════════════════════════════════════ */
const Hero = () => {
  const navigate = useNavigate()
  const { allCourses, calculateRating, enrolledCourses } = useContext(AppContext)

  // Real data for Trending Course (Card 1)
  const trendingCourse = allCourses && allCourses.length > 0 ? allCourses[0] : null;
  const trendingTitle = trendingCourse ? trendingCourse.courseTitle : "AI & Machine Learning";
  const trendingSubtitle = trendingCourse ? (trendingCourse.educator?.name || "Deep Learning Fundamentals") : "Deep Learning Fundamentals";
  const trendingEnrolled = trendingCourse ? (trendingCourse.enrolledStudents?.length || 0) : 2400;
  const trendingRating = trendingCourse ? Number(calculateRating(trendingCourse)) : 4.9;

  // Real data for Analytics (Card 2) - using average course progress or total enrolled
  const totalEnrolled = enrolledCourses?.length || 0;
  const analyticsValue = totalEnrolled > 0 ? (enrolledCourses.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalEnrolled) : 98.4;
  const analyticsLabel = totalEnrolled > 0 ? "Average Progress" : "Skill Mastery";

  /* stagger variants */
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }
  const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }

  return (
    <section className="relative w-full overflow-hidden bg-bg-primary transition-colors duration-500 min-h-[90vh] flex flex-col justify-center">
      {/* ── ambient blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-accent-blue/10 dark:bg-accent-blue/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-accent-purple/10 dark:bg-accent-purple/20 blur-[100px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-[30%] right-[30%] w-[300px] h-[300px] rounded-full bg-accent-emerald/10 dark:bg-accent-emerald/20 blur-[100px]" 
        />
      </div>

      {/* ── grid lines (subtle) ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      {/* ── main content ── */}
      <div className="relative mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-10 pt-8 pb-20 md:pt-12 md:pb-28 lg:pt-16 lg:pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">

          {/* ───── LEFT: copy ───── */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex-1 flex flex-col items-start text-left max-w-xl lg:max-w-[560px]"
          >
            {/* badge */}
            <motion.div variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-accent-blue/30 bg-accent-blue/10 backdrop-blur px-4 py-1.5 text-sm font-semibold text-accent-blue mb-7 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Learn Smarter with AI
            </motion.div>

            {/* heading */}
            <motion.h1 variants={item}
              className="font-space-grotesk text-[2.6rem] leading-[1.12] sm:text-5xl md:text-[3.4rem] lg:text-[3.6rem] font-bold tracking-tight text-text-primary transition-colors"
            >
              Empower Your Future{' '}
              <br className="hidden sm:block" />
              with{' '}
              <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent drop-shadow-sm">
                Learning
              </span>
            </motion.h1>

            {/* description */}
            <motion.p variants={item}
              className="mt-6 text-base sm:text-lg leading-relaxed text-text-secondary max-w-md transition-colors"
            >
              Join world-class instructors and a global community to master the skills of tomorrow. LearnSphere AI bridges the gap between knowledge and lifetime achievement.
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={item} className="flex flex-wrap items-center gap-4 mt-9">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/course-list')}
                className="group relative overflow-hidden inline-flex items-center gap-2 rounded-xl bg-accent-blue px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-glow-blue transition-shadow hover:shadow-xl hover:shadow-accent-blue/30"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                {/* shimmer sweep */}
                <motion.div 
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  animate={{ translateX: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/course-list')}
                className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-card-bg px-7 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:border-accent-blue/50 hover:shadow-lg hover:shadow-glow-blue"
              >
                Explore Courses
              </motion.button>
            </motion.div>

          </motion.div>

          {/* ───── RIGHT: floating cards ───── */}
          <div className="flex-1 relative w-full max-w-[600px] min-h-[420px] md:min-h-[480px] lg:min-h-[520px]">

            {/* ── Card 1 – Course Card (top-left) ── */}
            <FloatingCard delay={0.5} y={-10} rotate={-2}
              className="absolute top-0 left-0 sm:left-4 z-20 w-[260px] sm:w-[280px]"
            >
              <div className="interactive-card rounded-2xl border border-card-border bg-card-bg backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/40 p-5">
                {/* tag */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-2.5 py-1 mb-3">
                  <TrendingUp className="w-3 h-3" /> Currently Trending
                </span>

                <h3 className="text-base font-bold text-text-primary leading-snug line-clamp-1 transition-colors">{trendingTitle}</h3>
                <p className="text-xs text-text-secondary mt-1 line-clamp-1 transition-colors">{trendingSubtitle}</p>

                {/* stats row */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-accent-blue" />
                    <span className="text-xs text-text-primary font-medium transition-colors"><AnimatedCounter target={trendingEnrolled} suffix="" /> enrolled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => (
                      <motion.svg key={i} className={`w-3 h-3 ${i <= Math.round(trendingRating) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </motion.svg>
                    ))}
                    <span className="text-[10px] text-text-secondary ml-0.5 transition-colors">{trendingRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </FloatingCard>

            {/* ── Card 2 – Analytics (top-right) ── */}
            <FloatingCard delay={0.75} y={8} rotate={3}
              className="absolute top-4 right-0 sm:right-0 z-10 w-[220px] sm:w-[240px]"
            >
              <div className="interactive-card rounded-2xl border border-card-border bg-card-bg backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/40 p-5">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-accent-blue bg-accent-blue/10 rounded-full px-2.5 py-1 mb-3">
                  Live Analytics
                </span>

                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold text-text-primary font-space-grotesk transition-colors">
                    <AnimatedCounter target={analyticsValue} suffix={totalEnrolled > 0 ? "%" : ""} duration={2.5} />
                  </p>
                  <TrendingUp className="w-3.5 h-3.5 text-accent-emerald" />
                </div>
                <p className="text-xs text-text-secondary transition-colors">{analyticsLabel}</p>

                <div className="mt-3">
                  <MiniBarChart />
                </div>
              </div>
            </FloatingCard>

            {/* ── Card 3 – AI Assistant (bottom-center) ── */}
            <FloatingCard delay={1} y={-12} rotate={-1}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 sm:left-[12%] sm:translate-x-0 z-30 w-[280px] sm:w-[310px]"
            >
              <div className="interactive-card rounded-2xl border border-card-border bg-card-bg backdrop-blur-xl shadow-2xl shadow-black/5 dark:shadow-black/40 p-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-purple bg-accent-purple/10 rounded-full px-2.5 py-1 mb-3">
                  <Bot className="w-3 h-3" /> Active AI Agent
                </span>

                <h3 className="text-base font-bold text-text-primary transition-colors">AI Spark Assistant</h3>
                <p className="text-xs text-text-secondary mt-1 flex items-center transition-colors">
                  Explaining Quantum Entanglement
                  <TypingDots />
                </p>

                <div className="flex items-center gap-2 mt-4 rounded-lg bg-text-primary/5 px-3 py-2.5 transition-colors">
                  <BookOpen className="w-3.5 h-3.5 text-accent-blue shrink-0" />
                  <p className="text-xs text-text-secondary truncate transition-colors">Generating tailored lesson plan…</p>
                </div>
              </div>
            </FloatingCard>

            {/* decorative orbit ring */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-dashed border-text-primary/10 pointer-events-none transition-colors"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* ── bottom gradient fade ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none transition-colors duration-500" />
    </section>
  )
}

export default Hero

