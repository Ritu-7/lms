import React from 'react'
import { motion } from 'framer-motion'
import SearchBar from './SearchBar'

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950 pt-20 pb-16 md:pt-32 md:pb-24">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[120px] dark:bg-blue-600/5" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-400/10 blur-[100px] dark:bg-indigo-600/5" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-sm font-semibold text-blue-600 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400"
          >
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Learn Smarter with AI
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl font-space-grotesk text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl"
          >
            Empower Your Future with <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AI-Powered</span> Learning
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl text-lg text-slate-600 dark:text-slate-400 sm:text-xl"
          >
            Join world-class instructors and a global community to master the skills of tomorrow.
            Learn Sphere AI bridges the gap between knowledge and achievement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            <SearchBar />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-8 opacity-50 grayscale transition-all hover:grayscale-0 dark:invert dark:opacity-30"
          >
            {/* Trusted by companies section - simplified for now */}
            <span className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Trusted by 500+ Companies</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Hero
