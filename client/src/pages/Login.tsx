import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useAuthModal } from '../contexts/AuthContext'
import Home from './students/Home.jsx'
import Navbar from '../components/navbar/GlobalNavbar.jsx'
import Logo from '../components/common/Logo.jsx'
import LoginForm from '../components/auth/LoginForm'
import SignUpForm from '../components/auth/SignUpForm'

type AuthView = 'login' | 'signup'

const Login = () => {
  const { selectedRole } = useAuthModal()
  const location = useLocation()
  const [view, setView] = useState<AuthView>(
    location.pathname === '/signup' ? 'signup' : 'login'
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100svh] overflow-hidden bg-white dark:bg-dk-base text-slate-900 dark:text-dk-text"
    >
      {/* ── Full-screen blurred homepage background ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 scale-[1.04] opacity-60 saturate-150">
          <Navbar />
          <Home />
        </div>
        {/* Light mode: white frosted overlay | Dark mode: deep slate overlay */}
        <div className="absolute inset-0 bg-white/70 dark:bg-[#09090B]/65 backdrop-blur-[18px]" />
        {/* Ambient gradient accents */}
        <div className="absolute left-1/4 top-1/4 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/15 dark:bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-400/10 dark:bg-cyan-500/15 blur-[100px]" />
      </div>

      {/* ── Centered glassmorphism card ── */}
      <section className="relative z-10 flex min-h-[100svh] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[540px]"
        >
          {/* Outer glow ring — adapts border color per theme */}
          <div className="rounded-[38px] bg-gradient-to-br from-slate-200/60 via-slate-100/30 to-slate-50/10 dark:from-white/[0.12] dark:via-white/[0.06] dark:to-white/[0.02] p-[1px] shadow-[0_8px_32px_rgba(2,6,23,0.12)] dark:shadow-[0_8px_32px_rgba(2,6,23,0.6),0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl">
            {/* Inner card */}
            <div className="relative overflow-hidden rounded-[37px] bg-white/80 dark:bg-[#09090B]/60 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-3xl sm:px-10 sm:py-10">
              {/* Subtle inner highlight at top */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 dark:via-white/20 to-transparent" />
              {/* Corner glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />

              {/* ── Logo + Tab toggle row ── */}
              <div className="mb-7 flex items-center justify-between gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                  aria-label="Go to LearnSphereAI home"
                >
                  {/* Show dark logo in light mode, light logo in dark mode */}
                  <span className="block dark:hidden"><Logo /></span>
                  <span className="hidden dark:block"><Logo light /></span>
                </Link>

                {/* Tab toggle pill */}
                <div className="flex rounded-2xl border border-slate-200 dark:border-dk-border bg-slate-100/80 dark:bg-dk-surface-2 p-1 gap-1 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                      view === 'login'
                        ? 'bg-white dark:bg-white text-slate-900 shadow-md'
                        : 'text-slate-500 dark:text-dk-text-2 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('signup')}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                      view === 'signup'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md'
                        : 'text-slate-500 dark:text-dk-text-2 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Form area — animated toggle between login & signup */}
              <div className="w-full">
                <AnimatePresence mode="wait">
                  {view === 'login' ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <LoginForm
                        role={selectedRole}
                        onSwitchToSignUp={() => setView('signup')}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <SignUpForm onSwitchToLogin={() => setView('login')} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bottom privacy note */}
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-400 dark:text-slate-500">
            Secured by{' '}
            <span className="font-semibold text-slate-500 dark:text-dk-text-2">Clerk</span>
            {' · '}
            <span className="font-semibold text-slate-500 dark:text-dk-text-2">256-bit encryption</span>
          </p>
        </motion.div>
      </section>
    </motion.div>
  )
}

export default Login
