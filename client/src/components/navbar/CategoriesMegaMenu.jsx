// CategoriesMegaMenu.jsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

// Monoline icons, 20x20, stroke-based — kept dependency-free (no icon package required)
const icons = {
  development: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 9l-3 3 3 3m8-6l3 3-3 3M13 6l-2 12" />
  ),
  'ai-ml': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5L16 7m-8 8l-1.5 1.5M17.5 17.5L16 16M8 7L6.5 5.5M12 8a4 4 0 100 8 4 4 0 000-8z" />
  ),
  'data-science': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 19V9m6 10V5m6 14v-7" />
  ),
  design: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586M11 13a2 2 0 100-4 2 2 0 000 4z" />
  ),
  business: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18v12H3V7zm5 0V5a2 2 0 012-2h4a2 2 0 012 2v2" />
  ),
  'cyber-security': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  ),
  'cloud-devops': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.5 19a4.5 4.5 0 000-9 6 6 0 00-11.4-1.5A4.5 4.5 0 007 19h10.5z" />
  ),
  marketing: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 11l18-5v12L3 13v-2zm0 0v6a2 2 0 002 2h1v-7" />
  ),
}

const CATEGORIES = [
  { title: 'Development', slug: 'development', items: ['Web Development', 'Mobile Apps', 'Game Dev', 'Backend', 'APIs'] },
  { title: 'AI & ML', slug: 'ai-ml', items: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI Ethics'] },
  { title: 'Data Science', slug: 'data-science', items: ['Data Analysis', 'SQL', 'Python for Data', 'Visualization', 'Big Data'] },
  { title: 'Design', slug: 'design', items: ['UI/UX Design', 'Figma', 'Graphic Design', 'Motion', '3D Modeling'] },
  { title: 'Business', slug: 'business', items: ['Entrepreneurship', 'Management', 'Finance', 'Sales', 'Communication'] },
  { title: 'Cyber Security', slug: 'cyber-security', items: ['Ethical Hacking', 'Network Security', 'Pen Testing', 'SOC', 'OSINT'] },
  { title: 'Cloud & DevOps', slug: 'cloud-devops', items: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD'] },
  { title: 'Marketing', slug: 'marketing', items: ['SEO', 'Social Media', 'Content Marketing', 'Email', 'Analytics'] },
]

const CategoriesMegaMenu = ({ onClose }) => {
  const [active, setActive] = useState(0)
  const activeCategory = CATEGORIES[active]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="absolute left-0 top-full mt-2 z-50 flex w-[460px] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/40"
    >
      {/* ── Left rail: category list ─────────────────────────── */}
      <div className="w-[190px] shrink-0 border-r border-slate-100 dark:border-white/5 p-2">
        <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Categories
        </p>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.slug}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150 ${
                active === i
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              {active === i && (
                <motion.span
                  layoutId="cat-rail-indicator"
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-blue-600 dark:bg-blue-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <svg
                className={`h-4 w-4 shrink-0 ${active === i ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                {icons[cat.slug]}
              </svg>
              <span className="flex-1 truncate">{cat.title}</span>
              <svg className={`h-3.5 w-3.5 shrink-0 transition-opacity ${active === i ? 'opacity-60' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right pane: active category's items ──────────────── */}
      <div className="flex-1 p-3.5">
        <div className="flex items-center gap-2 px-1 pb-2.5">
          <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icons[activeCategory.slug]}
          </svg>
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
            {activeCategory.title}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-0.5">
          {activeCategory.items.map((item) => (
            <Link
              key={item}
              to={`/course-list/${encodeURIComponent(item.toLowerCase())}`}
              onClick={onClose}
              className="rounded-lg px-2.5 py-1.5 text-[13px] text-slate-500 dark:text-slate-400 transition-colors duration-150 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-100 dark:border-white/5 bg-white/95 dark:bg-slate-900/95 px-4 py-2.5">
      </div>
    </motion.div>
  )
}

export default CategoriesMegaMenu