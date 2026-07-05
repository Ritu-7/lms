import React, { useState } from 'react'
import ReactPlayer from 'react-player'
import { motion } from 'framer-motion'
import { Download, ChevronRight } from 'lucide-react'

const VideoSummary = () => {
  const [activeTab, setActiveTab] = useState('summary')

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'notes', label: 'Notes' },
    { id: 'flashcards', label: 'Flashcards' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
        <h1 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white">Advanced React Patterns</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          <Download size={16} /> Download Summary
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6 max-w-[1700px] mx-auto w-full">
        {/* Main Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
            <ReactPlayer url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" width="100%" height="100%" controls />
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10">
            <h2 className="font-bold font-space-grotesk text-lg mb-4 text-slate-900 dark:text-white">Chapter-wise Summary</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((chapter) => (
                <div key={chapter} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">00:00 - Introduction Chapter {chapter}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer flex items-center gap-1">Jump to <ChevronRight size={14}/></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-[450px] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-white/10">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {activeTab === 'summary' && <p>AI Generated summary content goes here...</p>}
            {activeTab === 'transcript' && <p>Transcript content goes here...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoSummary
