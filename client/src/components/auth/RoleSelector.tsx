import { motion } from 'framer-motion'
import RoleCard from './RoleCard'
import { AUTH_ROLES } from '../../types/auth'
import type { AuthRoleKey } from '../../types/auth'

interface RoleSelectorProps {
  onSelect: (role: AuthRoleKey) => void
}

const RoleSelector = ({ onSelect }: RoleSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Get Started</p>
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white font-space-grotesk sm:text-5xl">
          Choose Your Path
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          Select your workspace to get personalized tools, insights, and content tailored to your goals.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
        {AUTH_ROLES.map((role) => (
          <RoleCard key={role.key} role={role} onSelect={onSelect} />
        ))}
      </div>
    </motion.div>
  )
}

export default RoleSelector
