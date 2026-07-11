import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import type { AdminTableRow } from './adminData'

const statusLabel = (status?: string) => (status === 'suspended' ? 'Suspended' : 'Active')

const Educators = () => {
  const { fetchAdminUsers, updateAdminUserRole, updateAdminUserStatus, deleteAdminUser } = useContext(AppContext)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [draftRole, setDraftRole] = useState('educator')
  const [draftStatus, setDraftStatus] = useState('active')

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAdminUsers({ role: 'educator' })
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
          user.name || 'Unnamed educator',
          user.email || 'No email',
          `${user.courseCount || 0}`,
          user.role || 'educator',
          statusLabel(user.status),
        ],
        status: statusLabel(user.status),
        meta: user,
      }))
  }, [search, statusFilter, users])

  const openEditModal = (user: any) => {
    setEditingUser(user)
    setDraftRole(user.role || 'educator')
    setDraftStatus(user.status || 'active')
  }

  const closeEditModal = () => {
    setEditingUser(null)
  }

  const saveEdit = async () => {
    if (!editingUser || actionLoading) return

    if (draftRole === 'admin' && editingUser.role !== 'admin') {
      if (!window.confirm(`Promote ${editingUser.name || editingUser.email || 'this educator'} to admin? This grants full Admin Dashboard access.`)) return
    }

    setActionLoading(true)
    try {
      let changed = false

      if (draftRole !== editingUser.role) {
        const updated = await updateAdminUserRole(editingUser._id, draftRole, { confirmAdminPromotion: draftRole === 'admin' })
        if (!updated) return
        changed = true
      }

      if (draftStatus !== (editingUser.status || 'active')) {
        const updated = await updateAdminUserStatus(editingUser._id, draftStatus)
        if (!updated) return
        changed = true
      }

      if (changed) await loadUsers()
      closeEditModal()
    } finally {
      setActionLoading(false)
    }
  }

  const handleAction = async (action: string, row: AdminTableRow) => {
    const user = row.meta as any
    if (!user || actionLoading) return

    if (action === 'Edit') {
      openEditModal(user)
      return
    }

    if (action === 'Demote to Student') {
      if (!window.confirm(`Demote ${user.name || user.email || 'this educator'} to student?`)) return
      setActionLoading(true)
      try {
        const updated = await updateAdminUserRole(user._id, 'student')
        if (updated) await loadUsers()
      } finally {
        setActionLoading(false)
      }
      return
    }

    if (action === 'Suspend') {
      const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
      const verb = nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'
      if (!window.confirm(`${verb} ${user.name || user.email || 'this educator'}?`)) return
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
      if (!window.confirm(`Delete ${user.name || user.email || 'this educator'} permanently?`)) return
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
          <h1 className="text-2xl font-semibold text-gray-800">Educator Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review approvals and manage instructor accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Search educators"
            aria-label="Search educators"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
            aria-label="Filter educators"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <AdminSection title="Educators" description="Approve, reject, edit, suspend, or delete instructors.">
        <AdminTable
          columns={["Educator", "Email", "Courses", "Role", "Status"]}
          rows={filteredRows}
          rowActions={['Edit', 'Demote to Student', 'Suspend', 'Delete']}
          onAction={handleAction}
          emptyMessage={loading ? 'Loading educators...' : actionLoading ? 'Updating educator...' : 'No educator data available.'}
        />
      </AdminSection>

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Edit Educator</h3>
                <p className="mt-1 text-sm text-gray-500">Update role and status without changing the existing design flow.</p>
              </div>
              <button type="button" onClick={closeEditModal} className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">Name</p>
                <p className="mt-1 font-semibold text-gray-800">{editingUser.name || 'Unnamed educator'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Role</p>
                <select value={draftRole} onChange={(event) => setDraftRole(event.target.value)} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500">
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
                <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                <p className="mt-1 font-semibold text-gray-800">{editingUser.email || 'No email'}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={closeEditModal} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={saveEdit} disabled={actionLoading} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Educators
