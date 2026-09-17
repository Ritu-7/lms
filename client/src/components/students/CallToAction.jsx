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
    <section className="relative w-full py-28 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-500">
      {/* Background Gradient Blob / Pulsing Glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full max-w-5xl h-full max-h-[400px] bg-gradient-to-r from-accent-blue via-accent-purple to-accent-emerald blur-[100px] rounded-full" 
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl text-center space-y-8 bg-card-bg/80 backdrop-blur-xl border border-card-border p-10 md:p-16 rounded-[3rem] shadow-2xl transition-colors"
      >
        <h2 className="text-3xl md:text-5xl font-bold font-space-grotesk text-text-primary leading-tight transition-colors">
          Ready to Elevate Your <br className="hidden sm:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple">Learning Experience?</span>
        </h2>

        <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto transition-colors">
          Access industry-ready courses, expert-led content, and smart learning tools — all in one powerful platform. Join thousands of learners today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors font-semibold shadow-lg shadow-glow-blue"
            onClick={handlePrimaryCTA}
          >
            {isSignedIn ? "Go to Dashboard" : "Start Learning Now"}
          </motion.button>

          <Link
            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-text-primary font-semibold border border-card-border bg-card-bg hover:border-accent-blue/50 transition-colors shadow-sm hover:shadow-lg hover:shadow-glow-blue"
            to="/course-list"
          >
            Explore Platform
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

export default CallToAction
