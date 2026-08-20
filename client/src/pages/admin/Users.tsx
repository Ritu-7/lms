import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import EditRoleModal, { type AdminUserRecord } from '../../components/admin/EditRoleModal'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { roleLabel } from '../../utils/roleUtils'
import type { AdminTableRow } from './adminData'

const statusLabel = (status?: string) => (status === 'suspended' ? 'Suspended' : 'Active')

const Users = () => {
  const { fetchAdminUsers, updateAdminUserStatus, deleteAdminUser, isAdmin } = useContext(AppContext)
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null)

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return

    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (roleFilter !== 'all') params.role = roleFilter
      if (statusFilter !== 'all') params.status = statusFilter
      const data = await fetchAdminUsers(params)
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }, [fetchAdminUsers, isAdmin, roleFilter, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredRows: AdminTableRow[] = useMemo(() => {
    const query = search.trim().toLowerCase()

    return users
      .filter((user) => {
        if (!query) return true
        return [user.name, user.email, user.clerkUserId, user.role].some((value) =>
          String(value || '').toLowerCase().includes(query)
        )
      })
      .map((user) => ({
        id: user._id,
        cells: [
          user.name || 'Unnamed user',
          user.email || 'No email',
          roleLabel(user.role),
          user.role === 'educator' ? `${(user as any).courseCount || 0}` : `${(user as any).enrolledCourses?.length || 0}`,
          statusLabel(user.status),
        ],
        status: statusLabel(user.status),
        meta: user,
      }))
  }, [search, users])

  const handleAction = async (action: string, row: AdminTableRow) => {
    const user = row.meta as AdminUserRecord
    if (!user || actionLoading) return

    if (action === 'Edit Role') {
      setEditingUser(user)
      return
    }

    if (action === 'Suspend') {
      const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
      const verb = nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'
      if (!window.confirm(`${verb} ${user.name || user.email || 'this user'}?`)) return
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
      if (!window.confirm(`Delete ${user.name || user.email || 'this user'} permanently?`)) return
      setActionLoading(true)
      try {
        const deleted = await deleteAdminUser(user._id)
        if (deleted) await loadUsers()
      } finally {
        setActionLoading(false)
      }
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50/30">
        <p className="text-sm text-red-600">Access denied. Admin role required.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">View all users and manage roles across the platform.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-md border border-gray-300 bg-white dark:bg-dk-surface px-4 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Search users"
            aria-label="Search users"
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-md border border-gray-300 bg-white dark:bg-dk-surface px-4 py-2 text-sm outline-none focus:border-blue-500"
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="student">Student</option>
            <option value="educator">Educator</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-gray-300 bg-white dark:bg-dk-surface px-4 py-2 text-sm outline-none focus:border-blue-500"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <AdminSection title="Users" description="Edit roles, suspend, or remove user accounts.">
        <AdminTable
          columns={['User', 'Email', 'Role', 'Courses', 'Status']}
          rows={filteredRows}
          rowActions={['Edit Role', 'Suspend', 'Delete']}
          onAction={handleAction}
          emptyMessage={loading ? 'Loading users...' : actionLoading ? 'Updating user...' : 'No users found.'}
        />
      </AdminSection>

      {editingUser ? (
        <EditRoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={loadUsers}
          includeStatus
        />
      ) : null}
    </div>
  )
}

export default Users
