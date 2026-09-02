import React from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { assets } from '../../assets/assets'
import NotificationBell from '../notifications/NotificationBell'
import Logo from '../common/Logo'
import ThemeToggle from '../common/ThemeToggle'

const Navbar = () => {
  const { user } = useUser()

  return (
    <div className='flex items-center justify-between px-4 md:px-8 border-b border-slate-200 dark:border-dk-border py-3 bg-white dark:bg-dk-surface sticky top-0 z-40'>
      <Link to ='/'>
        <Logo />
      </Link>
      <div className ="flex items-center gap-4 text-slate-600 dark:text-dk-text-2 relative"> 
        <p className="hidden sm:block text-sm font-medium text-slate-700 dark:text-dk-text">Hi! {user ? user.fullName : 'Developers'}</p>
        <ThemeToggle variant="icon" />
        {user ? (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserButton />
          </div>
        ) : (
          <img className='max-w-8' src = {assets.profile_img} alt="profile" />
        )}
      </div>
    </div>
  )
}

export default Navbar
