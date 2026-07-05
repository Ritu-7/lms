import React from 'react'
import Logo from '../common/Logo'

const Footer = () => {
  return (
    <footer className="w-full bg-slate-950 text-white pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 pb-16 border-b border-white/10">
          
          {/* Logo & Description */}
          <div className="flex flex-col space-y-6">
            <Logo light />
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              LearnSphereAI is the next generation of learning. Empowering students and educators with AI-driven tools to master any skill, anywhere in the world.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              {['facebook', 'twitter', 'instagram', 'linkedin'].map(social => (
                <a key={social} href="#" className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300">
                  <span className="sr-only">{social}</span>
                  <div className="h-4 w-4 bg-current rounded-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-space-grotesk text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/course-list" className="hover:text-white transition-colors">All Courses</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-space-grotesk text-lg font-bold mb-6">Platform</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">For Students</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Educators</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Tutor</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Certifications</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-space-grotesk text-lg font-bold mb-6">Stay Updated</h3>
            <p className="text-sm text-slate-400 mb-4">
              Get the latest AI learning tips and course updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-500 transition-colors"
              />
              <button className="px-4 py-2 bg-blue-600 rounded-xl text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 LearnSphereAI Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
