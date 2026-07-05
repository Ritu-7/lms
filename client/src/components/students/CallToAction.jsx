import React from 'react'
import { assets } from '../../assets/assets'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Link } from "react-router-dom";
import { useAuthModal } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'

const CallToAction = () => {
  const { openAuth } = useAuthModal()
  const { isSignedIn } = useUser()
  const navigate = useNavigate()

  const handlePrimaryCTA = () => {
    if (isSignedIn) {
      navigate('/educator/dashboard')
    } else {
      openAuth('student')
    }
  }

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Gradient Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[120px] rounded-full -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative z-10 mx-auto max-w-4xl text-center space-y-8"
      >
        <h2 className="text-3xl md:text-5xl font-bold font-space-grotesk text-slate-900 dark:text-white leading-tight">
          Ready to Elevate Your <span className="text-blue-600 dark:text-blue-400">Learning Experience?</span>
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          Access industry-ready courses, expert-led content, and smart learning tools — all in one powerful platform. Join thousands of learners today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg shadow-blue-600/25 active:scale-95"
            onClick={handlePrimaryCTA}
          >
            {isSignedIn ? "Go to Dashboard" : "Start Learning Now"}
          </button>

          <Link
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-200"
            to="/course-list"
          >
            Explore Platform
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

export default CallToAction
