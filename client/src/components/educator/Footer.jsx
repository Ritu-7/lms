import React from 'react'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <footer className="w-full px-8 md:px-36 border-t border-gray-200 bg-white">
      <div className="flex md:flex-row flex-col-reverse items-center justify-between gap-4 py-8">
        
        {/* Left Side: Logo & Copyright */}
        <div className="flex items-center gap-4">
          <img
            className="hidden md:block w-24 object-contain"
            src={assets.logo_dark}
            alt="Logo"
          />

          {/* Vertical Divider (Desktop Only) */}
          <div className="hidden md:block h-6 w-px bg-gray-300"></div>

          <p className="text-center md:text-left text-xs md:text-sm text-gray-500 font-medium">
            Copyright 2026 © Ritika Marotha. All rights reserved.
          </p>
        </div>

        {/* Right Side: Social Icons */}
        <div className="flex items-center gap-6">
          <a
            href="https://www.linkedin.com/in/ritika-marotha-2b7245233/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:-translate-y-1 hover:opacity-80 duration-200"
          >
           <img 
  src="https://cdn-icons-png.flaticon.com/512/174/174857.png" 
  alt="LinkedIn" 
  style={{ width: '24px', height: '24px' }} 
/>
          </a>

          <a
            href="https://github.com/RitikaMarotha"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:-translate-y-1 hover:opacity-80 duration-200"
          >
           <img 
  src="https://cdn-icons-png.flaticon.com/512/25/25231.png" 
  alt="GitHub" 
  style={{ width: '24px', height: '24px' }} 
/>
          </a>
        </div>

      </div>
    </footer>
  )
}

export default Footer