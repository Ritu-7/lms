import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Courses = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Course Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review approvals, publishing status, and course performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="Search courses" aria-label="Search courses" />
          <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" aria-label="Filter courses">
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
