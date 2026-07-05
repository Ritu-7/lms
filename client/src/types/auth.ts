import type { ReactNode } from 'react'

export type AuthRoleKey = 'student' | 'instructor' | 'administrator'
export type AuthStep = 'role-selection' | 'login'
export type AuthTheme = 'light' | 'dark'
export type OAuthStrategy = 'oauth_google' | 'oauth_github' | 'oauth_microsoft'

export interface AuthRoleConfig {
  key: AuthRoleKey
  title: string
  eyebrow: string
  description: string
  summary: string
  features: string[]
  gradient: string
  ring: string
  accent: string
}

export interface SocialProviderConfig {
  key: 'google' | 'github' | 'microsoft'
  label: string
  strategy: OAuthStrategy
  accent: string
}

export interface LoginFormValues {
  email: string
  password: string
  rememberMe: boolean
}

export interface ResetPasswordValues {
  email: string
  code: string
  password: string
  confirmPassword: string
}

export interface AuthContextValue {
  isOpen: boolean
  step: AuthStep
  selectedRole: AuthRoleKey
  theme: AuthTheme
  openAuth: (role?: AuthRoleKey) => void
  closeAuth: () => void
  selectRole: (role: AuthRoleKey) => void
  toggleTheme: () => void
  setTheme: (theme: AuthTheme) => void
}

export interface AuthLayoutProps {
  children: ReactNode
}

export const AUTH_ROLES: AuthRoleConfig[] = [
  {
    key: 'student',
    title: 'Student',
    eyebrow: 'Learning path',
    description:
      'Learn new skills, attend live classes, submit assignments, earn certificates and track your progress.',
    summary: 'Built for learners who want momentum, structure, and visible progress.',
    features: ['500+ Courses', 'Assignments', 'AI Tutor', 'Certificates', 'Coding Practice', 'Placement Preparation'],
    gradient: 'from-indigo-500 via-blue-500 to-cyan-400',
    ring: 'ring-indigo-500/20',
    accent: 'bg-indigo-500/10 text-indigo-100',
  },
  {
    key: 'instructor',
    title: 'Instructor',
    eyebrow: 'Creator studio',
    description:
      'Create engaging courses, upload content, manage students and analyze learning outcomes.',
    summary: 'Designed for teaching teams that ship polished learning experiences.',
    features: ['Course Builder', 'Video Upload', 'Analytics', 'Assignments', 'Quizzes', 'Live Sessions'],
    gradient: 'from-emerald-500 via-teal-500 to-green-500',
    ring: 'ring-emerald-500/20',
    accent: 'bg-emerald-500/10 text-emerald-100',
  },
  {
    key: 'administrator',
    title: 'Administrator',
    eyebrow: 'Control center',
    description:
      'Manage the complete learning platform, users, permissions, reports and security.',
    summary: 'Made for operators who need clarity, governance, and confidence.',
    features: ['User Management', 'Reports', 'Payments', 'Analytics', 'Course Approval', 'Security'],
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    ring: 'ring-purple-500/20',
    accent: 'bg-purple-500/10 text-purple-100',
  },
]

export const SOCIAL_PROVIDERS: SocialProviderConfig[] = [
  { key: 'google', label: 'Google Workspace', strategy: 'oauth_google', accent: 'bg-white text-slate-900' },
  { key: 'github', label: 'GitHub', strategy: 'oauth_github', accent: 'bg-slate-900 text-white' },
]
