import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { aiRequest } from '../../utils/aiClient'
import NoApiKeyState from '../../components/ai/NoApiKeyState'

const NotesGenerator = () => {
  const { getToken } = useAuth()
  const [notes, setNotes] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError('Paste source notes before generating a study version.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data } = await aiRequest({
        backendURL,
        getToken,
        path: '/api/ai/notes',
        data: { title, sourceText: notes },
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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-dk-base font-['Outfit']">
      <div className="h-16 flex items-center justify-between px-6 bg-white dark:bg-dk-surface border-b border-slate-200 dark:border-dk-border gap-3">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Generated Study Notes</h1>
        <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Regenerate
        </button>
      </div>

      <div className="px-6 pt-4 grid gap-3 max-w-[1400px] mx-auto w-full">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface px-4 py-3 text-sm outline-none text-slate-800 dark:text-white"
          placeholder="Source title"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-40 rounded-3xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-surface p-6 outline-none text-slate-800 dark:text-white leading-relaxed"
          placeholder="Paste source notes, lecture text, or transcript here"
        />
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        <div className="flex-1 bg-white dark:bg-dk-surface rounded-3xl shadow-sm border border-slate-100 dark:border-dk-border p-6 overflow-y-auto">
          {error ? (
            error.isNoKey ? <NoApiKeyState /> :
            <div className="flex items-center gap-3 text-rose-600"><AlertTriangle size={16} />{error.message}</div>
          ) : summary?.summary ? (
            <textarea value={summary.summary} readOnly className="w-full h-full resize-none outline-none text-slate-800 dark:text-white leading-relaxed bg-transparent" />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No generated notes yet. Paste source content and click Regenerate.</div>
          )}
        </div>

        <div className="w-[350px] space-y-6 overflow-y-auto">
          <div className="bg-white dark:bg-dk-surface p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-dk-border">
            <h2 className="font-bold text-slate-800 dark:text-white mb-2">Summary</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{summary?.summary || 'No summary available yet.'}</p>
          </div>
          <div className="bg-white dark:bg-dk-surface p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-dk-border">
            <h2 className="font-bold text-slate-800 dark:text-white mb-2">Key Points</h2>
            {summary?.keyPoints?.length ? (
              <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300">
                {summary.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No key points available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotesGenerator

