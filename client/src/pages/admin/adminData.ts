import { assets } from '../../assets/assets'

export type AdminNavKey =
  | 'dashboard'
  | 'students'
  | 'educators'
  | 'courses'
  | 'categories'
  | 'enrollments'
  | 'assignments'
  | 'certificates'
  | 'announcements'
  | 'notifications'
  | 'payments'
  | 'reports'
  | 'analytics'
  | 'settings'

export interface AdminNavItem {
  key: AdminNavKey
  label: string
  path: string
  icon: string
}

export interface AdminStatCardData {
  label: string
  value: string
  helper: string
  icon: string
}

export interface AdminTableRow {
  id: string
  cells: string[]
  status?: 'Active' | 'Pending' | 'Suspended' | 'Published' | 'Draft' | 'Scheduled'
}

export interface AdminActionItem {
  label: string
  tone: 'default' | 'primary' | 'danger' | 'success' | 'warning'
}

export const adminNavItems: AdminNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: assets.home_icon },
  { key: 'students', label: 'Students', path: '/admin/students', icon: assets.patients_icon },
  { key: 'educators', label: 'Educators', path: '/admin/educators', icon: assets.person_tick_icon },
  { key: 'courses', label: 'Courses', path: '/admin/courses', icon: assets.my_course_icon },
  { key: 'categories', label: 'Categories', path: '/admin/categories', icon: assets.add_icon },
  { key: 'enrollments', label: 'Enrollments', path: '/admin/enrollments', icon: assets.appointments_icon },
  { key: 'assignments', label: 'Assignments', path: '/admin/assignments', icon: assets.file_upload_icon },
  { key: 'certificates', label: 'Certificates', path: '/admin/certificates', icon: assets.blue_tick_icon },
  { key: 'announcements', label: 'Announcements', path: '/admin/announcements', icon: assets.lesson_icon },
  { key: 'notifications', label: 'Notifications', path: '/admin/notifications', icon: assets.time_left_clock_icon },
  { key: 'payments', label: 'Payments', path: '/admin/payments', icon: assets.earning_icon },
  { key: 'reports', label: 'Reports', path: '/admin/reports', icon: assets.time_clock_icon },
  { key: 'analytics', label: 'Analytics', path: '/admin/analytics', icon: assets.dropdown_icon },
  { key: 'settings', label: 'Settings', path: '/admin/settings', icon: assets.user_icon },
]

export const adminStats: AdminStatCardData[] = []

export const studentRows: AdminTableRow[] = []

export const educatorRows: AdminTableRow[] = []

export const courseRows: AdminTableRow[] = []

export const categoryRows: AdminTableRow[] = []

export const enrollmentRows: AdminTableRow[] = []

export const assignmentRows: AdminTableRow[] = []

export const certificateRows: AdminTableRow[] = []

export const announcementRows: AdminTableRow[] = []

export const paymentRows: AdminTableRow[] = []

export const reportRows: AdminTableRow[] = []

export const analyticsTrend: Array<{ month: string; students: number; courses: number; enrollments: number }> = []

export const analyticsBreakdown: Array<{ name: string; value: number }> = []

export const topCourses: Array<{ name: string; enrollments: number }> = []

export const settingsSections = [
  'General',
  'Security',
  'Permissions',
  'Theme',
  'Email',
]
