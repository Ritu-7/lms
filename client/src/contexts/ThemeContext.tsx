import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme           // the stored preference ('light' | 'dark' | 'system')
  resolvedTheme: 'light' | 'dark'  // what is actually applied right now
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'lms-theme'

// ─── Helpers ───────────────────────────────────────────────────────────────
const getSystemTheme = (): 'light' | 'dark' =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

const resolveTheme = (preference: Theme): 'light' | 'dark' =>
  preference === 'system' ? getSystemTheme() : preference

const applyTheme = (resolved: 'light' | 'dark') => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

// ─── Inline script to avoid FOUC — inject this in index.html <head> ────────
// (Not needed here, handled by the provider's synchronous initial state)

// ─── Context ───────────────────────────────────────────────────────────────
export const ThemeContext = createContext<ThemeContextValue | null>(null)

// ─── Provider ──────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    return 'system' // first visit: use system preference
  })

  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme])

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // Watch system preference changes when user chose 'system'
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(getSystemTheme())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, t)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
