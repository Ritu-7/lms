import AdminSection from '../../components/admin/AdminSection'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const Settings = () => {
  const { adminOverview } = useContext(AppContext)

  return (
    <div className="min-h-screen flex flex-col gap-8 md:p-8 p-4 pt-8 bg-gray-50/30">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage platform preferences, security, permissions, and notifications.</p>
      </div>

      <AdminSection title="Configuration" description="Core platform settings across the admin console.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminOverview.settingsSections.map((section) => (
            <div key={section} className="rounded-md border border-gray-500/20 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-800">{section}</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Manage</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Update {section.toLowerCase()} preferences, review controls, and apply platform defaults.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Edit</button>
                <button className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">View</button>
              </div>
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  )
}

export default Settings
