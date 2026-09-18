import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Check, FileText } from 'lucide-react'
import {
  GenerateButton,
  StudentAiHeader,
  StudentAiStatus,
  glassCard,
  useStudentAi,
} from './studentAiShared'

const emptyDraft = {
  headline: '',
  summary: '',
  skills: [],
  courses: [],
  projects: [],
  certificates: [],
  achievements: [],
}

const PortfolioGeneratorPanel = () => {
  const { post, get } = useStudentAi()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [emptyReason, setEmptyReason] = useState('')
  const [draft, setDraft] = useState(null)
  const [published, setPublished] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let cancelled = false
    get('/api/ai/student/portfolio')
      .then((data) => {
        if (cancelled) return
        setPublished(data?.published || null)
        if (data?.draft) {
          setDraft(data.draft)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [get])

  const generate = async () => {
    setLoading(true)
    setError(null)
    setEmptyReason('')
    try {
      const data = await post('/api/ai/student/portfolio/generate', {})
      if (data?.emptyReason) {
        setEmptyReason(data.emptyReason)
        setDraft(null)
        return
      }
      setDraft(data.draft || { ...emptyDraft })
      setDirty(true)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    setError(null)
    try {
      const data = await post('/api/ai/student/portfolio/save', { portfolio: draft })
      setPublished(data.portfolio)
      setDirty(false)
      toast.success('Portfolio saved after your review.')
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

  const updateListItem = (field, index, key, value) => {
    setDraft((prev) => {
      const next = [...(prev[field] || [])]
      next[index] = typeof next[index] === 'string' ? value : { ...next[index], [key]: value }
      return { ...prev, [field]: next }
    })
    setDirty(true)
  }

  return (
    <section className={`${glassCard} p-6`}>
      <StudentAiHeader
        icon={FileText}
        title="Portfolio generator"
        subtitle="Drafts copy only from completed courses, graded projects, certificates, skills, and coding practice. Review and edit every section before it is saved."
        action={<GenerateButton onClick={generate} loading={loading} label="Draft from my records" />}
      />
      <StudentAiStatus
        loading={loading && !draft}
        error={error}
        empty={Boolean(emptyReason)}
        emptyMessage={emptyReason}
      >
        {draft ? (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text-2">
              Headline
              <input
                value={draft.headline || ''}
                onChange={(event) => updateField('headline', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-base px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text-2">
              Summary
              <textarea
                rows={4}
                value={draft.summary || ''}
                onChange={(event) => updateField('summary', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-base px-4 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text-2">
              Skills (comma separated — only skills present in your records will be kept)
              <input
                value={(draft.skills || []).join(', ')}
                onChange={(event) => updateField('skills', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-base px-4 py-2.5 text-sm"
              />
            </label>
            {['courses', 'projects', 'certificates'].map((field) => (
              <div key={field}>
                <p className="text-sm font-semibold capitalize text-slate-700 dark:text-dk-text-2 mb-2">{field}</p>
                {(draft[field] || []).length ? (draft[field] || []).map((item, index) => (
                  <div key={`${item.title}-${index}`} className="mb-3 rounded-xl border border-slate-200 dark:border-dk-border p-3">
                    <p className="text-xs font-semibold text-blue-600">{item.title}</p>
                    <textarea
                      rows={2}
                      value={item.blurb || ''}
                      onChange={(event) => updateListItem(field, index, 'blurb', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-base px-3 py-2 text-sm"
                    />
                  </div>
                )) : <p className="text-sm text-slate-500">None in your records for this section.</p>}
              </div>
            ))}
            <label className="block text-sm font-semibold text-slate-700 dark:text-dk-text-2">
              Achievements
              <textarea
                rows={3}
                value={(draft.achievements || []).join('\n')}
                onChange={(event) => updateField('achievements', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))}
                className="mt-2 w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white dark:bg-dk-base px-4 py-2.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Check size={15} />
              {saving ? 'Saving…' : dirty ? 'Approve and save' : 'Saved'}
            </button>
          </div>
        ) : published ? (
          <div className="text-sm text-slate-600 dark:text-dk-text-2">
            <p className="font-semibold text-slate-900 dark:text-dk-text">{published.headline}</p>
            <p className="mt-2">{published.summary}</p>
          </div>
        ) : null}
      </StudentAiStatus>
    </section>
  )
}

export default PortfolioGeneratorPanel
