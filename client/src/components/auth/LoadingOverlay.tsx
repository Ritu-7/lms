import { motion } from 'framer-motion'

const LoadingOverlay = ({ label = 'Authenticating...' }: { label?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-white/70 backdrop-blur-md dark:bg-dk-base/70"
    >
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg dark:border-dk-border dark:bg-dk-surface dark:text-dk-text">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        {label}
      </div>
    </motion.div>
  )
}

export default LoadingOverlay
