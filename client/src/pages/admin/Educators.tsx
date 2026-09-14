import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import EditRoleModal, { type AdminUserRecord } from '../../components/admin/EditRoleModal'
import EducatorInsightsPanel from '../../components/admin/EducatorInsightsPanel'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { roleLabel } from '../../utils/roleUtils'
import type { AdminTableRow } from './adminData'

const statusLabel = (status?: string) => (status === 'suspended' ? 'Suspended' : 'Active')

const Educators = () => {
  const { fetchAdminUsers, updateAdminUserRole, updateAdminUserStatus, deleteAdminUser } = useContext(AppContext)
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null)
  const [insightsTarget, setInsightsTarget] = useState<{ id: string; name: string } | null>(null)

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
      .filter((user) => statusFilter === 'all' || statusLabel(user.status).toLowerCase() === statusFilter)
      .filter((user) => {
        if (!query) return true
        return [user.name, user.email, user.clerkUserId].some((value) => String(value || '').toLowerCase().includes(query))
      })
      .map((user) => ({
        id: user._id,
        cells: [
          user.name || 'Unnamed educator',
          user.email || 'No email',
          `${(user as any).courseCount || 0}`,
          roleLabel(user.role),
          statusLabel(user.status),
        ],
        status: statusLabel(user.status),
        meta: user,
      }))
  }, [search, statusFilter, users])

  const handleAction = async (action: string, row: AdminTableRow) => {
    const user = row.meta as AdminUserRecord
    if (!user || actionLoading) return

    if (action === 'AI Insights') {
      // Toggle panel off if already showing for the same educator
      if (insightsTarget?.id === user._id) {
        setInsightsTarget(null)
      } else {
        setInsightsTarget({ id: user._id, name: user.name || user.email || 'Educator' })
      }
      return
    }

    if (action === 'Edit Role') {
      setEditingUser(user)
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
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Educator Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Review approvals and manage instructor accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3"
            placeholder="Search educators"
            aria-label="Search educators"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500"
            aria-label="Filter educators"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <AdminSection title="Educators" description="Approve, reject, edit roles, suspend, or delete instructors. Click AI Insights to get Gemini-powered analysis for any educator.">
        <AdminTable
          columns={['Educator', 'Email', 'Courses', 'Role', 'Status']}
          rows={filteredRows}
          rowActions={['AI Insights', 'Edit Role', 'Demote to Student', 'Suspend', 'Delete']}
          onAction={handleAction}
          emptyMessage={loading ? 'Loading educators...' : actionLoading ? 'Updating educator...' : 'No educator data available.'}
        />

        {insightsTarget && (
          <EducatorInsightsPanel
            key={insightsTarget.id}
            educatorId={insightsTarget.id}
            educatorName={insightsTarget.name}
            onClose={() => setInsightsTarget(null)}
          />
        )}
      </AdminSection>

      {editingUser ? (
        <EditRoleModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={loadUsers} includeStatus />
      ) : null}
    </div>
  )
}

export default Educators

