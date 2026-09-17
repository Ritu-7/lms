import React, { ReactNode, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

interface AdminStatCardProps {
  label: string
  value: number | string
  prefix?: string
  suffix?: string
  trend?: {
    value: string
    positive: boolean
  }
  icon?: ReactNode
  color?: 'blue' | 'emerald' | 'purple' | 'amber'
}

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/40',
    glow: 'hover:shadow-blue-500/10 hover:border-blue-500/40',
  },
  emerald: {
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/40',
    glow: 'hover:shadow-emerald-500/10 hover:border-emerald-500/40',
  },
  purple: {
    bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/40',
    glow: 'hover:shadow-purple-500/10 hover:border-purple-500/40',
  },
  amber: {
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40',
    glow: 'hover:shadow-amber-500/10 hover:border-amber-500/40',
  },
}

export const CountUpValue = ({ value, prefix = '', suffix = '' }: { value: number | string, prefix?: string, suffix?: string }) => {
  const [displayCount, setDisplayCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 })

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''))

  useEffect(() => {
    if (!inView || isNaN(numericValue)) return
    
    let startTimestamp: number | null = null
    const duration = 1200 // 1.2s

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const current = Math.floor(progress * numericValue)
      setDisplayCount(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayCount(numericValue)
      }
    }

    window.requestAnimationFrame(step)
  }, [inView, numericValue])

  const formattedStr = isNaN(numericValue) 
    ? String(value) 
    : displayCount.toLocaleString()

  return (
    <span ref={ref}>
      {prefix}{formattedStr}{suffix}
    </span>
  )
}

const AdminStatCard = ({
  label,
  value,
  prefix = '',
  suffix = '',
  trend,
  icon,
  color = 'blue',
}: AdminStatCardProps) => {
  const styles = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-2xl border border-slate-200/80 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm transition-all duration-300 ${styles.glow}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dk-text-2">
          {label}
        </span>
        {icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${styles.bg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text tracking-tight">
          <CountUpValue value={value} prefix={prefix} suffix={suffix} />
        </h3>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              trend.positive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
            }`}
          >
            {trend.positive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AdminStatCard
