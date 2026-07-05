import { motion } from 'framer-motion'

const particles = [
  'left-8 top-12 h-2 w-2',
  'left-24 top-28 h-1.5 w-1.5',
  'right-12 top-16 h-2.5 w-2.5',
  'right-16 bottom-20 h-1.5 w-1.5',
  'left-1/2 top-24 h-2 w-2',
  'left-[20%] bottom-24 h-1.5 w-1.5',
  'right-[30%] top-[48%] h-2 w-2',
  'left-[42%] bottom-[18%] h-1.5 w-1.5',
]

const ParticleBackground = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((className, index) => (
        <motion.span
          key={className}
          animate={{ y: [0, -10, 0], opacity: [0.3, 0.9, 0.3], scale: [1, 1.25, 1] }}
          transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute rounded-full bg-white/70 ${className}`}
        />
      ))}
    </div>
  )
}

export default ParticleBackground
