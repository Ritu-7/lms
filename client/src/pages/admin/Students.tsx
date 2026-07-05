import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Students = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Student Management</h1>
          <p className="mt-1 text-sm text-gray-500">Search, filter, and manage learner accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="Search students" aria-label="Search students" />
          <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" aria-label="Filter students">
            <option>All statuses</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <AdminSection title="Students" description="View, edit, suspend, and remove student accounts.">
        <AdminTable
          columns={["Student", "Email", "Track", "Courses", "Status"]}
          rows={adminOverview.students}
          rowActions={['View', 'Edit', 'Suspend', 'Delete']}
          emptyMessage="No student data available."
        />
      </AdminSection>
    </div>
  )
}

export default Students
