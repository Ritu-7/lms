import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Courses = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Course Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Review approvals, publishing status, and course performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3" placeholder="Search courses" aria-label="Search courses" />
          <select className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500" aria-label="Filter courses">
            <option>All statuses</option>
            <option>Published</option>
            <option>Draft</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      <AdminSection title="Courses" description="Approve, reject, publish, unpublish, or delete courses.">
        <AdminTable
          columns={["Course", "Educator", "Enrollments", "Status", "Price"]}
          rows={adminOverview.courses}
          rowActions={['Approve', 'Reject', 'Publish', 'Unpublish', 'Delete']}
          emptyMessage="No course data available."
        />
      </AdminSection>
    </div>
  )
}

export default Courses

