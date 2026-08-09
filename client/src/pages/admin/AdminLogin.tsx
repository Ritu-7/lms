import { useState, useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import { useLogin } from '../../hooks/useLogin'

// UI Components from Login.tsx
import Home from '../students/Home.jsx'
import Navbar from '../../components/navbar/GlobalNavbar.jsx'
import Logo from '../../components/common/Logo.jsx'

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
  const { isSignedIn } = useUser()
  const { signOut } = useClerk()
  const { userData } = useContext(AppContext)

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

  useEffect(() => {
    if (isSignedIn && userData) {
      if (userData.role === 'admin') {
        navigate('/admin')
      } else {
        toast.error('Access Denied')
        signOut().then(() => {
          navigate('/login')
        })
      }
    }
  }, [isSignedIn, userData, navigate, signOut])

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
      {/* ── Full-screen blurred homepage background ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 scale-[1.04] opacity-60 saturate-150">
          <Navbar />
          <Home />
        </div>
        {/* Dark overlay with deep backdrop-blur */}
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[18px]" />
        {/* Ambient gradient accents */}
        <div className="absolute left-1/4 top-1/4 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-500/15 blur-[100px]" />
      </div>

      {/* ── Centered glassmorphism card ── */}
      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[540px]"
        >
          {/* Outer glow ring */}
          <div className="rounded-[38px] bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-white/[0.02] p-[1px] shadow-[0_8px_32px_rgba(2,6,23,0.6),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl">
            {/* Inner card */}
            <div className="relative overflow-hidden rounded-[37px] bg-slate-950/60 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl sm:px-10 sm:py-10">
              {/* Subtle inner highlight at top */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {/* Corner glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

              {/* Logo → home */}
              <div className="mb-8">
                <Link
                  to="/"
                  className="inline-flex items-center rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                  aria-label="Go to LearnSphereAI home"
                >
                  <Logo light />
                </Link>
              </div>

              {/* Login form content */}
              <div className="w-full">
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

                      {/* ── Heading ───────────────────────────────── */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
                          Secure sign in
                        </p>
                        <h2 className="font-space-grotesk text-3xl font-bold tracking-tight text-white sm:text-4xl">
                          Admin Portal
                        </h2>
                        <p className="text-sm leading-6 text-slate-300">
                          Oversee platform operations.
                        </p>
                      </div>

                      {/* ── Form ──────────────────────────────────── */}
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
                                className="font-semibold text-cyan-300 underline-offset-2 transition hover:text-cyan-200 hover:underline"
                              >
                                Forgot your password?
                              </button>
                            </motion.p>
                          ) : null}
                        </AnimatePresence>

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
                            <span>Sign in as Administrator</span>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bottom privacy note */}
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
