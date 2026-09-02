import { Outlet } from 'react-router-dom'
import AdminTopbar from '../../components/admin/AdminTopbar'
import AdminSidebar from '../../components/admin/AdminSidebar'

const AdminLayout = () => {
  return (
    <div className="text-default min-h-screen bg-slate-50 dark:bg-dk-base text-slate-900 dark:text-dk-text flex flex-col transition-colors duration-200">
      <AdminTopbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0D0D10]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
