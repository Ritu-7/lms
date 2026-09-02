import type { ReactNode } from 'react'

interface AdminSectionProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

const AdminSection = ({ title, description, actions, children }: AdminSectionProps) => {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-dk-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-dk-surface-2/30">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-dk-text font-space-grotesk">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

export default AdminSection

