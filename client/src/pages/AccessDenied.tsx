import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const AccessDenied = () => {
  const { isSignedIn } = useUser()
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-[100svh] overflow-hidden bg-slate-950 text-white"
    >
      {/* Ambient glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/15 blur-[130px]" />
        <div className="absolute bottom-0 right-1/3 h-[380px] w-[380px] translate-x-1/2 translate-y-1/2 rounded-full bg-rose-500/10 blur-[110px]" />
      </div>

      <section className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[460px]"
        >
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 ring-1 ring-red-500/25">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Copy */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-400/80">
            Access denied
          </p>
          <h1 className="mb-3 font-space-grotesk text-4xl font-bold tracking-tight text-white sm:text-5xl">
            403
          </h1>
          <p className="mb-2 text-lg font-semibold text-slate-200">
            You don't have permission to view this page.
          </p>
          <p className="mb-8 text-sm leading-6 text-slate-400">
            Your account doesn't have the role required to access this area.
            If you believe this is an error, please contact your administrator.
          </p>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 9H17a1 1 0 110 2H6.414l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Go back
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(37,99,235,0.4)]"
            >
              Back to home
            </Link>
          </div>

          {/* Context-aware login link */}
          {!isSignedIn && (
            <p className="mt-6 text-xs text-slate-500">
              Not signed in?{' '}
              <Link
                to="/login"
                className="font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Sign in here
              </Link>
            </p>
          )}
        </motion.div>
      </section>
    </motion.div>
  )
}

export default AccessDenied
