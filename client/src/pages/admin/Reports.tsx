import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Reports = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Generate structured reports for students, educators, courses, and enrollments.</p>
        </div>
      </div>

      <AdminSection title="Reports" description="View, download, and archive platform reports.">
        <AdminTable
          columns={["Report", "Focus", "Status", "Action"]}
          rows={adminOverview.reports}
          rowActions={['View', 'Download', 'Archive']}
          emptyMessage="No report data available."
        />
      </AdminSection>
    </div>
  )
}

export default Reports
