import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import EditRoleModal, { type AdminUserRecord } from '../../components/admin/EditRoleModal'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { roleLabel } from '../../utils/roleUtils'
import type { AdminTableRow } from './adminData'

const statusLabel = (status?: string) => (status === 'suspended' ? 'Suspended' : 'Active')

const Students = () => {
  const { fetchAdminUsers, updateAdminUserRole, updateAdminUserStatus, deleteAdminUser } = useContext(AppContext)
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null)

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
      .filter((user) => statusFilter === 'all' || statusLabel(user.status).toLowerCase() === statusFilter)
      .filter((user) => {
        if (!query) return true
        return [user.name, user.email, user.clerkUserId].some((value) => String(value || '').toLowerCase().includes(query))
      })
      .map((user) => ({
        id: user._id,
        cells: [
          user.name || 'Unnamed student',
          user.email || 'No email',
          roleLabel(user.role),
          `${(user as any).enrolledCourses?.length || 0}`,
          statusLabel(user.status),
        ],
        status: statusLabel(user.status),
        meta: user,
      }))
  }, [search, statusFilter, users])

  const handleAction = async (action: string, row: AdminTableRow) => {
    const user = row.meta as AdminUserRecord
    if (!user || actionLoading) return

    if (action === 'View Profile') {
      setSelectedUser(user)
      return
    }

    if (action === 'Edit Role') {
      setEditingUser(user)
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
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Student Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Search, filter, and manage learner accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3"
            placeholder="Search students"
            aria-label="Search students"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500"
            aria-label="Filter students"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <AdminSection title="Students" description="View, edit roles, suspend, and remove student accounts.">
        <AdminTable
          columns={['Student', 'Email', 'Role', 'Courses', 'Status']}
          rows={filteredRows}
          rowActions={['View Profile', 'Edit Role', 'Promote to Educator', 'Suspend', 'Delete']}
          onAction={handleAction}
          emptyMessage={loading ? 'Loading students...' : actionLoading ? 'Updating student...' : 'No student data available.'}
        />
      </AdminSection>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Student Profile</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Read-only profile snapshot for quick review.</p>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-lg border border-slate-200 dark:border-dk-border px-3 py-1 text-sm text-slate-600 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-dk-text-3 font-semibold">Name</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{selectedUser.name || 'Unnamed student'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-dk-text-3 font-semibold">Email</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{selectedUser.email || 'No email'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-dk-text-3 font-semibold">Role</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{roleLabel(selectedUser.role)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-dk-text-3 font-semibold">Status</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{statusLabel(selectedUser.status)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-dk-text-3 font-semibold">Courses</p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{(selectedUser as any).enrolledCourses?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingUser ? (
        <EditRoleModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={loadUsers} includeStatus />
      ) : null}
    </div>
  )
}

export default Students
