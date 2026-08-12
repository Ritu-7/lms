import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useSignUp } from '../../hooks/useSignUp'
import { SOCIAL_PROVIDERS } from '../../types/auth'
import Input from './Input'
import PasswordInput from './PasswordInput'
import SocialLoginButton from './SocialLoginButton'
import LoadingOverlay from './LoadingOverlay'
import AuthFooter from './AuthFooter'

// ─── Schemas ──────────────────────────────────────────────────────────────────
const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50, 'Too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Too long'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Add one uppercase letter')
      .regex(/[a-z]/, 'Add one lowercase letter')
      .regex(/[0-9]/, 'Add one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignUpFormData = z.infer<typeof signUpSchema>

// ─── Password Strength Bar ─────────────────────────────────────────────────
const getStrength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: '', color: 'bg-slate-700' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-emerald-500' },
    { label: 'Very strong', color: 'bg-cyan-400' },
  ]
  return { score, ...map[score] }
}

const StrengthBar = ({ password }: { password: string }) => {
  const { score, label, color } = getStrength(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? color : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      {label && (
        <p className={`text-[11px] font-medium ${score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
          {label} password
        </p>
      )}
    </div>
  )
}

// ─── Email Verification Step ───────────────────────────────────────────────
interface VerifyStepProps {
  email: string
  code: string
  setCode: (v: string) => void
  onVerify: () => void
  onBack: () => void
  isVerifying: boolean
  error: string | null
}

const VerifyStep = ({ email, code, setCode, onVerify, onBack, isVerifying, error }: VerifyStepProps) => (
  <motion.div
    key="verify"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.28, ease: 'easeOut' }}
    className="space-y-6"
  >
    {/* Icon */}
    <div className="flex flex-col items-center gap-3 pt-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-[0_8px_24px_rgba(99,102,241,0.35)]">
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Check your inbox</p>
        <h2 className="mt-1 font-space-grotesk text-2xl font-bold text-white">Verify your email</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          We sent a 6-digit code to <span className="font-semibold text-slate-200">{email}</span>
        </p>
      </div>
    </div>

    {/* OTP input */}
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-300">Verification code</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder:text-slate-600 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
        autoFocus
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>

    {/* Buttons */}
    <div className="space-y-3">
      <button
        type="button"
        onClick={onVerify}
        disabled={code.length < 6 || isVerifying}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(37,99,235,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isVerifying ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span>Verifying…</span>
          </>
        ) : (
          <span>Confirm & Create Account</span>
        )}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-2xl border border-white/10 py-3 text-sm font-semibold text-slate-400 transition hover:border-white/20 hover:text-slate-200"
      >
        ← Back to sign up
      </button>
    </div>
  </motion.div>
)

// ─── Main SignUpForm ─────────────────────────────────────────────────────────
interface SignUpFormProps {
  onSwitchToLogin: () => void
}

const SignUpForm = ({ onSwitchToLogin }: SignUpFormProps) => {
  const {
    completeSignUp,
    verifyEmail,
    signUpWithProvider,
    resetSignUp,
    pendingVerification,
    verificationCode,
    setVerificationCode,
    isSubmitting,
    isVerifying,
    signUpError,
  } = useSignUp()

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  })

  const password = form.watch('password')
  const email = form.watch('email')

  const handleSubmit = form.handleSubmit(async (values) => {
    await completeSignUp(values)
  })

  if (pendingVerification) {
    return (
      <VerifyStep
        email={email}
        code={verificationCode}
        setCode={setVerificationCode}
        onVerify={() => verifyEmail(verificationCode)}
        onBack={resetSignUp}
        isVerifying={isVerifying}
        error={signUpError}
      />
    )
  }

  return (
    <motion.div
      key="signup-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative space-y-5"
    >
      {isSubmitting ? <LoadingOverlay /> : null}

      {/* ── Heading ──────────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
          Create account
        </p>
        <h2 className="font-space-grotesk text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Join LearnSphereAI
        </h2>
        <p className="text-sm leading-6 text-slate-400">
          Start your learning journey today — completely free.
        </p>
      </div>

      {/* ── Form ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            type="text"
            placeholder="Alex"
            error={form.formState.errors.firstName?.message}
            autoComplete="given-name"
            {...form.register('firstName')}
          />
          <Input
            label="Last name"
            type="text"
            placeholder="Johnson"
            error={form.formState.errors.lastName?.message}
            autoComplete="family-name"
            {...form.register('lastName')}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          autoComplete="email"
          {...form.register('email')}
        />

        <div>
          <PasswordInput
            label="Password"
            placeholder="Min. 8 characters"
            error={form.formState.errors.password?.message}
            autoComplete="new-password"
            {...form.register('password')}
          />
          <StrengthBar password={password} />
        </div>

        <PasswordInput
          label="Confirm password"
          placeholder="Re-enter your password"
          error={form.formState.errors.confirmPassword?.message}
          autoComplete="new-password"
          {...form.register('confirmPassword')}
        />

        {/* Server error */}
        <AnimatePresence>
          {signUpError && (
            <motion.p
              key="signup-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-xs text-red-400"
            >
              {signUpError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={!form.formState.isValid || isSubmitting}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(37,99,235,0.45)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              <span>Creating account…</span>
            </>
          ) : (
            <span>Create my account →</span>
          )}
        </button>
      </form>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="relative flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-medium uppercase tracking-widest text-slate-500">or sign up with</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── Social ───────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIAL_PROVIDERS.map((provider) => (
          <SocialLoginButton
            key={provider.key}
            provider={provider}
            onClick={() => signUpWithProvider(provider.strategy)}
            isLoading={isSubmitting}
          />
        ))}
      </div>

      {/* ── Switch to Login ───────────────────────────────── */}
      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-cyan-300 transition hover:text-cyan-200 hover:underline underline-offset-2"
        >
          Sign in
        </button>
      </p>

      {/* ── Footer ───────────────────────────────────────── */}
      <AuthFooter />
    </motion.div>
  )
}

export default SignUpForm
