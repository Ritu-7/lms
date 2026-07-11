import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const AI_TOOLS = [
  {
    label: 'AI Tutor',
    description: 'Get instant answers to your learning questions',
    icon: '🧠',
    href: '/ai-tutor',
    badge: 'Popular',
    badgeColor: 'bg-blue-500',
  },
  {
    label: 'PDF Summary',
    description: 'Summarize any document in seconds',
    icon: '📄',
    href: '/pdf-summary',
    badge: null,
  },
  {
    label: 'Video Summary',
    description: 'Extract key points from lecture videos',
    icon: '🎬',
    href: '/video-summary',
    badge: 'New',
    badgeColor: 'bg-emerald-500',
  },
 
  {
    label: 'Notes Generator',
    description: 'Create smart notes for memorization',
    icon: '📝',
    href: '/notes-generator',
    badge: null,
  },
  {
    label: 'Coding Assistant',
    description: 'Write and optimize code with AI',
    icon: '💻',
    href: '/ai-coding-assistant',
    badge: 'Beta',
    badgeColor: 'bg-purple-500',
  },
]

const AIToolsDropdown = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute left-0 top-full mt-2 z-50 w-80 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a1 1 0 0 1 .894.553l2.184 4.424 4.883.71a1 1 0 0 1 .555 1.705l-3.533 3.443.834 4.862a1 1 0 0 1-1.45 1.054L12 16.347l-4.367 2.304a1 1 0 0 1-1.45-1.054l.834-4.862L3.484 9.392a1 1 0 0 1 .555-1.705l4.883-.71L11.106 2.553A1 1 0 0 1 12 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Tools</span>
        </div>
        {/* Future: AI Credit Balance */}
        <div className="flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
          </svg>
          Credits: —
        </div>
      </div>

      {/* Tools list */}
      <div className="p-2">
        {AI_TOOLS.map((tool) => (
          <Link
            key={tool.label}
            to={tool.href}
            onClick={onClose}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
          >
            <span className="mt-0.5 text-xl leading-none">{tool.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tool.label}
                </span>
                {tool.badge && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{tool.description}</p>
            </div>
            <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}

export default AIToolsDropdown
