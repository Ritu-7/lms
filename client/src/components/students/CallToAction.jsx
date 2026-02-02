import React from 'react'
import { assets } from '../../assets/assets'
import { useClerk, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Link } from "react-router-dom";

const CallToAction = () => {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useUser()
  const navigate = useNavigate()

  const handlePrimaryCTA = () => {
    if (isSignedIn) {
      navigate('/educator/dashboard')
    } else {
      openSignIn()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 pt-10 pb-24 px-8 md:px-0 text-center">
      
      <h1 className="text-xl md:text-4xl text-gray-800 font-semibold">
        Learn Anything, Anytime, Anywhere
      </h1>

      <p className="text-gray-500 sm:text-sm max-w-2xl">
        Access industry-ready courses, expert-led content, and smart learning tools — all in one powerful platform.
      </p>

      <div className="flex items-center font-medium gap-6 mt-4">

        {/* Primary CTA */}
        <button
          className="px-10 py-3 rounded-md text-white bg-blue-600
                     hover:bg-blue-700 transition-all duration-300
                     shadow-md hover:shadow-lg"
          onClick={handlePrimaryCTA}
        >
          {isSignedIn ? "Go to Dashboard" : "Start Learning"}
        </button>

        {/* Secondary CTA */}
        <Link
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
          to="/course-list"
        >
          Explore Platform
          <img src={assets.arrow_icon} alt="arrow icon" className="w-4 h-4"/>
        </Link>

      </div>
    </div>
  )
}

export default CallToAction
