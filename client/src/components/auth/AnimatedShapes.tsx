import { motion } from 'framer-motion'

const AnimatedShapes = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ rotate: [0, 18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-8 top-12 h-32 w-32 rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur-md"
      />
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-8 bottom-16 h-24 w-24 rounded-full border border-cyan-300/20 bg-cyan-400/10 blur-[1px]"
      />
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-24 bottom-10 h-16 w-16 rounded-[1.35rem] border border-indigo-300/20 bg-indigo-400/10"
      />
    </div>
  )
}

export default AnimatedShapes
