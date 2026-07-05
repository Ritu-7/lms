import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const TestimonialsSection = () => {
  const { platformHomeData } = useContext(AppContext)

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      <div className="text-center mb-16 space-y-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold font-space-grotesk text-slate-900 dark:text-white"
        >
          Student Success Stories
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm md:text-base"
        >
          Hear from our community of learners who have transformed their careers with LearnSphereAI.
        </motion.p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {platformHomeData.testimonials.length > 0 ? (
          platformHomeData.testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col h-full shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image || undefined}
                  alt={testimonial.name || 'Student'}
                  className="w-12 h-12 rounded-full object-cover bg-slate-100 dark:bg-slate-800 ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300"
                />
                <div className="text-left">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {testimonial.name || 'Student'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {testimonial.role || 'Learner'}
                  </p>
                </div>
              </div>

              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, starIndex) => (
                  <img
                    key={starIndex}
                    src={starIndex < Math.floor(testimonial.rating) ? assets.star : assets.star_blank}
                    alt="star"
                    className="w-3.5 h-3.5"
                  />
                ))}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 italic line-clamp-4 leading-relaxed">
                "{testimonial.feedback}"
              </p>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-white/5 px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            No reviews have been submitted yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default TestimonialsSection
