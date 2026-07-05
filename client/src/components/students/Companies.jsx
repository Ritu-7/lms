import React, { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const Companies = () => {
  const { platformHomeData } = useContext(AppContext)

  return (
    <div className='py-16 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8'>
      <div className="text-center mb-12 space-y-3">
        <h2 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">Learn from the Best Experts</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Our platform hosts world-class educators who are industry leaders in their fields.
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {platformHomeData.topEducators.length > 0 ? (
          platformHomeData.topEducators.map((educator, idx) => (
            <motion.div 
              key={educator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className='group flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-1'
            >
              <div className="relative">
                <img
                  src={educator.imageUrl || undefined}
                  alt={educator.name || 'Educator'}
                  className='h-16 w-16 rounded-full object-cover bg-slate-100 dark:bg-slate-800 ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300'
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
              </div>
              <div className='text-left'>
                <h3 className='font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                  {educator.name || 'Educator'}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                    {educator.courseCount} courses
                  </p>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <p className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                    {educator.enrollmentCount} students
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className='col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-white/5 px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400'>
            No educator data available yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default Companies
