import React from 'react'
import { Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { assets } from '../../assets/assets'
import NotificationBell from '../notifications/NotificationBell'
import Logo from '../common/Logo'
import ThemeToggle from '../common/ThemeToggle'

const AdminTopbar = () => {
  const { user } = useUser()

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-dk-border px-4 py-3 md:px-8 bg-white dark:bg-dk-surface sticky top-0 z-40">
      <Link to="/admin" className="flex items-center gap-3">
        <Logo />
        <span className="hidden rounded-full border border-slate-200 dark:border-dk-border bg-slate-50 dark:bg-dk-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-dk-text-2 md:inline-flex">
          Admin Portal
        </span>
      </Link>

      <div className="flex items-center gap-4 text-slate-600 dark:text-dk-text-2">
        <p className="hidden sm:block text-sm font-medium text-slate-700 dark:text-dk-text">Hi! {user?.fullName || 'Administrator'}</p>
        <ThemeToggle variant="icon" />
        {user ? (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserButton />
          </div>
        ) : (
          <img className="max-w-8" src={assets.profile_img} alt="Admin profile" />
        )}
      </div>
    </header>
  )
}

export default AdminTopbar

