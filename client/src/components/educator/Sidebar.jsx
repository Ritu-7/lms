
import React from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  // Pull isEducator from your Context

  const menuItems = [
    { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    { name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
    { name: 'Student Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
  ]

  // Only render if user is an educator
  return(
    <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-200 bg-white py-2 flex flex-col'>
      {menuItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          end={item.path === '/educator'}
          className={({ isActive }) => 
            `flex items-center md:flex-row flex-col md:justify-start justify-center gap-3 py-3.5 md:px-10 border-r-[4px] transition-all duration-200 ${
              isActive 
                ? 'bg-blue-50 border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`
          }
        >
          <img src={item.icon} alt={item.name} className="w-6 h-6" />
          <p className='md:block hidden font-medium'>{item.name}</p>
        </NavLink>
      ))}
    </div>
  )
}

export default Sidebar