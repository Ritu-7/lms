import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import AdminSection from '../../components/admin/AdminSection'
import AdminTable from '../../components/admin/AdminTable'
import EditRoleModal, { type AdminUserRecord } from '../../components/admin/EditRoleModal'
import EducatorInsightsPanel from '../../components/admin/EducatorInsightsPanel'
import OutreachModal, { type OutreachTarget } from '../../components/admin/OutreachModal'
import Loading from '../../components/students/Loading'
import { roleLabel } from '../../utils/roleUtils'
import type { AdminTableRow } from './adminData'

const statusLabel = (s?: string) => (s === 'suspended' ? 'Suspended' : 'Active')

type Tab = 'users' | 'students' | 'educators' | 'ai-risk'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'users',     label: 'All Users',   icon: '👥' },
  { key: 'students',  label: 'Students',    icon: '🎓' },
  { key: 'educators', label: 'Educators',   icon: '🏫' },
  { key: 'ai-risk',   label: 'AI Insights', icon: '🤖' },
]

interface RiskData {
  studentId: string
  studentName: string
  studentEmail: string
  riskLevel: 'High' | 'Medium' | 'Low'
  reasons: string[]
  recommendations: string[]
  daysSinceLastActivity: number | null
  avgQuizScore: number | null
  avgAssignmentScore: number | null
}

const RISK_COLORS = {
  High:   { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',    border: 'border-red-200 dark:border-red-900/50',    header: 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' },
  Medium: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50', header: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' },
  Low:    { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50', header: 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' },
}

const buildRiskDraft = (s: RiskData): OutreachTarget => ({
  recipientId: s.studentId,
  recipientName: s.studentName,
  recipientEmail: s.studentEmail,
  context: 'student_risk',
  suggestedSubject: `We noticed you may need some support — ${s.studentName.split(' ')[0]}`,
  suggestedMessage: `Hi ${s.studentName.split(' ')[0]},\n\nWe noticed some signs you might be falling behind:\n${s.reasons.map(r => `• ${r}`).join('\n')}\n\nHere are a couple of things that might help:\n${s.recommendations.slice(0, 2).map(r => `• ${r}`).join('\n')}\n\nWe're here for you!\n\nWarm regards,\nLearnSphereAI Admin Team`,
})

const StudentProfileModal = ({ user, onClose }: { user: AdminUserRecord; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4 py-8">
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-dk-text">Student Profile</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Read-only snapshot.</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-slate-200 dark:border-dk-border px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors">Close</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[['Name', user.name || 'Unnamed'], ['Email', user.email || '—'], ['Role', roleLabel(user.role)], ['Status', statusLabel(user.status)]].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
            <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{value}</p>
          </div>
        ))}
        <div className="rounded-xl bg-slate-50 dark:bg-dk-surface-2 p-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Enrolled Courses</p>
          <p className="mt-1 font-semibold text-slate-800 dark:text-dk-text">{(user as any).enrolledCourses?.length || 0}</p>
        </div>
      </div>
    </div>
  </div>
)

const SearchBar = ({ search, onSearch, statusFilter, onStatusFilter, roleFilter, onRoleFilter, showRole = false, placeholder = 'Search…' }: {
  search: string; onSearch: (v: string) => void
  statusFilter: string; onStatusFilter: (v: string) => void
  roleFilter?: string; onRoleFilter?: (v: string) => void
  showRole?: boolean; placeholder?: string
}) => (
  <div className="flex flex-wrap gap-2">
    <input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder}
      className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm outline-none focus:border-blue-500" />
    {showRole && onRoleFilter && (
      <select value={roleFilter} onChange={e => onRoleFilter(e.target.value)}
        className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm outline-none focus:border-blue-500">
        <option value="all">All roles</option>
        <option value="student">Student</option>
        <option value="educator">Educator</option>
        <option value="admin">Admin</option>
      </select>
    )}
    <select value={statusFilter} onChange={e => onStatusFilter(e.target.value)}
      className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-2 text-sm outline-none focus:border-blue-500">
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
    </select>
  </div>
)

const UsersInsights = () => {
  const { backendURL, getToken, fetchAdminUsers, updateAdminUserRole, updateAdminUserStatus, deleteAdminUser, isAdmin } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [editingUser, setEditingUser]     = useState<AdminUserRecord | null>(null)
  const [outreachTarget, setOutreachTarget] = useState<OutreachTarget | null>(null)

  // All Users
  const [allUsers, setAllUsers]       = useState<AdminUserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersSearch, setUsersSearch]   = useState('')
  const [usersRole, setUsersRole]       = useState('all')
  const [usersStatus, setUsersStatus]   = useState('all')
  const [usersActing, setUsersActing]   = useState(false)

  // Students
  const [students, setStudents]             = useState<AdminUserRecord[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsLoaded, setStudentsLoaded]   = useState(false)
  const [studentsSearch, setStudentsSearch]   = useState('')
  const [studentsStatus, setStudentsStatus]   = useState('all')
  const [studentsActing, setStudentsActing]   = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<AdminUserRecord | null>(null)

  // Educators
  const [educators, setEducators]               = useState<AdminUserRecord[]>([])
  const [educatorsLoading, setEducatorsLoading] = useState(false)
  const [educatorsLoaded, setEducatorsLoaded]   = useState(false)
  const [educatorsSearch, setEducatorsSearch]   = useState('')
  const [educatorsStatus, setEducatorsStatus]   = useState('all')
  const [educatorsActing, setEducatorsActing]   = useState(false)
  const [insightsTarget, setInsightsTarget]     = useState<{ id: string; name: string } | null>(null)

  // AI Risk
  const [riskData, setRiskData]       = useState<RiskData[]>([])
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskLoaded, setRiskLoaded]   = useState(false)
  const [riskError, setRiskError]     = useState('')
  const [riskFilter, setRiskFilter]   = useState('All')

  // Loaders
  const loadAllUsers = useCallback(async () => {
    if (!isAdmin) return
    setUsersLoading(true)
    try {
      const params: Record<string, string> = {}
      if (usersRole !== 'all') params.role = usersRole
      if (usersStatus !== 'all') params.status = usersStatus
      setAllUsers(await fetchAdminUsers(params))
    } finally { setUsersLoading(false) }
  }, [fetchAdminUsers, isAdmin, usersRole, usersStatus])

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true)
    try { setStudents(await fetchAdminUsers({ role: 'student' })); setStudentsLoaded(true) }
    finally { setStudentsLoading(false) }
  }, [fetchAdminUsers])

  const loadEducators = useCallback(async () => {
    setEducatorsLoading(true)
    try { setEducators(await fetchAdminUsers({ role: 'educator' })); setEducatorsLoaded(true) }
    finally { setEducatorsLoading(false) }
  }, [fetchAdminUsers])

  const fetchRiskData = useCallback(async () => {
    setRiskLoading(true); setRiskError('')
    try {
      const token = await getToken()
      const res = await axios.get(`${backendURL}/api/admin/student-risk`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) { setRiskData(res.data.data); setRiskLoaded(true) }
      else throw new Error(res.data.message || 'Failed')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed'
      setRiskError(msg); toast.error(msg)
    } finally { setRiskLoading(false) }
  }, [backendURL, getToken])

  useEffect(() => { loadAllUsers() }, [loadAllUsers])

  useEffect(() => {
    if (activeTab === 'students' && !studentsLoaded && !studentsLoading) loadStudents()
    if (activeTab === 'educators' && !educatorsLoaded && !educatorsLoading) loadEducators()
    if (activeTab === 'ai-risk' && !riskLoaded && !riskLoading) fetchRiskData()
  }, [activeTab]) // eslint-disable-line

  // Filtered rows
  const usersRows: AdminTableRow[] = useMemo(() => {
    const q = usersSearch.trim().toLowerCase()
    return allUsers
      .filter(u => !q || [u.name, u.email, u.clerkUserId, u.role].some(v => String(v || '').toLowerCase().includes(q)))
      .map(u => ({
        id: u._id,
        cells: [u.name || 'Unnamed', u.email || '—', roleLabel(u.role), u.role === 'educator' ? `${(u as any).courseCount || 0}` : `${(u as any).enrolledCourses?.length || 0}`, statusLabel(u.status)],
        status: statusLabel(u.status), meta: u,
      }))
  }, [allUsers, usersSearch])

  const studentsRows: AdminTableRow[] = useMemo(() => {
    const q = studentsSearch.trim().toLowerCase()
    return students
      .filter(u => studentsStatus === 'all' || statusLabel(u.status).toLowerCase() === studentsStatus)
      .filter(u => !q || [u.name, u.email].some(v => String(v || '').toLowerCase().includes(q)))
      .map(u => ({ id: u._id, cells: [u.name || 'Unnamed', u.email || '—', roleLabel(u.role), `${(u as any).enrolledCourses?.length || 0}`, statusLabel(u.status)], status: statusLabel(u.status), meta: u }))
  }, [students, studentsSearch, studentsStatus])

  const educatorsRows: AdminTableRow[] = useMemo(() => {
    const q = educatorsSearch.trim().toLowerCase()
    return educators
      .filter(u => educatorsStatus === 'all' || statusLabel(u.status).toLowerCase() === educatorsStatus)
      .filter(u => !q || [u.name, u.email].some(v => String(v || '').toLowerCase().includes(q)))
      .map(u => ({ id: u._id, cells: [u.name || 'Unnamed', u.email || '—', `${(u as any).courseCount || 0}`, roleLabel(u.role), statusLabel(u.status)], status: statusLabel(u.status), meta: u }))
  }, [educators, educatorsSearch, educatorsStatus])

  const filteredRisk = useMemo(() => riskData.filter(d => riskFilter === 'All' || d.riskLevel === riskFilter), [riskData, riskFilter])

  // Action handlers
  const handleUserAction = async (action: string, row: AdminTableRow) => {
    const u = row.meta as AdminUserRecord
    if (!u || usersActing) return
    if (action === 'Edit Role') { setEditingUser(u); return }
    if (action === 'Suspend') {
      const next = u.status === 'suspended' ? 'active' : 'suspended'
      if (!window.confirm(`${next === 'suspended' ? 'Suspend' : 'Reactivate'} ${u.name || u.email}?`)) return
      setUsersActing(true); try { if (await updateAdminUserStatus(u._id, next)) await loadAllUsers() } finally { setUsersActing(false) }
    }
    if (action === 'Delete') {
      if (!window.confirm(`Delete ${u.name || u.email} permanently?`)) return
      setUsersActing(true); try { if (await deleteAdminUser(u._id)) await loadAllUsers() } finally { setUsersActing(false) }
    }
  }

  const handleStudentAction = async (action: string, row: AdminTableRow) => {
    const u = row.meta as AdminUserRecord
    if (!u || studentsActing) return
    if (action === 'View Profile') { setSelectedStudent(u); return }
    if (action === 'Edit Role') { setEditingUser(u); return }
    if (action === 'Promote to Educator') {
      if (!window.confirm(`Promote ${u.name || u.email} to educator?`)) return
      setStudentsActing(true); try { if (await updateAdminUserRole(u._id, 'educator')) await loadStudents() } finally { setStudentsActing(false) }
    }
    if (action === 'Suspend') {
      const next = u.status === 'suspended' ? 'active' : 'suspended'
      if (!window.confirm(`${next === 'suspended' ? 'Suspend' : 'Reactivate'} ${u.name || u.email}?`)) return
      setStudentsActing(true); try { if (await updateAdminUserStatus(u._id, next)) await loadStudents() } finally { setStudentsActing(false) }
    }
    if (action === 'Delete') {
      if (!window.confirm(`Delete ${u.name || u.email} permanently?`)) return
      setStudentsActing(true); try { if (await deleteAdminUser(u._id)) await loadStudents() } finally { setStudentsActing(false) }
    }
  }

  const handleEducatorAction = async (action: string, row: AdminTableRow) => {
    const u = row.meta as AdminUserRecord
    if (!u || educatorsActing) return
    if (action === 'AI Insights') { setInsightsTarget(insightsTarget?.id === u._id ? null : { id: u._id, name: u.name || u.email || 'Educator' }); return }
    if (action === 'Edit Role') { setEditingUser(u); return }
    if (action === 'Demote to Student') {
      if (!window.confirm(`Demote ${u.name || u.email} to student?`)) return
      setEducatorsActing(true); try { if (await updateAdminUserRole(u._id, 'student')) await loadEducators() } finally { setEducatorsActing(false) }
    }
    if (action === 'Suspend') {
      const next = u.status === 'suspended' ? 'active' : 'suspended'
      if (!window.confirm(`${next === 'suspended' ? 'Suspend' : 'Reactivate'} ${u.name || u.email}?`)) return
      setEducatorsActing(true); try { if (await updateAdminUserStatus(u._id, next)) await loadEducators() } finally { setEducatorsActing(false) }
    }
    if (action === 'Delete') {
      if (!window.confirm(`Delete ${u.name || u.email} permanently?`)) return
      setEducatorsActing(true); try { if (await deleteAdminUser(u._id)) await loadEducators() } finally { setEducatorsActing(false) }
    }
  }

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <p className="text-sm text-red-600">Access denied. Admin role required.</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col gap-6 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      {/* Global modals */}
      {outreachTarget && <OutreachModal target={outreachTarget} onClose={() => setOutreachTarget(null)} />}
      {editingUser && (
        <EditRoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => { loadAllUsers(); if (studentsLoaded) loadStudents(); if (educatorsLoaded) loadEducators() }}
          includeStatus
        />
      )}
      {selectedStudent && <StudentProfileModal user={selectedStudent} onClose={() => setSelectedStudent(null)} />}

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold font-space-grotesk">Users &amp; Insights</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Manage users, students, and educators. Run AI-powered risk and performance insights.</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-white dark:bg-dk-surface border border-slate-200 dark:border-dk-border p-1 rounded-2xl w-fit shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dk-border/50'
            }`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.key === 'ai-risk' && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 uppercase">AI</span>}
          </button>
        ))}
      </div>

      {/* ── ALL USERS ── */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold">User Management</h2>
              <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-0.5">View all users and manage roles across the platform.</p>
            </div>
            <SearchBar search={usersSearch} onSearch={setUsersSearch} statusFilter={usersStatus} onStatusFilter={setUsersStatus} roleFilter={usersRole} onRoleFilter={setUsersRole} showRole placeholder="Search users…" />
          </div>
          <AdminSection title="All Users" description="Edit roles, suspend, or remove user accounts.">
            <AdminTable columns={['User', 'Email', 'Role', 'Courses', 'Status']} rows={usersRows} rowActions={['Edit Role', 'Suspend', 'Delete']} onAction={handleUserAction}
              emptyMessage={usersLoading ? 'Loading users…' : usersActing ? 'Updating…' : 'No users found.'} />
          </AdminSection>
        </div>
      )}

      {/* ── STUDENTS ── */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Student Management</h2>
              <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-0.5">Search, filter, and manage learner accounts.</p>
            </div>
            <SearchBar search={studentsSearch} onSearch={setStudentsSearch} statusFilter={studentsStatus} onStatusFilter={setStudentsStatus} placeholder="Search students…" />
          </div>
          {studentsLoading && !studentsLoaded ? <Loading /> : (
            <AdminSection title="Students" description="View, edit roles, suspend, and remove student accounts.">
              <AdminTable columns={['Student', 'Email', 'Role', 'Courses', 'Status']} rows={studentsRows}
                rowActions={['View Profile', 'Edit Role', 'Promote to Educator', 'Suspend', 'Delete']} onAction={handleStudentAction}
                emptyMessage={studentsActing ? 'Updating student…' : 'No student data available.'} />
            </AdminSection>
          )}
        </div>
      )}

      {/* ── EDUCATORS ── */}
      {activeTab === 'educators' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Educator Management</h2>
              <p className="text-sm text-slate-500 dark:text-dk-text-2 mt-0.5">Manage instructors. Click AI Insights for Gemini-powered performance analysis.</p>
            </div>
            <SearchBar search={educatorsSearch} onSearch={setEducatorsSearch} statusFilter={educatorsStatus} onStatusFilter={setEducatorsStatus} placeholder="Search educators…" />
          </div>
          {educatorsLoading && !educatorsLoaded ? <Loading /> : (
            <AdminSection title="Educators" description="Approve, edit roles, suspend, or delete instructors. Use AI Insights for performance analysis.">
              <AdminTable columns={['Educator', 'Email', 'Courses', 'Role', 'Status']} rows={educatorsRows}
                rowActions={['AI Insights', 'Edit Role', 'Demote to Student', 'Suspend', 'Delete']} onAction={handleEducatorAction}
                emptyMessage={educatorsActing ? 'Updating educator…' : 'No educator data available.'} />
              {insightsTarget && (
                <EducatorInsightsPanel key={insightsTarget.id} educatorId={insightsTarget.id} educatorName={insightsTarget.name} onClose={() => setInsightsTarget(null)} />
              )}
            </AdminSection>
          )}
        </div>
      )}

      {/* ── AI RISK ── */}
      {activeTab === 'ai-risk' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-3">
                AI Student Risk Detection
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-md">BETA</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Powered by Google Gemini — analyzes behavior, course progress, and scores to identify at-risk students.</p>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-dk-surface p-1 rounded-xl border border-slate-200 dark:border-dk-border shadow-sm">
              {['All', 'High', 'Medium', 'Low'].map(f => (
                <button key={f} onClick={() => setRiskFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${riskFilter === f ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dk-border/50'}`}
                >{f}</button>
              ))}
              <button onClick={fetchRiskData} disabled={riskLoading} title="Refresh" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50">↻</button>
            </div>
          </div>

          {riskLoading && !riskLoaded && <Loading />}

          {!riskLoading && riskError && (
            <div className="py-12 text-center border border-dashed border-red-300 dark:border-red-900 rounded-2xl">
              <p className="text-sm text-red-500 mb-4">{riskError}</p>
              <button onClick={fetchRiskData} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold">Try Again</button>
            </div>
          )}

          {!riskLoading && !riskError && riskLoaded && (
            <>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredRisk.map(student => {
                  const c = RISK_COLORS[student.riskLevel]
                  return (
                    <div key={student.studentId} className={`rounded-2xl border bg-white dark:bg-dk-surface shadow-sm overflow-hidden flex flex-col ${c.border}`}>
                      <div className={`p-5 border-b ${c.header}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2">{student.studentName}</h3>
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0 ${c.badge}`}>{student.riskLevel} Risk</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.studentEmail}</p>
                        <div className="mt-4 flex gap-3 text-xs">
                          <div className="flex-1 bg-white/60 dark:bg-black/20 p-2 rounded border border-black/5 dark:border-white/5">
                            <span className="block text-slate-500 mb-0.5">Last Active</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{student.daysSinceLastActivity !== null ? `${student.daysSinceLastActivity} days ago` : 'N/A'}</span>
                          </div>
                          <div className="flex-1 bg-white/60 dark:bg-black/20 p-2 rounded border border-black/5 dark:border-white/5">
                            <span className="block text-slate-500 mb-0.5">Avg Score</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{student.avgQuizScore !== null ? `${student.avgQuizScore}%` : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col gap-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Reasons</h4>
                          <ul className="space-y-1.5">
                            {student.reasons.map((r, i) => (
                              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"><span className="text-slate-400 mt-0.5">•</span><span className="leading-snug">{r}</span></li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-dk-border">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">AI Recommendations</h4>
                          <ul className="space-y-1.5 mb-4">
                            {student.recommendations.map((r, i) => (
                              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"><span className="text-blue-400 mt-0.5">→</span><span className="leading-snug">{r}</span></li>
                            ))}
                          </ul>
                          <button onClick={() => setOutreachTarget(buildRiskDraft(student))}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                            <span>📬</span> Notify Student
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {filteredRisk.length === 0 && (
                <div className="py-12 text-center text-slate-500 border border-dashed rounded-2xl border-slate-300 dark:border-dk-border">
                  No students found matching the "{riskFilter}" risk criteria.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default UsersInsights
