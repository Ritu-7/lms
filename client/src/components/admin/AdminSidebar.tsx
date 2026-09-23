import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { assets } from '../../assets/assets'
import { adminNavItems } from '../../pages/admin/adminData'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const iconForLogout = assets.cross_icon

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="relative h-full min-h-0 overflow-auto border-r border-slate-200/80 bg-white py-5 dark:border-dk-border dark:bg-dk-surface flex flex-col z-10 shrink-0"
    >
      {/* Collapse Toggle Button (desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute right-2 top-6 z-30 w-7 h-7 rounded-full border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface text-slate-500 dark:text-dk-text items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <nav className="flex-1 flex flex-col gap-1 px-3">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 py-3 px-3.5 rounded-xl transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-dk-text-2 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="admin-nav-active"
                    className="absolute inset-0 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.img
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  src={item.icon}
                  alt={item.label}
                  className={`w-5 h-5 shrink-0 z-10 ${isActive ? 'opacity-100' : 'opacity-70'}`}
                />
                {!isCollapsed && (
                  <span className="hidden md:block text-sm z-10 truncate">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pt-4 border-t border-slate-100 dark:border-dk-border">
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="flex w-full items-center gap-3 py-3 px-3.5 rounded-xl text-slate-500 dark:text-dk-text-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200"
        >
          <motion.img
            whileHover={{ scale: 1.15 }}
            src={iconForLogout}
            alt="Logout"
            className="w-5 h-5 opacity-70 shrink-0"
          />
          {!isCollapsed && (
            <span className="hidden md:block text-sm truncate font-medium">Logout</span>
          )}
        </button>
      </div>
    </motion.aside>
  )
}

export default AdminSidebar
