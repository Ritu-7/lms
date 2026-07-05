import AdminSection from '../../components/admin/AdminSection'
import AdminStatCard from '../../components/admin/AdminStatCard'
import AdminTable from '../../components/admin/AdminTable'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { motion } from 'framer-motion'

const Dashboard = () => {
  const { adminOverview } = useContext(AppContext)
  const adminStats = adminOverview.stats
    ? [
        { label: 'Total Students', value: adminOverview.stats.totalStudents, helper: 'Live from users table' },
        { label: 'Total Educators', value: adminOverview.stats.totalEducators, helper: 'Live from users table' },
        { label: 'Total Courses', value: adminOverview.stats.totalCourses, helper: 'Live from courses table' },
        { label: 'Total Enrollments', value: adminOverview.stats.totalEnrollments, helper: 'Live from purchase records' },
        { label: 'Active Users', value: adminOverview.stats.activeUsers, helper: 'Students + educators' },
        { label: 'Revenue', value: `$${Number(adminOverview.stats.totalRevenue || 0).toLocaleString()}`, helper: 'Completed payments' },
      ]
    : []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-10">
      <div>
        <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Platform overview, operational health, and recent activity across the learning network.
        </p>
      </div>

      {adminStats.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {adminStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <AdminStatCard {...stat} />
            </motion.div>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="No dashboard metrics connected"
          description="Connect the admin dashboard to real backend endpoints to populate summary cards, charts, and activity feeds."
        />
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        <AdminSection
          title="Latest Enrollments"
          description="Most recent learner activity across the platform."
        >
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <AdminTable
              columns={["Learner", "Course", "Payment", "Date", "Status"]}
              rows={adminOverview.enrollments}
              rowActions={['View']}
              emptyMessage="No enrollment data available."
            />
          </div>
        </AdminSection>

        <AdminSection
          title="Recent Students"
          description="Recently active student accounts and their learning state."
        >
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <AdminTable
              columns={["Student", "Email", "Track", "Courses", "Status"]}
              rows={adminOverview.students}
              rowActions={['View', 'Edit']}
              emptyMessage="No student data available."
            />
          </div>
        </AdminSection>
      </div>

      <AdminSection
        title="Recent Payments"
        description="Latest transactions and billing status."
      >
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <AdminTable
            columns={["User", "Amount", "Status", "Method"]}
            rows={adminOverview.payments}
            rowActions={['View', 'Refund']}
            emptyMessage="No payment data available."
          />
        </div>
      </AdminSection>
    </div>
  )
}

export default Dashboard
