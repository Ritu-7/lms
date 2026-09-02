interface AdminEmptyStateProps {
  title: string
  description: string
}

const AdminEmptyState = ({ title, description }: AdminEmptyStateProps) => {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-dk-border bg-slate-50/50 dark:bg-dk-surface/50 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-slate-800 dark:text-dk-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-dk-text-2">{description}</p>
    </div>
  )
}

export default AdminEmptyState