import FloatingCards from './FloatingCards'
import GradientBlob from './GradientBlob'
import AnimatedShapes from './AnimatedShapes'
import ParticleBackground from './ParticleBackground'
import FeatureCard from './FeatureCard'
import Logo from '../common/Logo'
import type { AuthRoleKey } from '../../types/auth'

interface LeftBannerProps {
  role: AuthRoleKey
}

const roleCopy: Record<AuthRoleKey, { title: string; subtitle: string; kicker: string }> = {
  student: {
    title: 'Every lesson. Every milestone. Yours.',
    subtitle: 'Track progress, access materials, and achieve your learning goals in one beautifully designed workspace.',
    kicker: 'Student workspace',
  },
  instructor: {
    title: 'Teach with purpose. Track with clarity.',
    subtitle: 'Manage courses, engage with students, and analyze performance effortlessly.',
    kicker: 'Instructor studio',
  },
  administrator: {
    title: 'Total control. Full visibility.',
    subtitle: 'Oversee the entire platform, manage permissions, and ensure security from a centralized dashboard.',
    kicker: 'Admin console',
  },
}

const LeftBanner = ({ role }: LeftBannerProps) => {
  const copy = roleCopy[role]

  return (
    <section className="relative hidden h-full w-full overflow-hidden bg-slate-950 px-8 py-8 text-white lg:flex lg:flex-col lg:justify-between">
      <GradientBlob />
      <AnimatedShapes />
      <ParticleBackground />

      <div className="relative z-10 space-y-6">
        <Logo light />
      </div>

      <div className="relative z-10 max-w-xl flex-1 flex flex-col justify-center space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
            <div className={`h-2 w-2 rounded-full ${role === 'student' ? 'bg-blue-500' : role === 'instructor' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
            {copy.kicker}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="max-w-lg text-5xl font-bold tracking-tight font-space-grotesk leading-[1.1]">{copy.title}</h1>
        </div>
      </div>



      <div className="relative z-10 mt-auto pt-10 flex items-center justify-between text-sm text-slate-500">
        <div>© 2026 LearnSphereAI Inc. · v1.0.0</div>
      </div>
    </section>
  )
}

export default LeftBanner
