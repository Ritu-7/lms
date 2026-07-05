import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthModal } from '../../contexts/AuthContext'
import { AUTH_ROLES, SOCIAL_PROVIDERS } from '../../types/auth'
import type { AuthRoleKey, LoginFormValues } from '../../types/auth'
import { useLogin } from '../../hooks/useLogin'
import Input from './Input'
import PasswordInput from './PasswordInput'
import SocialLoginButton from './SocialLoginButton'
import Divider from './Divider'
import RememberMe from './RememberMe'
import ForgotPassword from './ForgotPassword'
import LoadingOverlay from './LoadingOverlay'
import AuthFooter from './AuthFooter'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Z]/, 'Add one uppercase letter')
    .regex(/[a-z]/, 'Add one lowercase letter')
    .regex(/[0-9]/, 'Add one number'),
  rememberMe: z.boolean().default(true),
})

interface LoginFormProps {
  role: AuthRoleKey
}

const LoginForm = ({ role }: LoginFormProps) => {
  const { selectRole } = useAuthModal()
  const { completeLogin, signInWithProvider, isSubmitting, storedEmail } = useLogin()
  const [view, setView] = useState<'login' | 'reset'>('login')

  const roleConfig = AUTH_ROLES.find((candidateRole) => candidateRole.key === role) || AUTH_ROLES[0]

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: storedEmail,
      password: '',
      rememberMe: Boolean(storedEmail),
    },
  })

  useEffect(() => {
    if (storedEmail) {
      form.setValue('email', storedEmail)
      form.setValue('rememberMe', true)
    }
  }, [form, storedEmail])

  const handleSubmit = form.handleSubmit(async (values) => {
    await completeLogin(values)
  })

  return (
    <AnimatePresence mode="wait">
      {view === 'reset' ? (
        <motion.div
          key="reset-view"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          className="relative"
        >
          <ForgotPassword onBack={() => setView('login')} />
        </motion.div>
      ) : (
        <motion.div
          key="login-view"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          className="relative space-y-8"
        >
          {isSubmitting ? <LoadingOverlay /> : null}

          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-space-grotesk">Welcome back</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {role === 'student' ? 'Continue your learning journey.' : role === 'instructor' ? 'Manage your courses and students.' : 'Oversee platform operations.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10">
            {AUTH_ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => selectRole(r.key)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition-all ${
                  role === r.key
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <span className="capitalize">{r.key === 'administrator' ? 'Admin' : r.key}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@institution.edu"
              error={form.formState.errors.email?.message}
              autoComplete="email"
              {...form.register('email')}
            />

            <div className="relative">
              <PasswordInput
                label="Password"
                placeholder="••••••••"
                error={form.formState.errors.password?.message}
                autoComplete="current-password"
                {...form.register('password')}
              />
              <button
                type="button"
                onClick={() => setView('reset')}
                className="absolute right-0 top-0 text-sm font-medium text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
              >
                Forgot?
              </button>
            </div>

            <div className="flex items-center">
              <RememberMe register={form.register} />
            </div>

            <button
              type="submit"
              disabled={!form.formState.isValid || isSubmitting}
              className="group flex w-full items-center justify-center gap-3 rounded-xl px-4 py-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in to LearnSphere'}</span>
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs font-medium uppercase leading-6">
              <span className="bg-white px-4 text-slate-500 dark:bg-slate-950 dark:text-slate-400">or continue with</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PROVIDERS.map((provider) => (
              <SocialLoginButton key={provider.key} provider={provider} onClick={() => signInWithProvider(provider.strategy)} isLoading={isSubmitting} />
            ))}
          </div>

          <AuthFooter />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoginForm
