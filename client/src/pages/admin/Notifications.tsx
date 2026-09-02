import React, { useState, useEffect, useContext } from 'react'
import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { AppContext } from '../../context/AppContext'
import { useNotifications } from '../../hooks/useNotifications'
import axios from 'axios'
import { toast } from 'react-toastify'
import type { AdminTableRow } from './adminData'

interface AnalyticsState {
  totalCount: number
  unreadCount: number
  byType: Array<{ _id: string; total: number; unread: number }>
  byPriority: Array<{ _id: string; count: number }>
  recent: Array<{ _id: string; count: number }>
}

const AdminNotifications = () => {
  const { backendURL, getToken } = useContext(AppContext)
  const { notifications, fetchNotifications } = useNotifications()

  // Form states
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('announcement')
  const [priority, setPriority] = useState('medium')
  const [recipientRole, setRecipientRole] = useState('all')
  const [actionUrl, setActionUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Analytics states
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true)
      const token = await getToken()
      if (!token) return

      const { data } = await axios.get(`${backendURL}/api/notifications/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setAnalytics(data.analytics)
      }
    } catch (err: any) {
      console.error('Failed to load analytics:', err.message)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [backendURL, getToken])

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }

    try {
      setIsSubmitting(true)
      const token = await getToken()
      if (!token) return

      const { data } = await axios.post(
        `${backendURL}/api/notifications/broadcast`,
        {
          title,
          message,
          type,
          priority,
          recipientRole,
          actionUrl: actionUrl.trim() || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (data.success) {
        toast.success('Broadcast notification sent successfully! 🚀')
        setTitle('')
        setMessage('')
        setActionUrl('')
        // Refresh notifications & analytics
        fetchNotifications(1)
        fetchAnalytics()
      } else {
        toast.error(data.message || 'Failed to send broadcast')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Convert notifications list to AdminTableRow format
  const tableRows: AdminTableRow[] = notifications.map((n) => ({
    id: n._id,
    cells: [
      n.title,
      n.type,
      n.priority,
      n.recipientRole || (n.recipient ? 'Single User' : 'all'),
      new Date(n.createdAt).toLocaleDateString()
    ],
    status: n.isRead ? 'Active' : 'Pending'
  }))

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div>
        <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Notification Center</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">
          Create broadcasts, review analytical trends, and view recent system alerts.
        </p>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dk-surface p-5 rounded-xl border border-slate-200 dark:border-dk-border shadow-sm flex flex-col">
          <span className="text-xs font-semibold text-slate-400 dark:text-dk-text-3 uppercase tracking-wider">Total Sent</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-dk-text mt-2 font-space-grotesk">
            {loadingAnalytics ? '...' : analytics?.totalCount || 0}
          </span>
        </div>
        <div className="bg-white dark:bg-dk-surface p-5 rounded-xl border border-slate-200 dark:border-dk-border shadow-sm flex flex-col">
          <span className="text-xs font-semibold text-slate-400 dark:text-dk-text-3 uppercase tracking-wider">Unread Alerts</span>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2 font-space-grotesk">
            {loadingAnalytics ? '...' : analytics?.unreadCount || 0}
          </span>
        </div>
        <div className="bg-white dark:bg-dk-surface p-5 rounded-xl border border-slate-200 dark:border-dk-border shadow-sm flex flex-col">
          <span className="text-xs font-semibold text-slate-400 dark:text-dk-text-3 uppercase tracking-wider">High Priority</span>
          <span className="text-2xl font-bold text-red-500 dark:text-red-400 mt-2 font-space-grotesk">
            {loadingAnalytics
              ? '...'
              : analytics?.byPriority?.find((p) => p._id === 'high')?.count || 0}
          </span>
        </div>
        <div className="bg-white dark:bg-dk-surface p-5 rounded-xl border border-slate-200 dark:border-dk-border shadow-sm flex flex-col">
          <span className="text-xs font-semibold text-slate-400 dark:text-dk-text-3 uppercase tracking-wider">Broadcast Target</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-space-grotesk">
            {loadingAnalytics
              ? '...'
              : analytics?.byType?.find((t) => t._id === 'announcement')?.total || 0}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Broadcast Composer */}
        <div className="lg:col-span-1">
          <AdminSection title="Composer" description="Send alert to all or specific roles.">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification Heading"
                  className="w-full rounded-xl text-sm border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail message describing the alert event..."
                  rows={4}
                  className="w-full rounded-xl text-sm border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">Target Role</label>
                  <select
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-dk-border px-3 py-2 bg-white dark:bg-dk-surface text-slate-900 dark:text-dk-text outline-none focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="student">Students</option>
                    <option value="educator">Instructors</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">Alert Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-dk-border px-3 py-2 bg-white dark:bg-dk-surface text-slate-900 dark:text-dk-text outline-none focus:border-blue-500"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="course">Course</option>
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="system">System Alert</option>
                    <option value="AI">AI Credits</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-dk-border px-3 py-2 bg-white dark:bg-dk-surface text-slate-900 dark:text-dk-text outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">Action URL (optional)</label>
                  <input
                    type="text"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="/my-enrollments"
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-3 py-2 text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-dk-text-3"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-sm shadow-blue-600/20"
              >
                {isSubmitting ? 'Sending...' : 'Broadcast Alert'}
              </button>
            </form>
          </AdminSection>
        </div>

        {/* Live Broadcast Feed */}
        <div className="lg:col-span-2">
          <AdminSection title="Broadcast Log" description="View broadcast alerts recently sent.">
            <AdminTable
              columns={['Title', 'Type', 'Priority', 'Target', 'Sent Date']}
              rows={tableRows}
              emptyMessage="No broadcast history available."
            />
          </AdminSection>
        </div>
      </div>
    </div>
  )
}

export default AdminNotifications

