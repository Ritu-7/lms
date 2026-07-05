import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from './Input'
import PasswordInput from './PasswordInput'
import { useLogin } from '../../hooks/useLogin'

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
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetEmailValues = z.infer<typeof emailSchema>
type ResetValues = z.infer<typeof resetSchema>

interface ForgotPasswordProps {
  onBack: () => void
}

const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const { beginPasswordReset, completePasswordReset, isResetting, resetStep, resetEmail, resetPasswordState, storedEmail } = useLogin()
  const [emailSnapshot, setEmailSnapshot] = useState(storedEmail)

  const emailForm = useForm<ResetEmailValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
    defaultValues: {
      email: storedEmail,
    },
  })

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
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-500">Reset access</p>
        <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">Recover your account securely</h3>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          We’ll send a one-time verification code to your email and let you set a new password immediately.
        </p>
      </div>

      {resetStep === 'email' ? (
        <form onSubmit={handleSendCode} className="space-y-5">
          <Input label="Email address" type="email" placeholder="you@example.com" error={emailForm.formState.errors.email?.message} {...emailForm.register('email')} />

          <button
            type="submit"
            disabled={!emailForm.formState.isValid || isResetting}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {isResetting ? 'Sending code...' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <Input label="Email address" type="email" placeholder="you@example.com" error={resetForm.formState.errors.email?.message} {...resetForm.register('email')} />
          <Input label="Verification code" inputMode="numeric" placeholder="6-digit code" error={resetForm.formState.errors.code?.message} {...resetForm.register('code')} />
          <PasswordInput label="New password" placeholder="Create a new password" error={resetForm.formState.errors.password?.message} {...resetForm.register('password')} />
          <PasswordInput label="Confirm new password" placeholder="Repeat your new password" error={resetForm.formState.errors.confirmPassword?.message} {...resetForm.register('confirmPassword')} />

          <button
            type="submit"
            disabled={!resetForm.formState.isValid || isResetting}
            className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResetting ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between gap-4 text-sm">
        <button type="button" onClick={() => { resetPasswordState(); onBack() }} className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300">
          Back to sign in
        </button>
        <span className="text-slate-500 dark:text-slate-400">{emailSnapshot || 'Enter your email to begin.'}</span>
      </div>
    </div>
  )
}

export default ForgotPassword
