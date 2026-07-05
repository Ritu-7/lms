import { motion } from 'framer-motion'

const GradientBlob = () => {
  return (
    <motion.div
      aria-hidden="true"
      animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.55),rgba(37,99,235,0.22),transparent_70%)] blur-3xl"
    />
  )
}

export default GradientBlob
