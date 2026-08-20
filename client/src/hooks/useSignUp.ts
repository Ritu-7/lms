import { useState } from 'react'
import { useSignUp as useClerkSignUp } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import type { OAuthStrategy } from '../types/auth'

export interface SignUpFormValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

const getClerkErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const e = error as { errors?: Array<{ longMessage?: string; message?: string }>; message?: string }
    return e.errors?.[0]?.longMessage || e.errors?.[0]?.message || e.message || 'Sign up failed'
  }
  return 'Sign up failed'
}

export const useSignUp = () => {
  const { isLoaded, signUp, setActive } = useClerkSignUp()
  const navigate = useNavigate()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const completeSignUp = async (values: SignUpFormValues, role?: string) => {
    if (!isLoaded || !signUp) return

    if (values.password !== values.confirmPassword) {
      setSignUpError('Passwords do not match')
      toast.error('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setSignUpError(null)

    try {
      await signUp.create({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        emailAddress: values.email.trim().toLowerCase(),
        password: values.password,
        unsafeMetadata: { role },
      })

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
      toast.info('Verification code sent to your email')
    } catch (error) {
      const msg = getClerkErrorMessage(error)
      setSignUpError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyEmail = async (code: string) => {
    if (!isLoaded || !signUp) return

    setIsVerifying(true)
    setSignUpError(null)

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code })

      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId })
        toast.success('🎉 Account created! Welcome to LearnSphereAI')
        navigate('/')
      } else {
        toast.error('Verification incomplete. Please try again.')
      }
    } catch (error) {
      const msg = getClerkErrorMessage(error)
      setSignUpError(msg)
      toast.error(msg)
    } finally {
      setIsVerifying(false)
    }
  }

  const signUpWithProvider = async (strategy: OAuthStrategy) => {
    if (!isLoaded || !signUp) return

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (error) {
      toast.error(getClerkErrorMessage(error))
      throw error
    }
  }

  const resetSignUp = () => {
    setPendingVerification(false)
    setVerificationCode('')
    setSignUpError(null)
  }

  return {
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
  }
}
