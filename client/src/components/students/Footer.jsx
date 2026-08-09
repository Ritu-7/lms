import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../common/Logo'
import { Mail } from 'lucide-react'

// Brand Icons (lucide-react does not export brand logos)
const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const GithubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const LinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative w-full overflow-hidden bg-slate-950 pt-20 pb-10 border-t border-white/10 mt-auto">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 pb-16 border-b border-white/10">
          
          {/* Logo & Description */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <Link to="/" className="inline-block w-fit transition-transform hover:scale-105">
              <Logo light showText />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              LearnSphereAI is the next generation of learning. Empowering students and educators with AI-driven tools to master any skill, anywhere in the world.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-blue-500 hover:text-white hover:scale-110 transition-all duration-300">
                <TwitterIcon size={18} />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-slate-700 hover:text-white hover:scale-110 transition-all duration-300">
                <GithubIcon size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-blue-600 hover:text-white hover:scale-110 transition-all duration-300">
                <LinkedinIcon size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-pink-600 hover:text-white hover:scale-110 transition-all duration-300">
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="font-space-grotesk text-base font-bold text-white mb-5">Quick Links</h3>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-blue-400 transition-colors duration-200">Home</Link></li>
              <li><Link to="/course-list" className="hover:text-blue-400 transition-colors duration-200">All Courses</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors duration-200">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors duration-200">Contact</Link></li>
            </ul>
          </div>

          {/* AI Tools */}
          <div className="lg:col-span-2">
            <h3 className="font-space-grotesk text-base font-bold text-white mb-5">AI Tools</h3>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li><Link to="/ai-tutor" className="hover:text-purple-400 transition-colors duration-200">AI Tutor</Link></li>
              <li><Link to="/pdf-summary" className="hover:text-purple-400 transition-colors duration-200">PDF Summary</Link></li>
              <li><Link to="/video-summary" className="hover:text-purple-400 transition-colors duration-200">Video Summary</Link></li>
              <li><Link to="/notes-generator" className="hover:text-purple-400 transition-colors duration-200">Notes Generator</Link></li>
              <li><Link to="/ai-coding-assistant" className="hover:text-purple-400 transition-colors duration-200">Coding Assistant</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <h3 className="font-space-grotesk text-base font-bold text-white mb-5">Stay Updated</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Get the latest AI learning tips, course updates, and exclusive offers delivered directly to your inbox.
            </p>
            <form className="relative mt-2 flex items-center" onSubmit={(e) => e.preventDefault()}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail size={16} className="text-slate-500" />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-32 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300 placeholder:text-slate-500"
                required
              />
              <button 
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white text-sm font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center group"
              >
                <span>Subscribe</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p>© {currentYear} LearnSphereAI Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/contact" className="hover:text-white transition-colors duration-200">Support</Link>
            <Link to="#" className="hover:text-white transition-colors duration-200">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer