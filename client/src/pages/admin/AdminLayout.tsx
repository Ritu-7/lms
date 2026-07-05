import { Outlet } from 'react-router-dom'
import AdminTopbar from '../../components/admin/AdminTopbar'
import AdminSidebar from '../../components/admin/AdminSidebar'

const AdminLayout = () => {
  return (
    <div className="text-default min-h-screen bg-gray-50 flex flex-col">
      <AdminTopbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
