import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Assignments = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Assignment Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Monitor assignments, deadlines, and course-level assessment workflows.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3" placeholder="Search assignments" aria-label="Search assignments" />
          <select className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500" aria-label="Filter assignments">
            <option>All statuses</option>
            <option>Open</option>
            <option>Closed</option>
          </select>
        </div>
      </div>

      <AdminSection title="Assignments" description="Create, edit, and remove assignment records.">
        <AdminTable
          columns={["Assignment", "Course", "Deadline", "Submissions", "Status"]}
          rows={adminOverview.assignments}
          rowActions={['View', 'Edit', 'Delete']}
          emptyMessage="No assignment data available."
        />
      </AdminSection>
    </div>
  )
}

export default Assignments

