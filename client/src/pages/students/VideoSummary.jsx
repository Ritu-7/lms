import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ReactPlayer from 'react-player'
import { Download, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'
import { aiRequest } from '../../utils/aiClient'
import NoApiKeyState from '../../components/ai/NoApiKeyState'

const VideoSummary = () => {
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState('summary')
  const [videoUrl, setVideoUrl] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'notes', label: 'Notes' },
    { id: 'flashcards', label: 'Flashcards' },
  ]

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      setError('Paste a transcript or source text before generating a summary.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data } = await aiRequest({
        backendURL,
        getToken,
        path: '/api/ai/video-summary',
        data: { title, sourceText, videoUrl },
        retries: 1,
      })
      setSummary(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.statusCode === 403 })
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold font-space-grotesk text-slate-900 dark:text-white truncate">
            {title || 'AI Video Summary'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Generate summaries from real transcript text</p>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          Generate Summary
        </button>
      </div>

      <div className="px-6 pt-4 max-w-[1700px] mx-auto w-full space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none"
          placeholder="Video title"
        />
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none"
          placeholder="Video URL"
        />
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none"
          placeholder="Paste transcript or lecture notes for the summary API"
        />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6 max-w-[1700px] mx-auto w-full">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
            {videoUrl ? (
              <ReactPlayer url={videoUrl} width="100%" height="100%" controls />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Add a video URL to preview it here</div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10">
            <h2 className="font-bold font-space-grotesk text-lg mb-4 text-slate-900 dark:text-white">Chapter-wise Summary</h2>
            {loading ? (
              <div className="py-10 flex items-center justify-center text-slate-500 gap-3"><Loader2 className="animate-spin" size={16} />Analyzing source text…</div>
            ) : error ? (
              error.isNoKey ? <NoApiKeyState /> :
              <div className="py-8 flex items-center gap-3 text-rose-600"><AlertTriangle size={16} />{error.message}</div>
            ) : summary?.chapters?.length ? (
              <div className="space-y-3">
                {summary.chapters.map((chapter, index) => (
                  <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{chapter.time || '00:00'} - {chapter.title}</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer flex items-center gap-1">Jump to <ChevronRight size={14} /></span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{chapter.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No chapter summary is available yet. Add transcript text and generate a summary.</p>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[450px] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-white/10">
            {tabs.map((tab) => (
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
            {activeTab === 'summary' && (summary?.summary ? <p>{summary.summary}</p> : <p>No summary yet. Generate one from a real transcript.</p>)}
            {activeTab === 'transcript' && (summary?.notes ? <p className="whitespace-pre-wrap">{summary.notes}</p> : <p>No transcript was returned.</p>)}
            {activeTab === 'notes' && (summary?.notes ? <p className="whitespace-pre-wrap">{summary.notes}</p> : <p>No notes were returned.</p>)}
            {activeTab === 'flashcards' && (summary?.flashcards?.length ? <div className="space-y-3">{summary.flashcards.map((card, index) => <div key={index} className="rounded-xl border border-slate-200 dark:border-white/10 p-4"><p className="font-semibold text-slate-900 dark:text-white">{card.front}</p><p className="mt-2 text-slate-600 dark:text-slate-300">{card.back}</p></div>)}</div> : <p>No flashcards were returned.</p>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoSummary
