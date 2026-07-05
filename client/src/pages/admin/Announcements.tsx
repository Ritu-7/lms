import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Announcements = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">Publish updates, schedule notices, and manage communications.</p>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          Create Announcement
        </button>
      </div>

      <AdminSection title="Announcements" description="Create, edit, delete, and schedule announcements.">
        <AdminTable
          columns={["Announcement", "Audience", "Status", "Schedule"]}
          rows={adminOverview.announcements}
          rowActions={['Create', 'Edit', 'Delete', 'Schedule']}
          emptyMessage="No announcement data available."
        />
      </AdminSection>
    </div>
  )
}

export default Announcements
