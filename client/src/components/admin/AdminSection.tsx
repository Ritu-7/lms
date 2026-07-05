import type { ReactNode } from 'react'

interface AdminSectionProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

const AdminSection = ({ title, description, actions, children }: AdminSectionProps) => {
  return (
    <section className="rounded-md border border-gray-500/20 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-500/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-800">{title}</h2>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export default AdminSection
