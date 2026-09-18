import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Target } from 'lucide-react'
import {
  GenerateButton,
  MotionCard,
  StudentAiHeader,
  StudentAiStatus,
  glassCard,
  staggerContainer,
  useStudentAi,
} from './studentAiShared'

const hrefForAction = (action) => {
  if (action.hrefHint === 'quiz' && action.entityId) return `/quiz/${action.entityId}`
  if (action.hrefHint === 'assignment') return '/assignments'
  if (action.courseId) return `/player/${action.courseId}`
  return '/my-enrollments'
}

const StudyCoachPanel = () => {
  const navigate = useNavigate()
  const { post } = useStudentAi()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await post('/api/ai/student/study-coach', { question: question.trim() })
      setResult(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  const actions = result?.actions || []

  return (
    <section className={`${glassCard} p-6`}>
      <StudentAiHeader
        icon={Target}
        title="Study coach"
        subtitle="Action-oriented next steps from incomplete lessons, upcoming assessments, and quiz performance — not a diagnostic essay."
        action={<GenerateButton onClick={generate} loading={loading} label={question.trim() ? 'Ask coach' : 'What should I do next?'} />}
      />
      <div className="mb-5 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="flex-1 rounded-xl border border-slate-200 dark:border-dk-border bg-white/80 dark:bg-dk-base px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Ask about your own progress, e.g. what should I finish before Friday?"
        />
      </div>
      <StudentAiStatus
        loading={loading && !result}
        error={error}
        empty={Boolean(result && !actions.length && !result.reply)}
        emptyMessage={result?.emptyReason || 'The coach needs enrollments or quiz activity before it can suggest a next action.'}
      >
        {result?.reply ? (
          <div className="mb-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-950/30 px-4 py-3 text-sm text-slate-700 dark:text-dk-text-2 flex gap-2">
            <MessageCircle size={16} className="mt-0.5 shrink-0 text-indigo-500" />
            {result.reply}
          </div>
        ) : null}
        {actions.length ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-3 md:grid-cols-2">
            {actions.map((action) => (
              <MotionCard key={`${action.title}-${action.entityId}`}>
                <button type="button" onClick={() => navigate(hrefForAction(action))} className="w-full text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-dk-text">{action.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-dk-text-2">{action.why}</p>
                </button>
              </MotionCard>
            ))}
          </motion.div>
        ) : null}
      </StudentAiStatus>
    </section>
  )
}

export default StudyCoachPanel
