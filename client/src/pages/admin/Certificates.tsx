import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Certificates = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Certificate Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Issue, review, and export learner certificates.</p>
        </div>
      </div>

      <AdminSection title="Certificates" description="Monitor certificate issuance and download workflows.">
        <AdminTable
          columns={["Learner", "Course", "Status", "Action"]}
          rows={adminOverview.certificates}
          rowActions={['View', 'Download', 'Delete']}
          emptyMessage="No certificate data available."
        />
      </AdminSection>
    </div>
  )
}

export default Certificates
