import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/educator/Navbar'
import Sidebar from '../../components/educator/Sidebar'
import Footer from '../../components/educator/Footer'

const Educator = () => {
  return (
    <div className='text-default min-h-screen bg-slate-50 dark:bg-dk-base text-slate-900 dark:text-dk-text flex flex-col transition-colors duration-200'>
      <Navbar />
      
      {/* The flex-1 here ensures this middle section expands to push the footer down */}
      <div className='flex flex-1'>
        <Sidebar />
        
        <main className='flex-1 overflow-y-auto bg-slate-50 dark:bg-dk-base'>
          <Outlet />
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default Educator
