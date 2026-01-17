import React from 'react'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-white mt-20">
      
      <div className="flex flex-col md:flex-row items-start justify-center gap-16 md:gap-36 px-8 md:px-36 py-10 border-b border-gray-700">
        
        {/* Logo & Description */}
        <div className="flex flex-col md:items-start items-center w-full">
          <img src={assets.logo_dark} alt="logo" />
          <p className="mt-6 text-center md:text-left text-sm text-white/80">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Nullam auctor, nisl eget ultricies aliquam.
          </p>
        </div>

        {/* Company Links */}
        <div className="flex flex-col items-center w-full">
          <h2 className="font-semibold mb-5 text-center">Company</h2>
          <ul className="flex md:flex-col w-full justify-between md:space-y-2 text-sm text-white/80">
            <li><a href="#" className="hover:text-white">Home</a></li>
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="hidden md:flex flex-col md:items-start items-center w-full">
          <h2 className="font-semibold mb-5">Subscribe to our Newsletter</h2>
          <p className="text-sm text-white/80">
            Get the latest updates and offers.
          </p>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-l-md border border-gray-300 text-black focus:outline-none"
            />
            <button className="px-4 py-2 bg-blue-600 rounded-r-md hover:bg-blue-700">
              Subscribe
            </button>
          </div>
        </div>

      </div>

      <p className="py-4 text-center text-xs md:text-sm text-white/60">
        © 2025 LearnHub. All rights reserved.
      </p>

    </footer>
  )
}

export default Footer
