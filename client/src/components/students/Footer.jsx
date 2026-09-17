import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../common/Logo'
import { Mail } from 'lucide-react'
import { motion } from 'framer-motion'

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

const FooterLink = ({ to, children }) => (
  <Link 
    to={to} 
    className="group relative inline-block text-text-secondary hover:text-text-primary transition-colors duration-200"
  >
    {children}
    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-text-primary transition-all duration-300 group-hover:w-full"></span>
  </Link>
)

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative w-full overflow-hidden bg-bg-primary pt-20 pb-10 border-t border-card-border mt-auto transition-colors duration-500">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent-blue/5 blur-[120px] transition-colors" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-accent-purple/5 blur-[100px] transition-colors" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 pb-16 border-b border-card-border"
        >
          
          {/* Logo & Description */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <Link to="/" className="inline-block w-fit transition-transform hover:scale-105">
              <Logo showText />
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm transition-colors">
              LearnSphereAI is the next generation of learning. Empowering students and educators with AI-driven tools to master any skill, anywhere in the world.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-text-primary/5 text-text-secondary hover:bg-accent-blue hover:text-white hover:scale-110 transition-all duration-300 shadow-sm">
                <TwitterIcon size={18} />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-text-primary/5 text-text-secondary hover:bg-slate-700 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm">
                <GithubIcon size={18} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-text-primary/5 text-text-secondary hover:bg-blue-600 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm">
                <LinkedinIcon size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-text-primary/5 text-text-secondary hover:bg-pink-600 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm">
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="font-space-grotesk text-base font-bold text-text-primary mb-5 transition-colors">Quick Links</h3>
            <ul className="space-y-3.5 text-sm">
              <li><FooterLink to="/">Home</FooterLink></li>
              <li><FooterLink to="/course-list">All Courses</FooterLink></li>
              <li><FooterLink to="/announcements">Announcements</FooterLink></li>
              <li><FooterLink to="/about">About Us</FooterLink></li>
              <li><FooterLink to="/contact">Contact</FooterLink></li>
            </ul>
          </div>

          {/* AI Tools */}
          <div className="lg:col-span-2">
            <h3 className="font-space-grotesk text-base font-bold text-text-primary mb-5 transition-colors">AI Tools</h3>
            <ul className="space-y-3.5 text-sm">
              <li><FooterLink to="/ai-tutor">AI Tutor</FooterLink></li>
              <li><FooterLink to="/pdf-summary">PDF Summary</FooterLink></li>
              <li><FooterLink to="/video-summary">Video Summary</FooterLink></li>
              <li><FooterLink to="/notes-generator">Notes Generator</FooterLink></li>
              <li><FooterLink to="/ai-coding-assistant">Coding Assistant</FooterLink></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-4">
            <h3 className="font-space-grotesk text-base font-bold text-text-primary mb-5 transition-colors">Stay Updated</h3>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed transition-colors">
              Get the latest AI learning tips, course updates, and exclusive offers delivered directly to your inbox.
            </p>
            <form className="relative mt-2 flex items-center group" onSubmit={(e) => e.preventDefault()}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail size={16} className="text-text-secondary/60 group-focus-within:text-accent-blue transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-32 py-3 rounded-xl bg-card-bg border border-card-border text-text-primary text-sm outline-none focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/20 transition-all duration-300 placeholder:text-text-secondary/50 shadow-sm"
                required
              />
              <button 
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-accent-blue rounded-lg text-white text-sm font-semibold hover:bg-accent-blue/90 transition-all duration-300 shadow-md flex items-center justify-center active:scale-95"
              >
                <span>Subscribe</span>
              </button>
            </form>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-text-secondary transition-colors"
        >
          <p>© {currentYear} LearnSphereAI Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <FooterLink to="/contact">Support</FooterLink>
            <FooterLink to="#">Privacy Policy</FooterLink>
            <FooterLink to="#">Terms of Service</FooterLink>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer