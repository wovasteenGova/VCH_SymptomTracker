import type { SubmissionToastPayload } from '../composables/useSubmissionToast'
import { isAuthEmailCooldownMessage } from './authEmailCooldown'
import { resolveVchContactUrl } from './vchHost'

export const AUTH_NOTICE_DURATION_MS = 5200

export const AUTH_VALIDATION = {
  validEmail: 'Enter a valid email address.',
  fullName: 'Enter your full name.',
  passwordLength: 'Password must be at least 6 characters.',
  passwordMatch: 'Passwords do not match.',
  enterEmailForForgotPassword: 'Enter your email first, then tap Forgot password again.',
  enterEmailForResendConfirmation: 'Enter your email first, then tap Resend confirmation email.'
} as const

export const AUTH_NOTICES = {
  emailConfirmationRequired:
    'Confirm your email first. Check spam for mail from Supabase, or tap Resend confirmation email below.',
  signupCheckEmail: 'Check your email to confirm your account.',
  confirmationEmailSent: 'Confirmation email sent. Check spam if you do not see it.',
  passwordResetSent: 'Password reset email sent. Check spam if it does not arrive.',
  authRateLimit:
    'We had an error logging you in due to an auth limit. If this error is unexpected, please contact us.'
} as const

const AUTH_VALIDATION_MESSAGES = new Set<string>(Object.values(AUTH_VALIDATION))

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validateAuthEmailField(email: string): string | null {
  const normalized = normalizeAuthEmail(email)

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return AUTH_VALIDATION.validEmail
  }

  return null
}

export function validateSignupForm(options: {
  mode: 'login' | 'signup'
  name: string
  email: string
  password: string
  confirmPassword: string
}): string | null {
  if (options.mode === 'signup' && !options.name.trim()) {
    return AUTH_VALIDATION.fullName
  }

  const emailError = validateAuthEmailField(options.email)

  if (emailError) {
    return emailError
  }

  if (options.mode === 'signup' && options.password.length < 6) {
    return AUTH_VALIDATION.passwordLength
  }

  if (options.mode === 'signup' && options.password !== options.confirmPassword) {
    return AUTH_VALIDATION.passwordMatch
  }

  return null
}

export function isAuthValidationMessage(message: string) {
  return AUTH_VALIDATION_MESSAGES.has(message)
}

export function isEmailConfirmationNotice(message: string) {
  return /confirm your email/i.test(message)
}

export function isAuthRateLimitMessage(message: string) {
  return message === AUTH_NOTICES.authRateLimit
}

export function authRateLimitErrorToast(): SubmissionToastPayload {
  return {
    message: AUTH_NOTICES.authRateLimit,
    tone: 'error',
    durationMs: AUTH_NOTICE_DURATION_MS,
    action: {
      href: resolveVchContactUrl(),
      label: 'Contact us'
    }
  }
}

export function authErrorToastForMessage(message: string): SubmissionToastPayload {
  if (isAuthRateLimitMessage(message)) {
    return authRateLimitErrorToast()
  }

  return authErrorToast(message)
}

export function authNoticeToast(
  message: string,
  options?: Pick<SubmissionToastPayload, 'highlight' | 'tone'>
): SubmissionToastPayload {
  return {
    message,
    tone: options?.tone ?? 'success',
    durationMs: AUTH_NOTICE_DURATION_MS,
    ...options
  }
}

export function authErrorToast(
  message: string,
  options?: Pick<SubmissionToastPayload, 'highlight'>
): SubmissionToastPayload {
  return {
    message,
    tone: 'error',
    durationMs: AUTH_NOTICE_DURATION_MS,
    ...options
  }
}

export function authSuccessToast(message: string): SubmissionToastPayload {
  return {
    message,
    tone: 'success',
    durationMs: AUTH_NOTICE_DURATION_MS
  }
}

export function resolveAuthApiErrorMessage(
  authError: string,
  fallback: string
) {
  return authError || fallback
}

export function handleAuthApiFailure(options: {
  message: string
  authEmail: string
  setValidationMessage: (message: string) => void
  clearAuthError: () => void
  showToast: (payload: SubmissionToastPayload) => void
  setNeedsEmailConfirmation?: (value: boolean) => void
  setAuthModeLogin?: () => void
}) {
  const { message } = options

  if (/already exists|already has a VCH account/i.test(message) && options.setAuthModeLogin) {
    options.setAuthModeLogin()
  }

  if (isEmailConfirmationNotice(message)) {
    options.setNeedsEmailConfirmation?.(true)
    options.setAuthModeLogin?.()
    options.showToast(authNoticeToast(AUTH_NOTICES.emailConfirmationRequired))
    options.clearAuthError()
    return
  }

  if (isAuthValidationMessage(message)) {
    options.setValidationMessage(message)
    options.clearAuthError()
    return
  }

  if (isAuthEmailCooldownMessage(message)) {
    options.setValidationMessage(message)
    options.clearAuthError()
    return
  }

  options.showToast(authErrorToastForMessage(message))
  options.clearAuthError()
}
