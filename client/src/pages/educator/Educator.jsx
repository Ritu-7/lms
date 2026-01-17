import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/educator/Navbar'
import Sidebar from '../../components/educator/Sidebar'
import Footer from '../../components/educator/Footer'

const Educator = () => {
  return (
    <div className='text-default min-h-screen bg-white flex flex-col'>
      <Navbar />
      
      {/* The flex-1 here ensures this middle section expands to push the footer down */}
      <div className='flex flex-1'>
        <Sidebar />
        
        <main className='flex-1 overflow-y-auto'>
          {/* Removed the extra curly braces around <Outlet/>. 
            Added a <main> tag for better SEO and accessibility.
          */}
          <Outlet />
        </main>
      </div>
      
      <Footer />
    </div>
  )
}

export default Educator
