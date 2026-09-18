import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart } from 'lucide-react'
import {
  GenerateButton,
  MotionCard,
  StudentAiHeader,
  StudentAiStatus,
  glassCard,
  staggerContainer,
  useStudentAi,
} from './studentAiShared'

const LearningAnalyticsPanel = () => {
  const { post } = useStudentAi()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await post('/api/ai/student/learning-analytics', {})
      setResult(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  const trends = result?.trends || []

  return (
    <section className={`${glassCard} p-6`}>
      <StudentAiHeader
        icon={LineChart}
        title="Learning analytics"
        subtitle="Plain-language trends from your progress, completion, quizzes, and activity. This explains what is happening — it does not rebuild a course sequence or skill-gap map."
        action={<GenerateButton onClick={generate} loading={loading} label="Explain my trends" />}
      />
      <StudentAiStatus
        loading={loading && !result}
        error={error}
        empty={Boolean(result && !trends.length && !result.summary)}
        emptyMessage={result?.emptyReason || 'Analytics appear after enrollment and progress records exist.'}
      >
        {result?.summary ? (
          <p className="mb-4 text-sm leading-relaxed text-slate-700 dark:text-dk-text-2">{result.summary}</p>
        ) : null}
        {trends.length ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-3 lg:grid-cols-2">
            {trends.map((trend) => (
              <MotionCard key={trend.title}>
                <h3 className="font-semibold text-slate-900 dark:text-dk-text">{trend.title}</h3>
                <p className="mt-2 text-sm text-slate-700 dark:text-dk-text-2">{trend.observation}</p>
                {trend.why ? <p className="mt-2 text-sm text-slate-500 dark:text-dk-text-2"><span className="font-semibold">Why: </span>{trend.why}</p> : null}
                {trend.recommendation ? <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">{trend.recommendation}</p> : null}
                {trend.evidence?.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-dk-text-2">
                    {trend.evidence.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                ) : null}
              </MotionCard>
            ))}
          </motion.div>
        ) : null}
      </StudentAiStatus>
    </section>
  )
}

export default LearningAnalyticsPanel
