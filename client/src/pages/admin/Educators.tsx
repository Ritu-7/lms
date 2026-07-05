import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Educators = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Educator Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review approvals and manage instructor accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="Search educators" aria-label="Search educators" />
          <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500" aria-label="Filter educators">
            <option>All statuses</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <AdminSection title="Educators" description="Approve, reject, edit, suspend, or delete instructors.">
        <AdminTable
          columns={["Educator", "Email", "Specialty", "Approval", "Status"]}
          rows={adminOverview.educators}
          rowActions={['Approve', 'Reject', 'Edit', 'Suspend', 'Delete']}
          emptyMessage="No educator data available."
        />
      </AdminSection>
    </div>
  )
}

export default Educators
