import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthModal } from '../../contexts/AuthContext'
import { AUTH_ROLES, PUBLIC_AUTH_ROLES, SOCIAL_PROVIDERS } from '../../types/auth'
import type { AuthRoleKey, LoginFormValues } from '../../types/auth'
import { useLogin } from '../../hooks/useLogin'
import Input from './Input'
import PasswordInput from './PasswordInput'
import SocialLoginButton from './SocialLoginButton'
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
  rememberMe: z.boolean(),
})

interface LoginFormProps {
  role: AuthRoleKey
  onSwitchToSignUp?: () => void
}

const LoginForm = ({ role, onSwitchToSignUp }: LoginFormProps) => {
  const { selectRole } = useAuthModal()
  const { completeLogin, signInWithProvider, isSubmitting, storedEmail, loginError } = useLogin()
  const [view, setView] = useState<'login' | 'reset'>('login')

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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative"
        >
          <ForgotPassword onBack={() => setView('login')} />
        </motion.div>
      ) : (
        <motion.div
          key="login-view"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative space-y-6"
        >
          {isSubmitting ? <LoadingOverlay /> : null}

          {/* ── Heading ───────────────────────────────── */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-cyan-300/80">
              Secure sign in
            </p>
            <h2 className="font-space-grotesk text-3xl font-bold tracking-tight text-slate-900 dark:text-dk-text sm:text-4xl">
              Welcome back
            </h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-dk-text-2">
              {role === 'student'
                ? 'Continue your learning journey.'
                : role === 'instructor'
                  ? 'Manage your courses and students.'
                  : 'Oversee platform operations.'}
            </p>
          </div>

          {/* ── Role selector ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 dark:border-dk-border bg-slate-100/60 dark:bg-dk-surface-2 p-1.5 shadow-inner shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
            {PUBLIC_AUTH_ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => selectRole(r.key)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-[18px] py-3 text-xs font-semibold transition-all duration-200 ${
                  role === r.key
                    ? 'bg-white text-slate-950 shadow-[0_8px_24px_rgba(15,23,42,0.15)]'
                    : 'text-slate-500 dark:text-dk-text-2 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="capitalize">{r.key}</span>
              </button>
            ))}
          </div>

          {/* ── Form ──────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@institution.edu"
              error={form.formState.errors.email?.message}
              autoComplete="email"
              {...form.register('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="••••••••"
              error={form.formState.errors.password?.message}
              autoComplete="current-password"
              {...form.register('password')}
            />

            {/* Inline credential-error hint — only shown after a failed attempt */}
            <AnimatePresence>
              {loginError && !form.formState.errors.password ? (
                <motion.p
                  key="login-error-hint"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="-mt-2 text-xs text-red-400"
                >
                  Incorrect email or password.{' '}
                  <button
                    type="button"
                    onClick={() => setView('reset')}
                  className="font-semibold text-blue-600 dark:text-cyan-300 underline-offset-2 transition hover:text-blue-500 dark:hover:text-cyan-200 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </motion.p>
              ) : null}
            </AnimatePresence>

            {/* Remember me */}
            <RememberMe register={form.register} />

            {/* Submit */}
            <button
              type="submit"
              disabled={!form.formState.isValid || isSubmitting}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(37,99,235,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign in to LearnSphere</span>
              )}
            </button>
          </form>

          {/* ── Divider ───────────────────────────────── */}
          <div className="relative flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
              or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* ── Social logins ─────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PROVIDERS.map((provider) => (
              <SocialLoginButton
                key={provider.key}
                provider={provider}
                onClick={() => signInWithProvider(provider.strategy)}
                isLoading={isSubmitting}
              />
            ))}
          </div>

          {/* ── Sign up nudge ──────────────────────────── */}
          {onSwitchToSignUp && (
            <p className="text-center text-sm text-slate-500 dark:text-dk-text-2">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="font-semibold text-blue-600 dark:text-cyan-300 transition hover:text-blue-500 dark:hover:text-cyan-200 hover:underline underline-offset-2"
              >
                Create account
              </button>
            </p>
          )}

          {/* ── Footer ────────────────────────────────── */}
          <AuthFooter />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoginForm
