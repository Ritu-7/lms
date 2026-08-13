import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AuthContextValue, AuthRoleKey, AuthStep } from '../types/auth'
import { useTheme } from './ThemeContext'

export const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Delegate theme management to the global ThemeProvider
  const { resolvedTheme: theme, toggleTheme, setTheme } = useTheme()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<AuthStep>('role-selection')
  const [selectedRole, setSelectedRole] = useState<AuthRoleKey>('student')

  // Sync isOpen with current route
  useEffect(() => {
    setIsOpen(location.pathname === '/login')
  }, [location.pathname])

  const openAuth = useCallback((role: AuthRoleKey = 'student') => {
    setSelectedRole(role)
    setStep('role-selection')
    navigate('/login')
  }, [navigate])

  const closeAuth = useCallback(() => {
    setIsOpen(false)
    setStep('role-selection')
    navigate(-1)
  }, [navigate])

  const selectRole = useCallback((role: AuthRoleKey) => {
    setSelectedRole(role)
    setStep('login')
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
      setTheme,
    }),
    [closeAuth, isOpen, openAuth, selectRole, step, theme, toggleTheme, selectedRole, setTheme],
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
