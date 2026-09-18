import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Briefcase, GitBranch } from 'lucide-react'
import {
  GenerateButton,
  MotionCard,
  StudentAiHeader,
  StudentAiStatus,
  glassCard,
  staggerContainer,
  useStudentAi,
} from './studentAiShared'

export const SkillGapPanel = () => {
  const navigate = useNavigate()
  const { post, get } = useStudentAi()
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    get('/api/ai/student/portfolio')
      .then((data) => {
        if (!cancelled && data?.targetRole) setTargetRole(data.targetRole)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [get])

  const generate = async () => {
    if (!targetRole.trim()) {
      toast.info('Enter a target role or skill goal first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await post('/api/ai/student/skill-gap', { targetRole: targetRole.trim() })
      setResult(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  const gaps = result?.gaps || []

  return (
    <section className={`${glassCard} p-6`}>
      <StudentAiHeader
        icon={GitBranch}
        title="Skill gap analyzer"
        subtitle="Maps missing skills to existing LearnSphereAI courses and lessons. This is not a career-readiness narrative."
        action={<GenerateButton onClick={generate} loading={loading} label="Map gaps" disabled={!targetRole.trim()} />}
      />
      <input
        value={targetRole}
        onChange={(event) => setTargetRole(event.target.value)}
        className="mb-5 w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white/80 dark:bg-dk-base px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        placeholder="Target role or skill goal, e.g. Frontend engineer"
      />
      <StudentAiStatus
        loading={loading && !result}
        error={error}
        empty={Boolean(result && !gaps.length)}
        emptyMessage="No mapped gaps were found in the published catalog for this target, or your evidence already covers the skills we could check."
      >
        {result?.presentSkills?.length ? (
          <p className="mb-4 text-xs text-slate-500 dark:text-dk-text-2">
            Evidence already supports: {result.presentSkills.join(', ')}
          </p>
        ) : null}
        {gaps.length ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
            {gaps.map((gap) => (
              <MotionCard key={gap.skill}>
                <h3 className="font-semibold text-slate-900 dark:text-dk-text">{gap.skill}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-dk-text-2">{gap.whyMissing}</p>
                {gap.evidenceChecked?.length ? (
                  <p className="mt-2 text-xs text-slate-500">Checked: {gap.evidenceChecked.join(' · ')}</p>
                ) : null}
                <div className="mt-3 space-y-2">
                  {gap.recommendedResources.map((resource) => (
                    <button
                      key={`${resource.courseId}-${resource.lessonId}`}
                      type="button"
                      onClick={() => navigate(`/course/${resource.courseId}`)}
                      className="block w-full rounded-lg border border-slate-200 dark:border-dk-border px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-dk-surface-2"
                    >
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{resource.courseTitle}</span>
                      {resource.lessonTitle ? <span className="text-slate-500"> · {resource.lessonTitle}</span> : null}
                      {resource.reason ? <p className="mt-1 text-xs text-slate-500">{resource.reason}</p> : null}
                    </button>
                  ))}
                </div>
              </MotionCard>
            ))}
          </motion.div>
        ) : null}
      </StudentAiStatus>
    </section>
  )
}

export const CareerReadinessPanel = () => {
  const { post, get } = useStudentAi()
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    get('/api/ai/student/portfolio')
      .then((data) => {
        if (!cancelled && data?.targetRole) setTargetRole(data.targetRole)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [get])

  const generate = async () => {
    if (!targetRole.trim()) {
      toast.info('Enter a target role first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await post('/api/ai/student/career-readiness', { targetRole: targetRole.trim() })
      setResult(data)
    } catch (err) {
      setError({ message: err.message, isNoKey: err.isNoKey })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`${glassCard} p-6`}>
      <StudentAiHeader
        icon={Briefcase}
        title="Career readiness"
        subtitle="Holistic strengths, referenced gaps, and next steps. Every insight shows supporting evidence from your records — it reuses skill-gap mapping rather than recomputing it."
        action={<GenerateButton onClick={generate} loading={loading} label="Assess readiness" disabled={!targetRole.trim()} />}
      />
      <input
        value={targetRole}
        onChange={(event) => setTargetRole(event.target.value)}
        className="mb-5 w-full rounded-xl border border-slate-200 dark:border-dk-border bg-white/80 dark:bg-dk-base px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
        placeholder="Same target role used by the skill gap analyzer"
      />
      <StudentAiStatus loading={loading && !result} error={error} empty={false}>
        {result ? (
          <div className="space-y-4">
            {result.summary ? <p className="text-sm leading-relaxed text-slate-700 dark:text-dk-text-2">{result.summary}</p> : null}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-3 md:grid-cols-2">
              {(result.strengths || []).map((item) => (
                <MotionCard key={item.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Strength</p>
                  <h3 className="mt-1 font-semibold text-slate-900 dark:text-dk-text">{item.title}</h3>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {(item.evidence || []).map((evidence) => <li key={evidence}>• {evidence}</li>)}
                  </ul>
                </MotionCard>
              ))}
              {(result.nextSteps || []).map((item) => (
                <MotionCard key={item.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Next step</p>
                  <h3 className="mt-1 font-semibold text-slate-900 dark:text-dk-text">{item.title}</h3>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {(item.evidence || []).map((evidence) => <li key={evidence}>• {evidence}</li>)}
                  </ul>
                </MotionCard>
              ))}
            </motion.div>
            {result.gapReferences?.length ? (
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Gaps referenced from the skill-gap map</p>
                {result.gapReferences.map((item) => (
                  <p key={item.skill} className="text-slate-600 dark:text-dk-text-2">
                    <span className="font-semibold">{item.skill}: </span>{item.note}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </StudentAiStatus>
    </section>
  )
}
