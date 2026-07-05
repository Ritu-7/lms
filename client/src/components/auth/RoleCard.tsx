import { motion } from 'framer-motion'
import type { AuthRoleConfig } from '../../types/auth'

interface RoleCardProps {
  role: AuthRoleConfig
  onSelect: (role: AuthRoleConfig['key']) => void
}

const iconByRole: Record<AuthRoleConfig['key'], JSX.Element> = {
  student: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path fill="currentColor" d="m12 3 9 5-9 5-9-5 9-5Zm-7 8v5c0 2.2 3.1 4 7 4s7-1.8 7-4v-5l-7 4-7-4Z" />
    </svg>
  ),
  instructor: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path fill="currentColor" d="M4 5h16v10H4V5Zm2 2v6h12V7H6Zm14 12H4v-2h16v2Z" />
    </svg>
  ),
  administrator: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm3.6 7.3-4.4 4.4-2.8-2.8 1.4-1.4 1.4 1.4 3-3 1.4 1.4Z" />
    </svg>
  ),
}

const RoleCard = ({ role, onSelect }: RoleCardProps) => {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(role.key)}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 p-5 text-left shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-2xl transition ${role.ring}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 transition duration-300 group-hover:opacity-20`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${role.accent}`}>
            {role.eyebrow}
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">{role.title}</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-200/80">{role.description}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner shadow-white/10">
          {iconByRole[role.key]}
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {role.features.map((feature) => (
          <span key={feature} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            {feature}
          </span>
        ))}
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-slate-100/80 backdrop-blur">
        {role.summary}
      </div>
    </motion.button>
  )
}

export default RoleCard
