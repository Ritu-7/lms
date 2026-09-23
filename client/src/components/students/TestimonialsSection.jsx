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
    return <img src={image} alt={name} className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-transparent group-hover:ring-accent-blue transition-all duration-300" />
  }
  const initials = (name || 'S').charAt(0).toUpperCase()
  const colors = ['bg-accent-blue', 'bg-accent-purple', 'bg-accent-emerald']
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

  const logos = [
    { name: "Google", url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
    { name: "Microsoft", url: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
    { name: "Spotify", url: "https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" },
    { name: "Amazon", url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
    { name: "Netflix", url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  ]

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 mx-auto w-full overflow-hidden transition-colors duration-500">
      
      {/* Logo Marquee */}
      <div className="max-w-[1400px] mx-auto text-center mb-24">
        <p className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-8 transition-colors">Trusted by teams at</p>
        <div className="relative w-full flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-[100px] before:bg-gradient-to-r before:from-bg-primary before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-[100px] after:bg-gradient-to-l after:from-bg-primary after:to-transparent">
          <motion.div 
            className="flex gap-16 min-w-max items-center pr-16"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            {[...logos, ...logos, ...logos, ...logos].map((logo, i) => (
              <img key={i} src={logo.url} alt={logo.name} className="h-7 md:h-8 opacity-40 dark:opacity-60 dark:brightness-200 dark:contrast-200 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 pointer-events-none" />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="text-center mb-16 space-y-4 max-w-[1400px] mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold font-space-grotesk text-text-primary transition-colors"
        >
          Student Success Stories
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-text-secondary max-w-2xl mx-auto text-sm md:text-base transition-colors"
        >
          Hear from our community of learners who have transformed their careers with LearnSphereAI.
        </motion.p>
      </div>

      {/* Testimonials Carousel (Marquee) */}
      <div className="relative w-full max-w-[1800px] mx-auto overflow-hidden py-4">
        {platformHomeData.testimonials.length > 0 ? (
          <div className="relative w-full flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-[50px] md:before:w-[150px] before:bg-gradient-to-r before:from-bg-primary before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-[50px] md:after:w-[150px] after:bg-gradient-to-l after:from-bg-primary after:to-transparent">
            <motion.div 
              className="flex gap-6 min-w-max items-stretch pr-6"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              whileHover={{ animationPlayState: "paused" }}
            >
              {[...platformHomeData.testimonials, ...platformHomeData.testimonials, ...platformHomeData.testimonials].map((testimonial, idx) => (
                <div
                  key={`${testimonial.id}-${idx}`}
                  onClick={() => setSelectedReview(testimonial)}
                  className="group interactive-card cursor-pointer bg-card-bg border border-card-border rounded-2xl p-6 flex flex-col w-[320px] md:w-[380px] shadow-sm hover:border-accent-blue/50 flex-shrink-0"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar name={testimonial.name} image={testimonial.image} />
                    <div className="text-left min-w-0">
                      <h3 className="font-bold text-sm text-text-primary truncate transition-colors">
                        {testimonial.name || 'Student'}
                      </h3>
                      <p className="text-xs text-text-secondary capitalize transition-colors">
                        {testimonial.role || 'Learner'}
                      </p>
                    </div>
                  </div>

                  <StarRating rating={testimonial.rating} />

                  <p className="mt-4 text-sm text-text-secondary italic line-clamp-4 leading-relaxed flex-1 transition-colors">
                    "{testimonial.feedback}"
                  </p>

                  <p className="mt-3 text-xs text-accent-blue font-semibold transition-colors">
                    Read full review →
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto rounded-2xl border border-dashed border-card-border bg-card-bg px-6 py-16 text-center text-sm text-text-secondary transition-colors">
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
              <div className="bg-card-bg rounded-3xl shadow-2xl w-full max-w-lg p-8 pointer-events-auto relative border border-card-border transition-colors">
                {/* Close button */}
                <button
                  onClick={() => setSelectedReview(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-text-primary/5 text-text-secondary hover:bg-text-primary/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Reviewer info */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar name={selectedReview.name} image={selectedReview.image} />
                  <div>
                    <h3 className="font-bold text-text-primary transition-colors">{selectedReview.name || 'Student'}</h3>
                    <p className="text-sm text-text-secondary capitalize transition-colors">{selectedReview.role || 'Learner'}</p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={selectedReview.rating} />
                  <span className="text-sm font-semibold text-text-primary transition-colors">{selectedReview.rating} / 5</span>
                </div>

                {/* Full review text */}
                <p className="text-text-secondary leading-relaxed italic transition-colors">
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
