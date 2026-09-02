interface AdminStatCardProps {
  label: string
  value: string
  helper: string
  icon: string
}

const AdminStatCard = ({ label, value, helper, icon }: AdminStatCardProps) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-sm">
      <img src={icon} alt="" className="w-12 shrink-0" />
      <div>
        <p className="text-2xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">{value}</p>
        <p className="text-sm font-medium text-slate-500 dark:text-dk-text-2">{label}</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-dk-text-3">{helper}</p>
      </div>
    </div>
  )
}

export default AdminStatCard

