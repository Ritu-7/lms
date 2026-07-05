import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AuthContextValue, AuthRoleKey, AuthStep, AuthTheme } from '../types/auth'

export const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<AuthStep>('role-selection')
  const [selectedRole, setSelectedRole] = useState<AuthRoleKey>('student')
  const [theme, setThemeState] = useState<AuthTheme>(() => {
    if (typeof window === 'undefined') return 'light'

    const storedTheme = window.localStorage.getItem('lms-auth-theme') as AuthTheme | null
    return storedTheme === 'dark' ? 'dark' : 'light'
  })

  // Sync isOpen with current route
  useEffect(() => {
    setIsOpen(location.pathname === '/login')
  }, [location.pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('lms-auth-theme', theme)
  }, [theme])

  const openAuth = useCallback((role: AuthRoleKey = 'student') => {
    setSelectedRole(role)
    setStep('role-selection')
    navigate('/login')
  }, [navigate])

  const closeAuth = useCallback(() => {
    setIsOpen(false)
    setStep('role-selection')
    navigate(-1) // go back, or navigate to '/' if preferred, but usually go back is fine. Let's do navigate('/') for safety if -1 is external
  }, [navigate])

  const selectRole = useCallback((role: AuthRoleKey) => {
    setSelectedRole(role)
    setStep('login')
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isOpen,
      step,
      selectedRole,
      theme,
      openAuth,
      closeAuth,
      selectRole,
      toggleTheme,
      setTheme: setThemeState,
    }),
    [closeAuth, isOpen, openAuth, selectRole, step, theme, toggleTheme, selectedRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthModal = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthModal must be used within AuthProvider')
  }

  return context
}

