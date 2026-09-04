import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import AdminSection from '../../components/admin/AdminSection'
import AdminEmptyState from '../../components/admin/AdminEmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactMsg {
  _id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied'
  createdAt: string
  updatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40',
  read: 'bg-slate-100 dark:bg-dk-surface-2 text-slate-600 dark:text-dk-text-2 border border-slate-200 dark:border-dk-border',
  replied: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

const ContactMessages = () => {
  const { backendURL, getToken } = useContext(AppContext)

  const [messages, setMessages] = useState<ContactMsg[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  const [selectedMsg, setSelectedMsg] = useState<ContactMsg | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const params: Record<string, string | number> = { page, limit: 20 }
      if (statusFilter !== 'all') params.status = statusFilter
      if (subjectFilter !== 'all') params.subject = subjectFilter
      if (search.trim()) params.search = search.trim()

      const res = await axios.get(`${backendURL}/api/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })

      if (res.data?.success) {
        setMessages(res.data.data)
        setTotalPages(res.data.pages)
        setTotal(res.data.total)
      }
    } catch {
      toast.error('Failed to load contact messages.')
    } finally {
      setLoading(false)
    }
  }, [backendURL, getToken, page, statusFilter, subjectFilter, search])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStatusChange = async (msg: ContactMsg, newStatus: 'read' | 'replied' | 'new') => {
    if (actionLoading) return
    setActionLoading(true)
    try {
      const token = await getToken()
      const res = await axios.patch(
        `${backendURL}/api/admin/contact-messages/${msg._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.success) {
        toast.success(`Marked as "${STATUS_LABELS[newStatus]}"`)
        // Update in-place so we don't need a full reload
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, status: newStatus } : m))
        )
        if (selectedMsg?._id === msg._id) {
          setSelectedMsg((prev) => prev ? { ...prev, status: newStatus } : prev)
        }
      }
    } catch {
      toast.error('Failed to update message status.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (msg: ContactMsg) => {
    if (!window.confirm(`Delete message from ${msg.name || msg.email}? This cannot be undone.`)) return
    if (actionLoading) return
    setActionLoading(true)
    try {
      const token = await getToken()
      const res = await axios.delete(
        `${backendURL}/api/admin/contact-messages/${msg._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.success) {
        toast.success('Message deleted.')
        setMessages((prev) => prev.filter((m) => m._id !== msg._id))
        if (selectedMsg?._id === msg._id) setSelectedMsg(null)
        setTotal((t) => Math.max(0, t - 1))
      }
    } catch {
      toast.error('Failed to delete message.')
    } finally {
      setActionLoading(false)
    }
  }

  // ── Unique subjects for filter dropdown ────────────────────────────────────
  const uniqueSubjects = useMemo(() => {
    const subjects = Array.from(new Set(messages.map((m) => m.subject)))
    return subjects.sort()
  }, [messages])

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
            Contact Messages
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">
            {total > 0 ? `${total} message${total !== 1 ? 's' : ''} received` : 'No messages yet'} — review, reply, and manage enquiries from the contact form.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3"
            placeholder="Search name, email, message…"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setPage(1) }}
            className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500"
          >
            <option value="all">All subjects</option>
            {uniqueSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <AdminSection title="Messages" description="Click 'View' to read the full message and take action.">
        <div className="rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-dk-text-2">Loading messages…</div>
          ) : messages.length === 0 ? (
            <AdminEmptyState
              title="No messages found"
              description="No contact form submissions match your current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2">
                    {['Name', 'Email', 'Subject', 'Status', 'Received', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dk-text-3"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dk-border">
                  {messages.map((msg) => (
                    <tr
                      key={msg._id}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                        msg.status === 'new' ? 'font-medium' : ''
                      }`}
                    >
                      <td className="px-5 py-4 text-slate-900 dark:text-dk-text whitespace-nowrap">
                        <span className={msg.status === 'new' ? 'font-semibold' : ''}>{msg.name}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-dk-text-2 whitespace-nowrap">
                        <a
                          href={`mailto:${msg.email}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {msg.email}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-dk-text-2 max-w-[200px] truncate">
                        {msg.subject}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[msg.status]}`}>
                          {STATUS_LABELS[msg.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-dk-text-3 whitespace-nowrap text-xs">
                        {formatDate(msg.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedMsg(msg)
                              // Auto-mark as read when admin opens it
                              if (msg.status === 'new') handleStatusChange(msg, 'read')
                            }}
                            className="rounded-lg border border-slate-200 dark:border-dk-border px-3 py-1 text-xs font-medium text-slate-700 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors"
                          >
                            View
                          </button>
                          {msg.status !== 'replied' && (
                            <button
                              onClick={() => handleStatusChange(msg, 'replied')}
                              disabled={actionLoading}
                              className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                            >
                              Replied
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(msg)}
                            disabled={actionLoading}
                            className="rounded-lg border border-rose-200 dark:border-rose-800/40 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminSection>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 dark:border-dk-border px-4 py-2 text-sm font-medium text-slate-700 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-500 dark:text-dk-text-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-200 dark:border-dk-border px-4 py-2 text-sm font-medium text-slate-700 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* View Message Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
                  Message from {selectedMsg.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">
                  {formatDate(selectedMsg.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedMsg(null)}
                className="rounded-lg border border-slate-200 dark:border-dk-border px-3 py-1 text-sm text-slate-600 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors shrink-0"
              >
                Close
              </button>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Name', value: selectedMsg.name },
                { label: 'Email', value: selectedMsg.email, isEmail: true },
                { label: 'Subject', value: selectedMsg.subject },
                { label: 'Status', value: STATUS_LABELS[selectedMsg.status], isStatus: true },
              ].map(({ label, value, isEmail, isStatus }) => (
                <div key={label} className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-dk-text-3 font-semibold">{label}</p>
                  {isEmail ? (
                    <a
                      href={`mailto:${value}`}
                      className="mt-1 block font-semibold text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                    >
                      {value}
                    </a>
                  ) : isStatus ? (
                    <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedMsg.status]}`}>
                      {value}
                    </span>
                  ) : (
                    <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Message body */}
            <div className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4 mb-6">
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-dk-text-3 font-semibold mb-2">Message</p>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-dk-text-2 whitespace-pre-wrap">
                {selectedMsg.message}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                ✉ Reply via Email
              </a>
              {selectedMsg.status !== 'replied' && (
                <button
                  onClick={() => handleStatusChange(selectedMsg, 'replied')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40 px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                >
                  ✓ Mark as Replied
                </button>
              )}
              {selectedMsg.status !== 'new' && (
                <button
                  onClick={() => handleStatusChange(selectedMsg, 'new')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800/40 px-5 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
                >
                  ↩ Reset to New
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedMsg)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-50 ml-auto"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactMessages
