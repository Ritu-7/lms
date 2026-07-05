import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { adminNavItems } from '../../pages/admin/adminData'
import Logo from '../common/Logo'

const AdminSidebar = () => {
  const iconForLogout = assets.cross_icon

  return (
    <aside className="md:w-64 w-20 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 min-h-screen py-8 flex flex-col">
      <div className="px-6 mb-10">
        <Logo showText={false} />
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <img src={item.icon} alt={item.label} className="w-5 h-5 opacity-70" />
            <span className="hidden md:block text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pt-6 border-t border-slate-100 dark:border-white/5">
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="flex w-full items-center gap-3 py-3 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
        >
          <img src={iconForLogout} alt="Logout" className="w-5 h-5 opacity-70" />
          <span className="hidden md:block text-sm">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
