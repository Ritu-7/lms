import React, { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const Companies = () => {
  const { platformHomeData } = useContext(AppContext)

  return (
    <div className='py-16 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 transition-colors duration-500'>
      <div className="text-center mb-12 space-y-3">
        <h2 className="text-3xl font-bold font-space-grotesk text-text-primary transition-colors">Learn from the Best Experts</h2>
        <p className="text-text-secondary max-w-2xl mx-auto transition-colors">
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
              className='group flex items-center gap-4 rounded-2xl border border-card-border bg-card-bg p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-glow-blue hover:border-accent-blue/50 hover:-translate-y-1'
            >
              <div className="relative">
                <img
                  src={educator.imageUrl || undefined}
                  alt={educator.name || 'Educator'}
                  className='h-16 w-16 rounded-full object-cover bg-text-primary/5 ring-2 ring-offset-2 ring-transparent group-hover:ring-accent-blue transition-all duration-300'
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-accent-blue border-2 border-bg-primary transition-colors" />
              </div>
              <div className='text-left'>
                <h3 className='font-bold text-text-primary group-hover:text-accent-blue transition-colors'>
                  {educator.name || 'Educator'}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className='text-xs font-medium text-text-secondary transition-colors'>
                    {educator.courseCount} courses
                  </p>
                  <span className="h-1 w-1 rounded-full bg-card-border transition-colors" />
                  <p className='text-xs font-medium text-text-secondary transition-colors'>
                    {educator.enrollmentCount} students
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className='col-span-full rounded-2xl border border-dashed border-card-border bg-card-bg px-6 py-16 text-center text-sm text-text-secondary transition-colors'>
            No educator data available yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default Companies
