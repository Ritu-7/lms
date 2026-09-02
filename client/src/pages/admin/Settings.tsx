import AdminSection from '../../components/admin/AdminSection'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Settings = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-dk-text transition-colors duration-200">
      <div>
        <h1 className="text-3xl font-bold font-space-grotesk text-slate-900 dark:text-dk-text">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-dk-text-2">Manage platform preferences, security, permissions, and notifications.</p>
      </div>

      <AdminSection title="Configuration" description="Core platform settings across the admin console.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminOverview.settingsSections.map((section) => (
            <div key={section} className="rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-dk-text font-space-grotesk">{section}</h2>
                <span className="rounded-full bg-slate-100 dark:bg-dk-surface-2 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-dk-text-2">Manage</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-dk-text-2">
                Update {section.toLowerCase()} preferences, review controls, and apply platform defaults.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">Edit</button>
                <button className="rounded-lg border border-slate-200 dark:border-dk-border px-3 py-2 text-xs font-semibold text-slate-600 dark:text-dk-text-2 hover:bg-slate-100 dark:hover:bg-dk-surface-2 transition-colors">View</button>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  )
}

export default Settings

