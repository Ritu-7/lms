import React from 'react'
import { Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { assets } from '../../assets/assets'
import NotificationBell from '../notifications/NotificationBell'

const AdminTopbar = () => {
  const { user } = useUser()

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:px-8 bg-white">
      <Link to="/admin" className="flex items-center gap-3">
        <img src={assets.logo} alt="Logo" className="w-28 lg:w-32" />
        <span className="hidden rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 md:inline-flex">
          Admin Portal
        </span>
      </Link>

      <div className="flex items-center gap-4 text-gray-500">
        <p className="hidden sm:block">Hi! {user?.fullName || 'Administrator'}</p>
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
