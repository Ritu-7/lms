import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BarChart2 } from 'lucide-react'

interface AdminEmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  actionLabel?: string
  onAction?: () => void
}

const AdminEmptyState = ({ title, description, icon, actionLabel, onAction }: AdminEmptyStateProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-dk-border bg-slate-50/60 dark:bg-dk-surface-2 p-8 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm border border-blue-100 dark:border-blue-900/40">
        {icon || <BarChart2 className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-dk-text font-space-grotesk">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-dk-text-2 max-w-md leading-relaxed">{description}</p>
      
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/20"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}

export default AdminEmptyState