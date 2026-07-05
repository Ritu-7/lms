import { motion } from 'framer-motion'

interface FeatureCardProps {
  title: string
  description: string
  accent: string
  icon: string
}

const FeatureCard = ({ title, description, accent, icon }: FeatureCardProps) => {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} className="rounded-3xl border border-white/10 bg-white/10 p-4 text-left shadow-[0_12px_40px_rgba(15,23,42,0.2)] backdrop-blur-xl">
      <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>{icon}</div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="mt-1 text-xs leading-5 text-slate-200/80">{description}</p>
    </motion.div>
  )
}

export default FeatureCard
