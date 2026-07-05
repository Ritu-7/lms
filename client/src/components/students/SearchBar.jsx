import React, { useState } from 'react'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const SearchBar = ({ data }) => {

  const navigate = useNavigate()
  const [input, setInput] = useState(data?data:'')

  const onSearchHandler = (e) => {
    e.preventDefault()
    navigate('/course-list/' + input)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full max-w-2xl mx-auto"
    >
      <form
        onSubmit={onSearchHandler}
        className="group flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-1.5 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
      >
        <div className="flex items-center justify-center pl-4 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>

        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="Search for courses, skills, or mentors..."
          className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-blue-600/20"
        >
          Search
        </button>
      </form>
    </motion.div>
  )
}

export default SearchBar

