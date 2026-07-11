import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { useAuthModal } from '../contexts/AuthContext'
import type { LoginFormValues, OAuthStrategy, ResetPasswordValues } from '../types/auth'

const getClerkErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const clerkError = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string }
    return clerkError.errors?.[0]?.longMessage || clerkError.errors?.[0]?.message || clerkError.message || 'Authentication failed'
  }

  return 'Authentication failed'
}

export const useLogin = () => {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { closeAuth } = useAuthModal()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email')
  const [resetEmail, setResetEmail] = useState('')

  const storedEmail = typeof window === 'undefined' ? '' : window.localStorage.getItem('lms-auth-email') || ''

  const completeLogin = async (values: LoginFormValues) => {
    if (!isLoaded || !signIn) return

    const email = values.email.trim().toLowerCase()
    setIsSubmitting(true)

    try {
      if (values.rememberMe && typeof window !== 'undefined') {
        window.localStorage.setItem('lms-auth-email', email)
      }

      const attempt = await signIn.create({
        strategy: 'password',
        identifier: email,
        password: values.password,
      })

      if (attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId })
        toast.success('Welcome back')
        closeAuth()
        return
      }

      toast.success('Login attempt completed')
    } catch (error) {
      toast.error(getClerkErrorMessage(error))
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithProvider = async (strategy: OAuthStrategy) => {
    if (!isLoaded || !signIn) return

    try {
      // Clerk v5 requires BOTH redirectUrl and redirectUrlComplete for oauth_<provider>
      // strategies. redirectUrl is the intermediate route that completes the OAuth
      // handshake (must render <AuthenticateWithRedirectCallback /> or call
      // Clerk.handleRedirectCallback()); redirectUrlComplete is the final destination
      // once the sign-in is fully established. Omitting redirectUrl is what produced
      // the "verified not supported yet" error, since the SDK couldn't finalize the
      // transfer/verification step correctly.
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (error) {
      toast.error(getClerkErrorMessage(error))
      throw error
    }
  }

  const beginPasswordReset = async (email: string) => {
    if (!isLoaded || !signIn) return

    const sanitizedEmail = email.trim().toLowerCase()
    setIsResetting(true)

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: sanitizedEmail,
      })

      setResetEmail(sanitizedEmail)
      setResetStep('code')
      toast.success('Password reset code sent')
    } catch (error) {
      toast.error(getClerkErrorMessage(error))
      throw error
    } finally {
      setIsResetting(false)
    }
  }

  const completePasswordReset = async (values: ResetPasswordValues) => {
    if (!isLoaded || !signIn) return

    setIsResetting(true)

    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: values.code,
        password: values.password,
      })

      if (attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId })
        toast.success('Password updated')
        closeAuth()
      }
    } catch (error) {
      toast.error(getClerkErrorMessage(error))
      throw error
    } finally {
      setIsResetting(false)
    }
  }

  const resetPasswordState = () => {
    setResetStep('email')
    setResetEmail('')
  }

  return {
    completeLogin,
    signInWithProvider,
    beginPasswordReset,
    completePasswordReset,
    resetPasswordState,
    resetStep,
    resetEmail,
    isSubmitting,
    isResetting,
    storedEmail,
  }
}