import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Target,
  Users,
  BookOpen,
  Award,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Star,
  Layers,
  BarChart3,
  MessageSquare,
  Code2,
  FileText,
} from 'lucide-react';
import Footer from '../../components/students/Footer';

// ─── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Active Learners', value: '120K+', color: 'from-blue-500 to-indigo-500', icon: Users },
  { label: 'Expert-Led Courses', value: '3,400+', color: 'from-violet-500 to-purple-500', icon: BookOpen },
  { label: 'Certificates Issued', value: '85K+', color: 'from-emerald-500 to-teal-500', icon: Award },
  { label: 'Countries Reached', value: '95+', color: 'from-amber-500 to-orange-500', icon: Globe },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Tutor',
    description: 'Get instant, context-aware answers to your questions with our GPT-4 powered tutor that understands your learning pace.',
    color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-900/40',
  },
  {
    icon: FileText,
    title: 'PDF & Video Summaries',
    description: 'Automatically distill hours of lectures and dense documents into concise, readable summaries in seconds.',
    color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
    border: 'border-violet-100 dark:border-violet-900/40',
  },
  {
    icon: Code2,
    title: 'AI Coding Assistant',
    description: 'Write, debug, and understand code with an intelligent pair-programmer embedded directly in your learning workflow.',
    color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/40',
  },
  {
    icon: MessageSquare,
    title: 'Smart Notes Generator',
    description: 'Transform any course material into structured, searchable notes automatically — so you can focus on learning.',
    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/40',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Track your learning journey with detailed dashboards, credit systems, and actionable AI-generated insights.',
    color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-900/40',
  },
  {
    icon: Award,
    title: 'Verified Certificates',
    description: 'Earn blockchain-verifiable certificates that showcase your skills to employers and collaborators worldwide.',
    color: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-100 dark:border-cyan-900/40',
  },
];

const WHY_CHOOSE = [
  'Personalised AI learning path tailored to your skill level',
  'Expert instructors from top-tier global companies',
  'Learn at your own pace with lifetime course access',
  'Gamified credits & rewards to keep you motivated',
  'Community-driven peer discussions and study groups',
  'Mobile-first design — learn anywhere, anytime',
  'Regular content updates reflecting latest industry trends',
  'Dedicated student support and mentorship sessions',
];

const TEAM = [
  { name: 'Aanya Sharma', role: 'Co-Founder & CEO', initials: 'AS', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Rohan Mehta', role: 'Co-Founder & CTO', initials: 'RM', gradient: 'from-violet-500 to-purple-600' },
  { name: 'Priya Kapoor', role: 'Head of AI Research', initials: 'PK', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Vikram Singh', role: 'Head of Product', initials: 'VS', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Neha Joshi', role: 'Lead Educator Relations', initials: 'NJ', gradient: 'from-rose-500 to-pink-600' },
  { name: 'Arjun Patel', role: 'Head of Engineering', initials: 'AP', gradient: 'from-cyan-500 to-blue-600' },
];

const FAQS = [
  {
    question: 'What makes LearnSphereAI different from other learning platforms?',
    answer: 'LearnSphereAI is the only platform that integrates a suite of AI tools — AI Tutor, PDF/Video Summaries, Coding Assistant, and Smart Notes — directly inside your course experience. Instead of just streaming videos, we help you actively learn, understand, and retain knowledge using cutting-edge AI.',
  },
  {
    question: 'Who are the courses designed for?',
    answer: 'Our courses are designed for everyone — from absolute beginners exploring their first skill to seasoned professionals looking to upskill. Each course is curated by verified educators, and the AI adapts explanations based on your current understanding level.',
  },
  {
    question: 'Are the certificates recognised by employers?',
    answer: 'Yes. Every certificate issued on LearnSphereAI includes a unique verification code that employers can verify online. Our certificates are trusted by 2,000+ hiring partners across 95 countries.',
  },
  {
    question: 'How does the AI credit system work?',
    answer: 'The credit system gamifies your learning experience. You earn credits by completing lessons, quizzes, assignments, and engaging with the community. Credits can be used to unlock premium AI features, bonus content, and exclusive mentorship sessions.',
  },
  {
    question: 'Can I access courses on mobile?',
    answer: 'Absolutely. LearnSphereAI is built mobile-first with a fully responsive design. You can access all courses, AI tools, notes, and your progress dashboard from any device — phone, tablet, or desktop.',
  },
  {
    question: 'Is there a free tier available?',
    answer: 'Yes! You can enroll in a selection of free courses and access basic AI features without any payment. Premium courses and advanced AI tools are available through our subscription plans or individual course purchases.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
    <Sparkles size={12} />
    {children}
  </span>
);

const FAQItem = ({ faq, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      custom={index * 0.08}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{faq.question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-slate-400 dark:text-slate-500"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-6 pb-5 pt-0 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const About = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/[0.06]">
        {/* Background Decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/40 dark:to-blue-950/40 blur-3xl opacity-60" />
          <div className="absolute -bottom-20 -left-32 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-100 to-purple-100 dark:from-violet-950/30 dark:to-purple-950/30 blur-3xl opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-px w-[800px] bg-gradient-to-r from-transparent via-indigo-200/40 dark:via-indigo-800/20 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              variants={fadeIn}
              custom={0}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              <SectionBadge>Our Story</SectionBadge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              animate="visible"
              className="font-space-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
            >
              Redefining Learning with{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-400 dark:via-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                Artificial Intelligence
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              animate="visible"
              className="mt-6 text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto"
            >
              LearnSphereAI was born from a simple conviction — every learner deserves a personalised, intelligent, and engaging education experience, regardless of where they are in the world.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={0.3}
              initial="hidden"
              animate="visible"
              className="mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                to="/course-list"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:shadow-xl active:scale-95"
              >
                Explore Courses
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all duration-200"
              >
                Get in Touch
              </Link>
            </motion.div>
          </div>

          {/* Floating Stats Strip */}
          <motion.div
            variants={fadeUp}
            custom={0.4}
            initial="hidden"
            animate="visible"
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 dark:border-white/[0.07] bg-white dark:bg-slate-900/80 p-6 text-center shadow-sm"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-white">
                    {stat.value}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Mission & Vision ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mission */}
          <motion.div
            variants={scaleIn}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="relative overflow-hidden rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-8 lg:p-10"
          >
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-blue-200/30 dark:bg-blue-800/10 blur-2xl -translate-y-12 translate-x-12" />
            <div className="relative">
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-600/30">
                <Target size={24} className="text-white" />
              </div>
              <h2 className="mb-4 font-space-grotesk text-2xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                To democratise world-class education by combining expert-crafted courses with the transformative power of artificial intelligence — making personalised, high-quality learning accessible to every curious mind on the planet.
              </p>
              <ul className="mt-6 space-y-2.5">
                {['Remove barriers to quality education', 'Personalise every learning journey', 'Empower educators with AI tools'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Vision */}
          <motion.div
            variants={scaleIn}
            custom={0.15}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="relative overflow-hidden rounded-3xl border border-violet-100 dark:border-violet-900/40 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-8 lg:p-10"
          >
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-violet-200/30 dark:bg-violet-800/10 blur-2xl -translate-y-12 translate-x-12" />
            <div className="relative">
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-600/30">
                <Sparkles size={24} className="text-white" />
              </div>
              <h2 className="mb-4 font-space-grotesk text-2xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                A future where AI acts as every student's personal mentor — adapting in real-time to their strengths, closing their knowledge gaps, and unlocking their full intellectual potential through continuous, joyful learning.
              </p>
              <ul className="mt-6 space-y-2.5">
                {['AI mentor for every learner', 'Continuous skill development', 'Global learning ecosystem'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={16} className="shrink-0 text-violet-600 dark:text-violet-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
              <SectionBadge>Platform Features</SectionBadge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-space-grotesk text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
            >
              Everything You Need to Excel
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto"
            >
              From intelligent tutoring to verified certifications, our platform is engineered to make every learning session more effective.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  custom={i * 0.08}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  whileHover={{ y: -5 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className={`rounded-2xl border ${feature.border} bg-white dark:bg-slate-900/80 p-6 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Choose LearnSphereAI ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Visual */}
          <motion.div
            variants={scaleIn}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-1 shadow-2xl shadow-indigo-500/20">
              <div className="rounded-[22px] bg-gradient-to-br from-indigo-700 via-blue-700 to-violet-800 p-8 lg:p-10">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Zap, label: 'Instant AI Answers', value: '<2s' },
                    { icon: TrendingUp, label: 'Completion Rate', value: '94%' },
                    { icon: Star, label: 'Avg. Course Rating', value: '4.8★' },
                    { icon: Shield, label: 'Verified Educators', value: '100%' },
                    { icon: Layers, label: 'Course Categories', value: '60+' },
                    { icon: Globe, label: 'Language Support', value: '12+' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 flex flex-col gap-1.5"
                      >
                        <Icon size={18} className="text-indigo-200" />
                        <span className="text-xl font-bold text-white font-space-grotesk">{item.value}</span>
                        <span className="text-xs text-indigo-200/80">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Decorative glow */}
            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-2xl" />
          </motion.div>

          {/* Right: List */}
          <div>
            <motion.div variants={fadeIn} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
              <SectionBadge>Why Choose Us</SectionBadge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-4 font-space-grotesk text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
            >
              The Smarter Way to Learn
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.18}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-8 text-slate-500 dark:text-slate-400 leading-relaxed"
            >
              We've built LearnSphereAI from the ground up to be the most intelligent, engaging, and results-driven learning platform available today.
            </motion.p>
            <div className="space-y-3">
              {WHY_CHOOSE.map((item, i) => (
                <motion.div
                  key={item}
                  variants={fadeUp}
                  custom={0.22 + i * 0.06}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/50">
                    <CheckCircle2 size={12} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ────────────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 dark:border-white/[0.06] bg-white dark:bg-slate-900/60 py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <motion.div variants={fadeIn} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
              <SectionBadge>Meet the Team</SectionBadge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-space-grotesk text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
            >
              The Minds Behind LearnSphereAI
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-4 text-slate-500 dark:text-slate-400 max-w-xl mx-auto"
            >
              A passionate team of educators, engineers, and AI researchers united by the goal of making world-class learning accessible to everyone.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                variants={fadeUp}
                custom={i * 0.09}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 dark:border-white/[0.08] bg-white dark:bg-slate-900/80 p-8 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Avatar */}
                <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${member.gradient} shadow-lg`}>
                  <span className="font-space-grotesk text-xl font-bold text-white">{member.initials}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{member.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  {['twitter', 'linkedin'].map((social) => (
                    <button
                      key={social}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                      aria-label={`${member.name} ${social}`}
                    >
                      {social === 'twitter' ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <motion.div variants={fadeIn} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-4">
              <SectionBadge>FAQs</SectionBadge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-space-grotesk text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-4 text-slate-500 dark:text-slate-400"
            >
              Everything you need to know about LearnSphereAI. Can't find the answer?{' '}
              <Link to="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Reach out to us.
              </Link>
            </motion.p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={faq.question} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          variants={scaleIn}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-12 lg:p-16 text-center shadow-2xl shadow-indigo-500/25"
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
          </div>
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm"
            >
              <Sparkles size={32} className="text-white" />
            </motion.div>
            <h2 className="font-space-grotesk text-3xl sm:text-4xl font-bold text-white mb-4">
              Start Your AI-Powered Journey Today
            </h2>
            <p className="text-indigo-100/80 text-lg max-w-xl mx-auto mb-10">
              Join over 120,000 learners who are already transforming their skills and careers with LearnSphereAI.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/course-list"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-all duration-200 shadow-lg shadow-black/10 active:scale-95"
              >
                Browse Courses
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all duration-200"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
