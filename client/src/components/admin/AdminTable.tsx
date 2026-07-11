import { toast } from 'react-toastify'
import type { AdminTableRow } from '../../pages/admin/adminData'

interface AdminTableProps {
  columns: string[]
  rows: AdminTableRow[]
  rowActions?: string[]
  emptyMessage?: string
  onAction?: (action: string, row: AdminTableRow) => void | Promise<void>
}

const toneClassMap: Record<NonNullable<AdminTableRow['status']>, string> = {
  Active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  Pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  Suspended: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  Published: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  Draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  Scheduled: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400',
}

const actionToneClassMap: Record<string, string> = {
  View: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  Edit: 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300',
  Suspend: 'text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20',
  Delete: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
  'Promote to Educator': 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  'Demote to Student': 'text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20',
  Approve: 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  Reject: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
  Publish: 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  Unpublish: 'text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20',
  Schedule: 'text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
  Download: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
  Generate: 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300',
  'View Profile': 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
}

const AdminTable = ({ columns, rows, rowActions, emptyMessage = 'No records available.', onAction }: AdminTableProps) => {
  const handleAction = async (action: string, row: AdminTableRow) => {
    if (onAction) {
      await onAction(action, row)
      return
    }

    toast.info(`${action} selected for ${row.id}`)
  }

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full table-auto text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-6 py-4 font-semibold">
                {column}
              </th>
            ))}
            {rowActions && rowActions.length > 0 ? <th className="px-6 py-4 text-center font-semibold">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
          {rows.length > 0 ? (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                {row.cells.map((cell, index) => {
                  const status = index === row.cells.length - 1 ? row.status : undefined
                  return (
                    <td key={`${row.id}-${index}`} className="px-6 py-4">
                      {status ? (
                        <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${toneClassMap[status]}`}>{cell}</span>
                      ) : (
                        <span className="font-medium">{cell}</span>
                      )}
                    </td>
                  )
                })}
                {rowActions && rowActions.length > 0 ? (
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {rowActions.map((action) => (
                        <button
                          key={`${row.id}-${action}`}
                          type="button"
                          onClick={() => handleAction(action, row)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${actionToneClassMap[action] || 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (rowActions && rowActions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 italic">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default AdminTable
