import React, { useState } from 'react'
import { motion } from 'framer-motion'

const NotesGenerator = () => {
  const [notes, setNotes] = useState("# Introduction to React\n\nReact is a library for building user interfaces...")
  
  const aiData = {
    summary: "React is a declarative, efficient, and flexible JavaScript library for building user interfaces.",
    keyPoints: ["Declarative", "Component-based", "Learn once, write anywhere"],
    formulas: ["render(Component, container)"],
    examples: ["function Welcome(props) { return <h1>Hello, {props.name}</h1>; }"]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 font-['Outfit']">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">Generated Study Notes</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">Copy</button>
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">PDF</button>
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200">DOCX</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">Regenerate</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Editor Panel */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 overflow-y-auto">
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-full resize-none outline-none text-slate-800 leading-relaxed"
          />
        </div>

        {/* Sidebar Panel */}
        <div className="w-[350px] space-y-6 overflow-y-auto">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-2">Summary</h2>
            <p className="text-sm text-slate-600">{aiData.summary}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-800 mb-2">Key Points</h2>
            <ul className="list-disc list-inside text-sm text-slate-600">
              {aiData.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotesGenerator
