import React, { useState, useContext, useMemo } from 'react'
import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import type { AdminTableRow } from './adminData'

interface AnnouncementData {
  _id?: string
  id?: string
  title: string
  message: string
  audience: 'all' | 'students' | 'educators' | 'admins'
  isPublished: boolean
  publishAt: string | null
}

const Announcements = () => {
  const { adminOverview, fetchAdminOverview, backendURL, getToken } = useContext(AppContext)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AnnouncementData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<'all' | 'students' | 'educators' | 'admins'>('all')
  const [isPublished, setIsPublished] = useState(true)
  const [publishAt, setPublishAt] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('all')

  const openCreateModal = () => {
    setEditingItem(null)
    setTitle('')
    setMessage('')
    setAudience('all')
    setIsPublished(true)
    setPublishAt('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: AnnouncementData) => {
    setEditingItem(item)
    setTitle(item.title || '')
    setMessage(item.message || '')
    setAudience(item.audience || 'all')
    setIsPublished(item.isPublished ?? true)
    setPublishAt(item.publishAt ? new Date(item.publishAt).toISOString().slice(0, 16) : '')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }

    try {
      setIsSubmitting(true)
      const token = await getToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const payload = {
        title: title.trim(),
        message: message.trim(),
        audience,
        isPublished,
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
      }

      const itemId = editingItem?._id || editingItem?.id

      if (itemId) {
        // Edit announcement
        const { data } = await axios.put(`${backendURL}/api/admin/announcements/${itemId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          toast.success('Announcement updated successfully!')
          closeModal()
          fetchAdminOverview?.()
        } else {
          toast.error(data.message || 'Failed to update announcement')
        }
      } else {
        // Create announcement
        const { data } = await axios.post(`${backendURL}/api/admin/announcements`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (data.success) {
          toast.success('Announcement published successfully! 🚀')
          closeModal()
          fetchAdminOverview?.()
        } else {
          toast.error(data.message || 'Failed to create announcement')
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (row: AdminTableRow) => {
    const raw = row.meta as AnnouncementData | undefined
    const id = raw?._id || raw?.id || row.id

    if (!window.confirm(`Are you sure you want to delete the announcement "${row.cells[0]}"?`)) {
      return
    }

    try {
      const token = await getToken()
      const { data } = await axios.delete(`${backendURL}/api/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        toast.success('Announcement deleted successfully')
        fetchAdminOverview?.()
      } else {
        toast.error(data.message || 'Failed to delete announcement')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete announcement')
    }
  }

  const handleAction = async (action: string, row: AdminTableRow) => {
    const raw = (row.meta || {}) as AnnouncementData
    if (action === 'Edit') {
      openEditModal({
        _id: row.id,
        id: row.id,
        title: String(row.cells[0] || raw.title || ''),
        message: raw.message || '',
        audience: (raw.audience || 'all') as any,
        isPublished: row.status === 'Published',
        publishAt: raw.publishAt || null,
      })
      return
    }

    if (action === 'Delete') {
      await handleDelete(row)
      return
    }

    if (action === 'Schedule' || action === 'Create') {
      openCreateModal()
    }
  }

  // Parse raw rows from overview
  const rawAnnouncements: AnnouncementData[] = useMemo(() => {
    const list = adminOverview.announcements || []
    return list.map((item: any) => {
      // If it's already an AdminTableRow
      if (item.cells && item.id) {
        return {
          id: item.id,
          _id: item.id,
          title: item.cells[0] || '',
          audience: (item.cells[1] || 'all').toLowerCase(),
          message: item.meta?.message || '',
          isPublished: item.cells[2] === 'Published' || item.status === 'Published',
          publishAt: item.cells[3] || item.meta?.publishAt || null,
        }
      }
      return item
    })
  }, [adminOverview.announcements])

  // Filter rows
  const tableRows: AdminTableRow[] = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return rawAnnouncements
      .filter((item) => {
        if (audienceFilter !== 'all' && (item.audience || 'all') !== audienceFilter) {
          return false
        }
        if (query && !item.title.toLowerCase().includes(query) && !(item.message || '').toLowerCase().includes(query)) {
          return false
        }
        return true
      })
      .map((item) => ({
        id: item._id || item.id || Math.random().toString(),
        cells: [
          item.title,
          item.audience ? item.audience.charAt(0).toUpperCase() + item.audience.slice(1) : 'All',
          item.isPublished ? 'Published' : 'Draft',
          item.publishAt ? new Date(item.publishAt).toLocaleDateString() : 'Immediate',
        ],
        status: item.isPublished ? 'Published' : 'Draft',
        meta: item,
      }))
  }, [rawAnnouncements, searchQuery, audienceFilter])

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">
            Publish updates, schedule notices, and manage platform communications.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openCreateModal}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Announcement
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text placeholder-slate-400 dark:placeholder-dk-text-3 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">All Audiences</option>
          <option value="students">Students Only</option>
          <option value="educators">Educators Only</option>
          <option value="admins">Admins Only</option>
        </select>
      </div>

      {/* Main Table Section */}
      <AdminSection title="Active Announcements" description="Create, edit, delete, and schedule platform notices.">
        <AdminTable
          columns={['Announcement', 'Audience', 'Status', 'Schedule']}
          rows={tableRows}
          rowActions={['Edit', 'Delete']}
          onAction={handleAction}
          emptyMessage="No announcements found. Click 'Create Announcement' above to publish one."
        />
      </AdminSection>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-dk-border pb-4">
              <div>
                <h3 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">
                  {editingItem ? 'Edit Announcement' : 'Create New Announcement'}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-dk-text-2">
                  Broadcast notices across the LMS or schedule for future release.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-200 dark:border-dk-border px-3 py-1 text-sm text-slate-600 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors disabled:opacity-60"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Scheduled Platform Maintenance"
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">
                  Message / Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the update, timeline, affected courses or services..."
                  rows={4}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Users (Public)</option>
                    <option value="students">Students Only</option>
                    <option value="educators">Educators Only</option>
                    <option value="admins">Admins Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-dk-text mb-1">
                    Schedule Release (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={publishAt}
                    onChange={(e) => setPublishAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2.5 text-sm text-slate-900 dark:text-dk-text outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-slate-700 dark:text-dk-text cursor-pointer">
                  Publish immediately (visible to target audience)
                </label>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-slate-100 dark:border-dk-border pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 dark:border-dk-border px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Announcement' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Announcements
