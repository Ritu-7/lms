import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthModal } from '../contexts/AuthContext'
import Home from './students/Home.jsx'
import Navbar from '../components/navbar/GlobalNavbar.jsx'
import Logo from '../components/common/Logo.jsx'
import LoginForm from '../components/auth/LoginForm'

const Login = () => {
  const { selectedRole } = useAuthModal()

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
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <LoginForm role={selectedRole} />
                  </motion.div>
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

export default Login
