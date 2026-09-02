import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Categories = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Category Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Create and maintain course categories across the LMS.</p>
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-all duration-200">
          Create Category
        </button>
      </div>

      <AdminSection title="Categories" description="Create, read, update, and delete category records.">
        <AdminTable
          columns={["Category", "Courses", "Status"]}
          rows={adminOverview.categories}
          rowActions={['Read', 'Update', 'Delete']}
          emptyMessage="No category data available."
        />
      </AdminSection>
    </div>
  )
}

export default Categories
