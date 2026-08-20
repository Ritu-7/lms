import { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { roleLabel, type UserRole } from '../../utils/roleUtils'

export interface AdminUserRecord {
  _id: string
  clerkUserId?: string
  name?: string
  email?: string
  role?: UserRole | string
  status?: 'active' | 'suspended' | string
}

interface EditRoleModalProps {
  user: AdminUserRecord
  onClose: () => void
  onSaved: () => void | Promise<void>
  includeStatus?: boolean
}

const EditRoleModal = ({ user, onClose, onSaved, includeStatus = false }: EditRoleModalProps) => {
  const { updateAdminUserRole, updateAdminUserStatus, userData } = useContext(AppContext)
  const [draftRole, setDraftRole] = useState<UserRole>((user.role as UserRole) || 'student')
  const [draftStatus, setDraftStatus] = useState(user.status || 'active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentRole = (user.role as UserRole) || 'student'
  const currentStatus = user.status || 'active'
  const isSelf = Boolean(userData?.clerkUserId && user.clerkUserId && userData.clerkUserId === user.clerkUserId)
  const roleChanged = draftRole !== currentRole
  const statusChanged = includeStatus && draftStatus !== currentStatus
  const hasChanges = roleChanged || statusChanged

  const handleSave = async () => {
    if (loading) return

    setError('')

    if (isSelf) {
      setError('You cannot change your own role or status.')
      return
    }

    if (!hasChanges) {
      setError('No changes to save.')
      return
    }

    if (roleChanged && draftRole === 'admin' && currentRole !== 'admin') {
      const confirmed = window.confirm(
        `Promote ${user.name || user.email || 'this user'} to Admin? This grants full Admin Dashboard access.`
      )
      if (!confirmed) return
    }

    setLoading(true)
    try {
      if (roleChanged) {
        const updated = await updateAdminUserRole(user._id, draftRole, {
          confirmAdminPromotion: draftRole === 'admin',
        })
        if (!updated) return
      }

      if (statusChanged) {
        const updated = await updateAdminUserStatus(user._id, draftStatus)
        if (!updated) return
      }

      await onSaved()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white dark:bg-dk-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Edit Role</h3>
            <p className="mt-1 text-sm text-gray-500">Change this user&apos;s role{includeStatus ? ' and status' : ''}.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            Close
          </button>
        </div>

        {isSelf ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You cannot modify your own account from this screen.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">Name</p>
            <p className="mt-1 font-semibold text-gray-800">{user.name || 'Unnamed user'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
            <p className="mt-1 font-semibold text-gray-800">{user.email || 'No email'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <label htmlFor="edit-role-select" className="text-xs uppercase tracking-wide text-gray-400">
              Role
            </label>
            <select
              id="edit-role-select"
              value={draftRole}
              onChange={(event) => setDraftRole(event.target.value as UserRole)}
              disabled={loading || isSelf}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white dark:bg-dk-surface px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="student">Student</option>
              <option value="educator">Educator</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">Current: {roleLabel(currentRole)}</p>
          </div>
          {includeStatus ? (
            <div className="rounded-xl bg-gray-50 p-4">
              <label htmlFor="edit-status-select" className="text-xs uppercase tracking-wide text-gray-400">
                Status
              </label>
              <select
                id="edit-status-select"
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value)}
                disabled={loading || isSelf}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white dark:bg-dk-surface px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || isSelf || !hasChanges}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditRoleModal
