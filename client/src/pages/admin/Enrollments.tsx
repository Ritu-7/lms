import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Enrollments = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Enrollment Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track learner purchases, enrollment states, and access status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="Search enrollments" aria-label="Search enrollments" />
          <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" aria-label="Filter enrollments">
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
