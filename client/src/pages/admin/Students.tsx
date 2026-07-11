import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import type { AdminTableRow } from './adminData'

const statusLabel = (status?: string) => (status === 'suspended' ? 'Suspended' : 'Active')

const Students = () => {
  const { fetchAdminUsers, updateAdminUserRole, updateAdminUserStatus, deleteAdminUser } = useContext(AppContext)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdminUsers({ role: 'student' })
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }, [fetchAdminUsers])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredRows: AdminTableRow[] = useMemo(() => {
    const query = search.trim().toLowerCase()

    return users
      .filter((user: any) => statusFilter === 'all' || statusLabel(user.status).toLowerCase() === statusFilter)
      .filter((user: any) => {
        if (!query) return true
        return [user.name, user.email, user.clerkUserId].some((value) => String(value || '').toLowerCase().includes(query))
      })
      .map((user: any) => ({
        id: user._id,
        cells: [
          user.name || 'Unnamed student',
          user.email || 'No email',
          'Student',
          `${user.enrolledCourses?.length || 0}`,
          statusLabel(user.status),
        ],
        status: statusLabel(user.status),
        meta: user,
      }))
  }, [search, statusFilter, users])

  const handleAction = async (action: string, row: AdminTableRow) => {
    const user = row.meta as any
    if (!user || actionLoading) return

    if (action === 'View Profile') {
      setSelectedUser(user)
      return
    }

    if (action === 'Promote to Educator') {
      if (!window.confirm(`Promote ${user.name || user.email || 'this student'} to educator?`)) return
      setActionLoading(true)
      try {
        const updated = await updateAdminUserRole(user._id, 'educator')
        if (updated) await loadUsers()
      } finally {
        setActionLoading(false)
      }
      return
    }

    if (action === 'Suspend') {
      const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
      const verb = nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'
      if (!window.confirm(`${verb} ${user.name || user.email || 'this student'}?`)) return
      setActionLoading(true)
      try {
        const updated = await updateAdminUserStatus(user._id, nextStatus)
        if (updated) await loadUsers()
      } finally {
        setActionLoading(false)
      }
      return
    }

    if (action === 'Delete') {
      if (!window.confirm(`Delete ${user.name || user.email || 'this student'} permanently?`)) return
      setActionLoading(true)
      try {
        const deleted = await deleteAdminUser(user._id)
        if (deleted) await loadUsers()
      } finally {
        setActionLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Student Management</h1>
          <p className="mt-1 text-sm text-gray-500">Search, filter, and manage learner accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Search students"
            aria-label="Search students"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
            aria-label="Filter students"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <AdminSection title="Students" description="View, edit, suspend, and remove student accounts.">
        <AdminTable
          columns={["Student", "Email", "Role", "Courses", "Status"]}
          rows={filteredRows}
          rowActions={['View Profile', 'Promote to Educator', 'Suspend', 'Delete']}
          onAction={handleAction}
          emptyMessage={loading ? 'Loading students...' : actionLoading ? 'Updating student...' : 'No student data available.'}
        />
      </AdminSection>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Student Profile</h3>
                <p className="mt-1 text-sm text-gray-500">Read-only profile snapshot for quick review.</p>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Name</p>
                <p className="mt-1 font-semibold text-gray-800">{selectedUser.name || 'Unnamed student'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                <p className="mt-1 font-semibold text-gray-800">{selectedUser.email || 'No email'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Role</p>
                <p className="mt-1 font-semibold text-gray-800">{selectedUser.role || 'student'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
                <p className="mt-1 font-semibold text-gray-800">{statusLabel(selectedUser.status)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">Courses</p>
                <p className="mt-1 font-semibold text-gray-800">{selectedUser.enrolledCourses?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Students
