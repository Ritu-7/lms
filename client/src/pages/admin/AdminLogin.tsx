import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../../hooks/useLogin'
import Input from '../../components/auth/Input'
import PasswordInput from '../../components/auth/PasswordInput'
import ForgotPassword from '../../components/auth/ForgotPassword'
import LoadingOverlay from '../../components/auth/LoadingOverlay'
import type { LoginFormValues } from '../../types/auth'

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

const AdminLogin = () => {
  const navigate = useNavigate()
  const {
    completeLogin,
    isSubmitting,
    storedEmail,
    loginError,
    resetPasswordState,
  } = useLogin()
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

  const handleSubmit = form.handleSubmit(async (values) => {
    await completeLogin(values)
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100svh] overflow-hidden bg-slate-950 text-white"
    >
      {/* ── Ambient background ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute left-1/4 top-1/4 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-fuchsia-500/15 blur-[110px]" />
      </div>

      {/* ── Centered card ── */}
      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[480px]"
        >
          {/* Outer glow ring — purple tint */}
          <div className="rounded-[38px] bg-gradient-to-br from-purple-500/[0.15] via-white/[0.06] to-white/[0.02] p-[1px] shadow-[0_8px_32px_rgba(2,6,23,0.6),0_0_0_1px_rgba(168,85,247,0.15)] backdrop-blur-2xl">
            {/* Inner card */}
            <div className="relative overflow-hidden rounded-[37px] bg-slate-950/60 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl sm:px-10 sm:py-10">
              {/* Top highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
              {/* Corner glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

              {/* Back to public login */}
              <div className="mb-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 9H17a1 1 0 110 2H6.414l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to main login
                </Link>
              </div>

              {/* Main form / reset view */}
              <AnimatePresence mode="wait">
                {view === 'reset' ? (
                  <motion.div
                    key="reset-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    <ForgotPassword
                      onBack={() => {
                        resetPasswordState()
                        setView('login')
                      }}
                    />
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

                    {/* Heading */}
                    <div className="space-y-1.5">
                      {/* Shield badge */}
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-500/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-300/80">
                          Admin portal
                        </p>
                      </div>
                      <h1 className="font-space-grotesk text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Administrator access
                      </h1>
                      <p className="text-sm leading-6 text-slate-400">
                        This page is restricted to platform administrators only.
                      </p>
                    </div>

                    {/* Restricted-access notice */}
                    <div className="flex items-start gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs leading-5 text-slate-400">
                        Unauthorised access attempts are logged and may result in account suspension.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <Input
                        id="admin-email"
                        label="Admin email"
                        type="email"
                        placeholder="admin@institution.edu"
                        error={form.formState.errors.email?.message}
                        autoComplete="email"
                        {...form.register('email')}
                      />

                      <PasswordInput
                        id="admin-password"
                        label="Password"
                        placeholder="••••••••"
                        error={form.formState.errors.password?.message}
                        autoComplete="current-password"
                        {...form.register('password')}
                      />

                      {/* Credential-error hint */}
                      <AnimatePresence>
                        {loginError && !form.formState.errors.password ? (
                          <motion.p
                            key="admin-login-error"
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
                              className="font-semibold text-purple-300 underline-offset-2 transition hover:text-purple-200 hover:underline"
                            >
                              Forgot your password?
                            </button>
                          </motion.p>
                        ) : null}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={!form.formState.isValid || isSubmitting}
                        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(147,51,234,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(147,51,234,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            <span>Signing in…</span>
                          </>
                        ) : (
                          <span>Sign in as Administrator</span>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
            Secured by{' '}
            <span className="font-semibold text-slate-400">Clerk</span>
            {' · '}
            <span className="font-semibold text-slate-400">256-bit encryption</span>
          </p>
        </motion.div>
      </section>
    </motion.div>
  )
}

export default AdminLogin
