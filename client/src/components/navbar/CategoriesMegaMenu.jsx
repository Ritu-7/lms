import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const CATEGORIES = [
  {
    title: 'Development',
    icon: '💻',
    items: ['Web Development', 'Mobile Apps', 'Game Dev', 'Backend', 'APIs'],
    slug: 'development',
  },
  {
    title: 'AI & ML',
    icon: '🤖',
    items: ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'AI Ethics'],
    slug: 'ai-ml',
  },
  {
    title: 'Data Science',
    icon: '📊',
    items: ['Data Analysis', 'SQL', 'Python for Data', 'Visualization', 'Big Data'],
    slug: 'data-science',
  },
  {
    title: 'Design',
    icon: '🎨',
    items: ['UI/UX Design', 'Figma', 'Graphic Design', 'Motion', '3D Modeling'],
    slug: 'design',
  },
  {
    title: 'Business',
    icon: '💼',
    items: ['Entrepreneurship', 'Management', 'Finance', 'Sales', 'Communication'],
    slug: 'business',
  },
  {
    title: 'Cyber Security',
    icon: '🔒',
    items: ['Ethical Hacking', 'Network Security', 'Pen Testing', 'SOC', 'OSINT'],
    slug: 'cyber-security',
  },
  {
    title: 'Cloud & DevOps',
    icon: '☁️',
    items: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD'],
    slug: 'cloud-devops',
  },
  {
    title: 'Marketing',
    icon: '📢',
    items: ['SEO', 'Social Media', 'Content Marketing', 'Email', 'Analytics'],
    slug: 'marketing',
  },
]

const CategoriesMegaMenu = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute left-0 top-full mt-2 z-50 w-[680px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-5"
    >
      <div className="grid grid-cols-4 gap-1">
        {CATEGORIES.map((cat) => (
          <div key={cat.slug} className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="text-base leading-none">{cat.icon}</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {cat.title}
              </span>
            </div>
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <Link
                  key={item}
                  to={`/course-list/${encodeURIComponent(item.toLowerCase())}`}
                  onClick={onClose}
                  className="block px-2 py-1 text-xs text-slate-500 dark:text-slate-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">Browse all categories</p>
        <Link
          to="/course-list"
          onClick={onClose}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View all courses →
        </Link>
      </div>
    </motion.div>
  )
}

export default CategoriesMegaMenu
