import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Enrollments = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Enrollment Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Track learner purchases, enrollment states, and access status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3" placeholder="Search enrollments" aria-label="Search enrollments" />
          <select className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500" aria-label="Filter enrollments">
            <option>All statuses</option>
            <option>Paid</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      <AdminSection title="Enrollments" description="Search, filter, and review course enrollment activity.">
        <AdminTable
          columns={["Learner", "Course", "Payment", "Date", "Status"]}
          rows={adminOverview.enrollments}
          rowActions={['View', 'Edit', 'Delete']}
          emptyMessage="No enrollment data available."
        />
      </AdminSection>
    </div>
  )
}

export default Enrollments

