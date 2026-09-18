import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import {
  GenerateButton,
  MotionCard,
  StudentAiHeader,
  StudentAiStatus,
  glassCard,
  staggerContainer,
  useStudentAi,
} from './studentAiShared'
import { motion } from 'framer-motion'

const ExamPrepPanel = ({ quizId, compact = false }) => {
  const navigate = useNavigate()
  const { post } = useStudentAi()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await post('/api/ai/student/exam-prep', quizId ? { quizId } : {})
      setResult(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  const topics = result?.topics || []
  const questions = result?.practiceQuestions || []

  return (
    <section className={`${glassCard} p-6`}>
      <StudentAiHeader
        icon={ClipboardCheck}
        title={result?.focusTitle || 'Exam preparation'}
        subtitle="Revision topics ranked by weakness, plus practice questions grounded in your course content and past assessments."
        action={<GenerateButton onClick={generate} loading={loading} label="Build prep plan" />}
      />
      <StudentAiStatus
        loading={loading && !result}
        error={error}
        empty={Boolean(result && !topics.length && !questions.length)}
        emptyMessage={result?.emptyReason || 'No prep plan could be built from your assessment history yet.'}
        compact={compact}
      >
        {result?.weakAreaFocus?.length ? (
          <p className="mb-4 text-sm text-slate-600 dark:text-dk-text-2">
            Weak-area focus: {result.weakAreaFocus.join(', ')}
          </p>
        ) : null}
        {topics.length ? (
          <motion.ol variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3 mb-4">
            {topics.map((topic) => (
              <MotionCard key={`${topic.rank}-${topic.topic}`}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => topic.courseId && navigate(`/player/${topic.courseId}`)}
                >
                  <p className="text-xs font-semibold text-blue-600">Rank {topic.rank}</p>
                  <h3 className="font-semibold text-slate-900 dark:text-dk-text">{topic.topic}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-dk-text-2">{topic.why}</p>
                </button>
              </MotionCard>
            ))}
          </motion.ol>
        ) : null}
        {questions.length ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-dk-text">Practice questions (ungraded)</p>
            {questions.map((item, index) => (
              <div key={`${item.prompt}-${index}`} className="rounded-xl border border-slate-200 dark:border-dk-border p-3 text-sm">
                <p className="font-medium text-slate-900 dark:text-dk-text">{item.prompt}</p>
                {item.hint ? <p className="mt-1 text-slate-500">Hint: {item.hint}</p> : null}
                {item.sourceLesson ? <p className="mt-1 text-xs text-slate-400">From: {item.sourceLesson}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </StudentAiStatus>
    </section>
  )
}

export default ExamPrepPanel
