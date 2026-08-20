import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
)

const Avatar = ({ name, image }) => {
  if (image) {
    return <img src={image} alt={name} className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300" />
  }
  const initials = (name || 'S').charAt(0).toUpperCase()
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500']
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
      {initials}
    </div>
  )
}

const TestimonialsSection = () => {
  const { platformHomeData } = useContext(AppContext)
  const [selectedReview, setSelectedReview] = useState(null)

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
      <div className="text-center mb-16 space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text"
        >
          Student Success Stories
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 dark:text-dk-text-2 max-w-2xl mx-auto text-sm md:text-base"
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
              onClick={() => setSelectedReview(testimonial)}
              className="group cursor-pointer bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border rounded-2xl p-6 flex flex-col h-full shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 mb-6">
                <Avatar name={testimonial.name} image={testimonial.image} />
                <div className="text-left min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-dk-text truncate">
                    {testimonial.name || 'Student'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-dk-text-2 capitalize">
                    {testimonial.role || 'Learner'}
                  </p>
                </div>
              </div>

              <StarRating rating={testimonial.rating} />

              <p className="mt-4 text-sm text-slate-600 dark:text-dk-text-2 italic line-clamp-4 leading-relaxed flex-1">
                "{testimonial.feedback}"
              </p>

              <p className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                Read full review →
              </p>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-dk-surface px-6 py-16 text-center text-sm text-slate-500 dark:text-dk-text-2">
            No reviews have been submitted yet.
          </div>
        )}
      </div>

      {/* Full Review Modal */}
      <AnimatePresence>
        {selectedReview && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-dk-surface rounded-3xl shadow-2xl w-full max-w-lg p-8 pointer-events-auto relative">
                {/* Close button */}
                <button
                  onClick={() => setSelectedReview(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-dk-surface-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Reviewer info */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar name={selectedReview.name} image={selectedReview.image} />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-dk-text">{selectedReview.name || 'Student'}</h3>
                    <p className="text-sm text-slate-500 dark:text-dk-text-2 capitalize">{selectedReview.role || 'Learner'}</p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={selectedReview.rating} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-dk-text">{selectedReview.rating} / 5</span>
                </div>

                {/* Full review text */}
                <p className="text-slate-700 dark:text-dk-text-2 leading-relaxed italic">
                  "{selectedReview.feedback}"
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TestimonialsSection
