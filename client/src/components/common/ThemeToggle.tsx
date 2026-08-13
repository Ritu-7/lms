import { useTheme } from '../../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

interface ThemeToggleProps {
  /** 'icon' = just the icon button (navbar), 'row' = full labeled row (mobile drawer/settings) */
  variant?: 'icon' | 'row'
  className?: string
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const ThemeToggle = ({ variant = 'icon', className = '' }: ThemeToggleProps) => {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium
          text-slate-700 dark:text-dk-text hover:bg-slate-50 dark:hover:bg-dk-surface-2 transition-colors ${className}`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-dk-text-2">
            {isDark ? <MoonIcon /> : <SunIcon />}
          </span>
          {isDark ? 'Dark mode' : 'Light mode'}
        </span>

        {/* Toggle pill */}
        <span
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-300
            ${isDark ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-300
              ${isDark ? 'translate-x-4' : 'translate-x-1'}`}
          />
        </span>
      </button>
    )
  }

  // Default: 'icon' variant — compact icon button for navbar
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border
        border-slate-200 dark:border-dk-border text-slate-500 dark:text-dk-text-2
        hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white
        transition-all duration-200 overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            <MoonIcon />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            <SunIcon />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export default ThemeToggle
