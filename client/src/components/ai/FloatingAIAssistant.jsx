import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, X, Minimize2 } from 'lucide-react'
import AITutorWidget from './AITutorWidget'

const HIDDEN_ROUTES = [
  '/ai-tutor',
  '/login',
  '/signup',
  '/admin/login',
  '/sso-callback',
  '/access-denied',
]

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isHidden = HIDDEN_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  )

  useEffect(() => {
    if (isHidden) setIsOpen(false)
  }, [isHidden])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  if (isHidden) return null

  const handleOpenFull = () => {
    setIsOpen(false)
    navigate('/ai-tutor')
  }

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9997] bg-black/20 backdrop-blur-[2px] sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.8,
              }}
              style={{ transformOrigin: 'bottom right' }}
              className="fixed z-[9998] flex flex-col overflow-hidden
                inset-x-0 bottom-0 h-[85vh] rounded-t-3xl
                sm:inset-x-auto sm:bottom-24 sm:right-6 sm:left-auto
                sm:w-[400px] sm:h-[580px] sm:max-h-[calc(100vh-8rem)] sm:rounded-2xl
                border border-slate-200/80 dark:border-dk-border
                bg-white/95 dark:bg-dk-surface backdrop-blur-xl
                shadow-2xl shadow-black/10 dark:shadow-black/50"
            >
              {/* Panel Header */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-indigo-600/5 via-blue-600/5 to-cyan-500/5 dark:from-indigo-500/10 dark:via-blue-500/10 dark:to-cyan-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25">
                      <Brain size={16} className="text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-dk-surface" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-space-grotesk text-slate-900 dark:text-dk-text leading-none">
                      AI Tutor
                    </h2>
                    <p className="text-[10px] text-slate-400 dark:text-dk-text-3 mt-0.5">
                      Powered by LearnSphereAI
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-dk-text-3 transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 size={15} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 dark:text-dk-text-3 transition-colors"
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Chat Widget */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <AITutorWidget onOpenFull={handleOpenFull} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Orb */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999]">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              key="orb-tooltip"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: 1.5, duration: 0.3 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none"
            >
              <div className="whitespace-nowrap rounded-xl bg-slate-900 dark:bg-dk-surface-2 text-white text-xs font-medium px-3 py-1.5 shadow-lg">
                Ask AI Tutor
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 h-2 w-2 bg-slate-900 dark:bg-dk-surface-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close AI Tutor' : 'Open AI Tutor'}
          aria-expanded={isOpen}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dk-base rounded-full"
        >
          {/* Outer glow pulse */}
          <motion.div
            className="absolute -inset-3 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 opacity-40 blur-xl"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.3, 0.55, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Mid glow ring */}
          <motion.div
            className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-indigo-400/60 via-blue-400/60 to-cyan-300/60 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"
          />

          {/* Ping ring */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full">
              <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
            </span>
          )}

          {/* Orb body */}
          <motion.div
            animate={isOpen ? { rotate: 0 } : { rotate: [0, 0] }}
            className={`relative h-14 w-14 sm:h-[60px] sm:w-[60px] rounded-full flex items-center justify-center shadow-xl transition-shadow duration-300 ${
              isOpen
                ? 'bg-slate-700 dark:bg-dk-surface-2 shadow-slate-900/30'
                : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-blue-600/40 group-hover:shadow-blue-500/60 group-hover:shadow-2xl'
            }`}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} className="text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="brain"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Brain size={26} className="text-white drop-shadow-sm" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-1 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md"
                  >
                    <Sparkles size={9} className="text-white" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.button>
      </div>
    </>
  )
}

export default FloatingAIAssistant

