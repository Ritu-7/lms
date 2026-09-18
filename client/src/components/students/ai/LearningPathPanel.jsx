import React, { useContext, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Route } from 'lucide-react'
import { AppContext } from '../../../context/AppContext'
import {
  GenerateButton,
  MotionCard,
  StudentAiHeader,
  StudentAiStatus,
  fadeSlideUp,
  glassCard,
  hrefForLearningResource,
  staggerContainer,
  useStudentAi,
} from './studentAiShared'

const LearningPathPanel = () => {
  const navigate = useNavigate()
  const { userData } = useContext(AppContext)
  const { post, get } = useStudentAi()
  const [goals, setGoals] = useState(userData?.learningGoals || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    get('/api/ai/student/portfolio')
      .then((data) => {
        if (!cancelled && data?.learningGoals) setGoals(data.learningGoals)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [get])

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      if (goals.trim()) {
        await post('/api/ai/student/profile', { learningGoals: goals.trim() })
      }
      const data = await post('/api/ai/student/learning-path', {})
      setResult(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  const steps = result?.steps || []

  return (
    <section className={`${glassCard} p-6`}>
      <StudentAiHeader
        icon={Route}
        title="Personal learning path"
        subtitle="Next lessons, courses, and practice drawn from your enrollments, scores, and stated goals."
        action={<GenerateButton onClick={generate} loading={loading} label="Build path" />}
      />
      <textarea
        value={goals}
        onChange={(event) => setGoals(event.target.value)}
        rows={2}
        className="mb-5 w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white/80 dark:bg-dk-base px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        placeholder="Optional: what do you want to learn next? This is saved with your profile."
      />
      <StudentAiStatus
        loading={loading && !result}
        error={error}
        empty={Boolean(result && !steps.length)}
        emptyMessage={result?.emptyReason || 'No path could be built from your current enrollments.'}
      >
        {steps.length ? (
          <motion.ol variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {steps.map((step, index) => (
              <MotionCard key={`${step.courseId}-${step.lessonId}-${index}`}>
                <button type="button" onClick={() => navigate(hrefForLearningResource(step))} className="w-full text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Step {index + 1} · {step.kind}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-dk-text">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-dk-text-2">{step.reason}</p>
                </button>
              </MotionCard>
            ))}
          </motion.ol>
        ) : !loading && !error && !result ? (
          <motion.p variants={fadeSlideUp} initial="hidden" animate="visible" className="text-sm text-slate-500 dark:text-dk-text-2">
            Generate a sequence only after you have enrollments. Every step will cite a real score, incomplete lesson, or activity.
          </motion.p>
        ) : null}
      </StudentAiStatus>
      {error && !error.isNoKey ? (
        <button type="button" onClick={() => { toast.info('Retrying…'); generate() }} className="mt-3 text-sm font-semibold text-blue-600">
          Try again
        </button>
      ) : null}
    </section>
  )
}

export default LearningPathPanel
