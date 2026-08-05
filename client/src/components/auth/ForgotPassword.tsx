import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import Input from './Input'
import PasswordInput from './PasswordInput'
import { useLogin } from '../../hooks/useLogin'

// ── Schemas ───────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

const resetSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    code: z.string().min(6, 'Enter the 6-digit verification code'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Z]/, 'Add one uppercase letter')
      .regex(/[a-z]/, 'Add one lowercase letter')
      .regex(/[0-9]/, 'Add one number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetEmailValues = z.infer<typeof emailSchema>
type ResetValues = z.infer<typeof resetSchema>

// ── Props ─────────────────────────────────────────────────
interface ForgotPasswordProps {
  onBack: () => void
}

const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const {
    beginPasswordReset,
    completePasswordReset,
    isResetting,
    resetStep,
    resetEmail,
    resetPasswordState,
    storedEmail,
  } = useLogin()

  const [emailSnapshot, setEmailSnapshot] = useState(storedEmail)

  // ── Email form ─────────────────────────────────────────
  const emailForm = useForm<ResetEmailValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
    defaultValues: { email: storedEmail },
  })

  // ── Reset form ─────────────────────────────────────────
  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: {
      email: storedEmail,
      code: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Sync stored email
  useEffect(() => {
    if (storedEmail) {
      emailForm.reset({ email: storedEmail })
      resetForm.reset({
        email: storedEmail,
        code: resetForm.getValues('code'),
        password: resetForm.getValues('password'),
        confirmPassword: resetForm.getValues('confirmPassword'),
      })
    }
  }, [emailForm, resetForm, storedEmail])

  // Sync reset email after code is sent
  useEffect(() => {
    if (resetEmail) {
      setEmailSnapshot(resetEmail)
      resetForm.setValue('email', resetEmail)
    }
  }, [resetEmail, resetForm])

  const handleSendCode = emailForm.handleSubmit(async ({ email }) => {
    setEmailSnapshot(email)
    await beginPasswordReset(email)
  })

  const handleResetPassword = resetForm.handleSubmit(async (values) => {
    await completePasswordReset(values)
  })

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
          Reset access
        </p>
        <h3 className="font-space-grotesk text-2xl font-bold tracking-tight text-white">
          Recover your account
        </h3>
        <p className="text-sm leading-6 text-slate-300">
          We'll send a one-time code to your email so you can set a new password.
        </p>
      </div>

      {/* ── Step indicator ────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
            resetStep === 'email' ? 'bg-cyan-400' : 'bg-cyan-400'
          }`}
        />
        <span
          className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
            resetStep === 'reset' ? 'bg-cyan-400' : 'bg-white/15'
          }`}
        />
        <span className="ml-1 text-[11px] text-slate-500">
          Step {resetStep === 'email' ? '1' : '2'} of 2
        </span>
      </div>

      {/* ── Forms ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {resetStep === 'email' ? (
          <motion.form
            key="email-step"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSendCode}
            className="space-y-5"
          >
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register('email')}
            />

            <button
              type="submit"
              disabled={!emailForm.formState.isValid || isResetting}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(37,99,235,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? 'Sending code…' : 'Send reset code'}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="reset-step"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleResetPassword}
            className="space-y-5"
          >
            {/* Code sent to email notice */}
            {emailSnapshot ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                <span className="text-slate-300">
                  Code sent to{' '}
                  <span className="font-semibold text-white">{emailSnapshot}</span>
                </span>
              </div>
            ) : null}

            <Input
              label="Verification code"
              inputMode="numeric"
              placeholder="6-digit code"
              error={resetForm.formState.errors.code?.message}
              {...resetForm.register('code')}
            />

            <PasswordInput
              label="New password"
              placeholder="Create a strong password"
              error={resetForm.formState.errors.password?.message}
              {...resetForm.register('password')}
            />

            <PasswordInput
              label="Confirm new password"
              placeholder="Repeat your new password"
              error={resetForm.formState.errors.confirmPassword?.message}
              {...resetForm.register('confirmPassword')}
            />

            <button
              type="submit"
              disabled={!resetForm.formState.isValid || isResetting}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(37,99,235,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? 'Resetting password…' : 'Set new password'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Back to sign in ───────────────────────────── */}
      <button
        type="button"
        onClick={() => {
          resetPasswordState()
          onBack()
        }}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 011.414 1.414L6.414 9H17a1 1 0 110 2H6.414l3.293 3.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to sign in
      </button>
    </div>
  )
}

export default ForgotPassword
