import { Outlet } from 'react-router-dom'
import AdminTopbar from '../../components/admin/AdminTopbar'
import AdminSidebar from '../../components/admin/AdminSidebar'

const AdminLayout = () => {
  return (
    <div className="text-default flex h-screen min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-dk-base dark:text-dk-text">
      <AdminTopbar />
      <div className="flex min-h-0 flex-1 items-start overflow-hidden">
        <AdminSidebar />
        <main className="h-full min-w-0 min-h-0 flex-1 basis-0 overflow-auto bg-slate-50 dark:bg-dk-base">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
