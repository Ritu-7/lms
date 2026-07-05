import { AnimatePresence, motion } from 'framer-motion'
import { useAuthModal } from '../contexts/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'
import LeftBanner from '../components/auth/LeftBanner'
import RoleSelector from '../components/auth/RoleSelector'
import LoginForm from '../components/auth/LoginForm'

const Login = () => {
  const { isOpen, closeAuth, step, selectedRole, selectRole, theme, toggleTheme } = useAuthModal()



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[100svh] w-full"
    >
      <AuthLayout>
        <div className="relative hidden h-full lg:block">
          <LeftBanner role={selectedRole} />
        </div>

        <section className="relative flex w-full flex-col items-center justify-center bg-white px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
          <div className="absolute right-4 top-4 flex items-center gap-4 sm:right-8 sm:top-8">
            <button type="button" onClick={closeAuth} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <span>Home</span>
            </button>

            <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <span className={`h-2.5 w-2.5 rounded-full ${theme === 'dark' ? 'bg-cyan-400' : 'bg-indigo-500'}`} />
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div key="login" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <LoginForm role={selectedRole} />
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </AuthLayout>
    </motion.div>
  )
}

export default Login
