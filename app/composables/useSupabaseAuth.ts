import { useState, useSupabaseClient } from '#imports'
import type { User } from '@supabase/supabase-js'
import { onMounted } from 'vue'
import { useTrackerAuthRedirects } from '../utils/authRedirects'
import { AUTH_NOTICES, AUTH_VALIDATION, normalizeAuthEmail, validateAuthEmailField } from '../utils/authNotices'
import { assertAuthEmailCooldown, formatAuthEmailCooldownMessage, isAuthEmailCooldownMessage, markAuthEmailSent } from '../utils/authEmailCooldown'
import { clearOAuthFlowMarker, markOAuthFlowStarted } from './useAuthEmailLink'
import { clearLocalSymptomData } from '../utils/localSymptomPrivacy'

type AuthFailure = {
  message?: string
  msg?: string
  code?: string
  error_code?: string
  status?: number
}

function validateAuthEmail(email: string) {
  const message = validateAuthEmailField(email)

  if (message) {
    throw new Error(message)
  }

  return normalizeAuthEmail(email)
}

export function useSupabaseAuth() {
  const supabase = useSupabaseClient()
  const authRedirects = useTrackerAuthRedirects()
  const user = useState<User | null>('tracker-auth-user', () => null)
  const isAuthLoading = useState('tracker-auth-loading', () => true)
  const authError = useState('tracker-auth-error', () => '')
  const authBootstrapStarted = useState('tracker-auth-bootstrap-started', () => false)
  const pendingConfirmEmail = useState<string | null>('tracker-pending-confirm-email', () => null)

  function clearPendingConfirmEmail() {
    pendingConfirmEmail.value = null
  }

  function markPendingConfirmEmail(email: string) {
    pendingConfirmEmail.value = normalizeAuthEmail(email)
  }

  async function bootstrapAuth() {
    if (authBootstrapStarted.value) {
      return
    }

    authBootstrapStarted.value = true

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        user.value = null
        return
      }

      user.value = session.user

      if (session.user.email_confirmed_at) {
        clearPendingConfirmEmail()
      }
    })

    try {
      // Hydrate from the local session first so signed-in users never flash the login UI.
      const { data: sessionData } = await supabase.auth.getSession()

      if (sessionData.session?.user) {
        user.value = sessionData.session.user
      }

      const { data, error } = await supabase.auth.getUser()

      if (error) {
        authError.value = getAuthErrorMessage(error)
      } else if (data.user) {
        user.value = data.user
      }
    } catch (error) {
      authError.value = getAuthErrorMessage(error)
    } finally {
      isAuthLoading.value = false
    }
  }

  if (import.meta.client) {
    void bootstrapAuth()
  }

  function getAuthErrorMessage(error: unknown) {
    if (error && typeof error === 'object') {
      const failure = error as AuthFailure
      const message = failure.message || failure.msg || ''
      const code = failure.error_code || failure.code || ''

      if (
        /session.*(does not exist|not found|invalid)|refresh token|already used|session_not_found|auth session missing/i.test(message)
        || /session_not_found|refresh_token_not_found|refresh_token_already_used|invalid_refresh_token/i.test(code)
      ) {
        return 'Your previous session just ended. Try signing in again.'
      }

      if (
        failure.error_code === 'email_not_confirmed'
        || failure.code === 'email_not_confirmed'
        || /email not confirmed/i.test(message)
      ) {
        return AUTH_NOTICES.emailConfirmationRequired
      }

      if (
        failure.error_code === 'invalid_credentials'
        || failure.code === 'invalid_credentials'
        || /invalid login credentials/i.test(message)
      ) {
        return 'Wrong password for this email. Use Forgot password, Continue with Google, or the password from Veterans Central Hub.'
      }

      if (
        failure.error_code === 'user_already_exists'
        || failure.code === 'user_already_exists'
        || failure.error_code === 'email_exists'
        || failure.code === 'email_exists'
        || /already (been )?registered|already exists|user already registered/i.test(message)
      ) {
        return 'An account with this email already exists. Switch to Sign in or use Forgot password.'
      }

      if (
        failure.error_code === 'signup_disabled'
        || failure.code === 'signup_disabled'
        || /signups? (are )?disabled/i.test(message)
      ) {
        return 'New signups are temporarily disabled. Try Sign in, Continue with Google, or contact support.'
      }

      if (
        /provider is not enabled|unsupported provider|oauth/i.test(message)
        || failure.error_code === 'provider_disabled'
      ) {
        return 'Google sign-in is not enabled yet. Use email and password, or contact support.'
      }

      if (
        failure.error_code === 'validation_failed'
        || failure.code === 'validation_failed'
        || /unable to validate email address/i.test(message)
        || /email address.*invalid/i.test(message)
      ) {
        return AUTH_VALIDATION.validEmail
      }

      if (
        failure.status === 429
        || /email rate limit exceeded/i.test(message)
        || /over_email_send_rate_limit/i.test(code)
      ) {
        return AUTH_NOTICES.authRateLimit
      }

      if (/for security purposes, you can only request this after/i.test(message)) {
        return formatAuthEmailCooldownMessage(30_000)
      }

      if (isAuthEmailCooldownMessage(message)) {
        return message
      }

      if (failure.status === 400 && message) {
        return message
      }

      if (message) {
        return message
      }
    }

    if (error instanceof Error) {
      if (/failed to fetch|fetch failed|networkerror|load failed/i.test(error.message)) {
        return 'Could not reach Supabase. Check your internet connection, Supabase project URL, and browser/network blocking.'
      }

      if (/invalid login credentials/i.test(error.message)) {
        return 'Wrong password for this email. Use Forgot password, Continue with Google, or the password from Veterans Central Hub.'
      }

      return error.message
    }

    return 'Authentication failed. Please try again.'
  }

  function isStaleSessionError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false
    }

    const failure = error as AuthFailure
    const message = (failure.message || failure.msg || '').toLowerCase()
    const code = (failure.error_code || failure.code || '').toLowerCase()

    return /session.*(does not exist|not found|invalid)|refresh token|already used|session_not_found|auth session missing/i.test(message)
      || /session_not_found|refresh_token_not_found|refresh_token_already_used|invalid_refresh_token/i.test(code)
  }

  function isBenignSignOutError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false
    }

    const failure = error as AuthFailure
    const message = (failure.message || failure.msg || '').toLowerCase()
    const code = (failure.error_code || failure.code || '').toLowerCase()

    return failure.status === 403
      || /session.*(does not exist|not found|missing)|auth session missing|session_not_found/i.test(message)
      || /session_not_found|auth_session_missing/i.test(code)
  }

  async function clearLocalAuthSession() {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // Ignore — storage may already be empty after a global sign-out.
    }
  }

  onMounted(() => {
    if (!authBootstrapStarted.value) {
      void bootstrapAuth()
    }
  })

  function requireAuthEmail(email: string) {
    return validateAuthEmail(email)
  }

  async function signIn(email: string, password: string) {
    authError.value = ''
    const normalizedEmail = requireAuthEmail(email)

    async function attemptSignIn() {
      const result = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })

      return result.error
    }

    let error: unknown

    try {
      error = await attemptSignIn()
    } catch (caughtError) {
      error = caughtError
    }

    if (error && isStaleSessionError(error)) {
      await clearLocalAuthSession()

      try {
        error = await attemptSignIn()
      } catch (caughtError) {
        error = caughtError
      }
    }

    if (error) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }

    clearPendingConfirmEmail()
  }

  function enforceAuthEmailCooldown(email: string) {
    try {
      assertAuthEmailCooldown(email)
    } catch (error) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    authError.value = ''
    const normalizedEmail = requireAuthEmail(email)

    enforceAuthEmailCooldown(normalizedEmail)

    if (pendingConfirmEmail.value === normalizedEmail) {
      return {
        user: null,
        session: null,
        needsEmailConfirmation: true
      }
    }

    const emailRedirectTo = authRedirects.confirmUrl()

    let data
    let error: unknown

    try {
      const result = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName
          }
        }
      })
      data = result.data
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    if (error) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }

    if (data.user?.identities?.length === 0) {
      const message = 'An account with this email already exists. Switch to Sign in or use Forgot password.'
      authError.value = message
      throw new Error(message)
    }

    if (data.session) {
      return {
        ...data,
        needsEmailConfirmation: false
      }
    }

    if (data.user) {
      const needsEmailConfirmation = !data.user.confirmed_at && !data.session

      if (needsEmailConfirmation) {
        markAuthEmailSent(normalizedEmail)
        markPendingConfirmEmail(normalizedEmail)

        return {
          user: data.user,
          session: null,
          needsEmailConfirmation: true
        }
      }

      try {
        await signIn(normalizedEmail, password)
      } catch (signInError) {
        if (/confirm your email/i.test(authError.value)) {
          markAuthEmailSent(normalizedEmail)
          markPendingConfirmEmail(normalizedEmail)

          return {
            user: data.user,
            session: null,
            needsEmailConfirmation: true
          }
        }

        authError.value = authError.value || 'Account created, but sign-in did not start. Try Sign in with the same password.'
        throw signInError
      }

      const { data: sessionData } = await supabase.auth.getSession()

      return {
        user: sessionData.session?.user ?? data.user,
        session: sessionData.session,
        needsEmailConfirmation: false
      }
    }

    authError.value = 'Signup did not return a user. Try again or contact support.'
    throw new Error(authError.value)
  }

  async function resendConfirmationEmail(email: string) {
    authError.value = ''
    const normalizedEmail = requireAuthEmail(email)

    enforceAuthEmailCooldown(normalizedEmail)

    const emailRedirectTo = authRedirects.confirmUrl()

    let error: unknown

    try {
      const result = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo
        }
      })
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    if (error) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }

    markAuthEmailSent(normalizedEmail)
    markPendingConfirmEmail(normalizedEmail)
  }

  async function signInWithGoogle() {
    authError.value = ''

    // Must match the current browser origin so the PKCE verifier stays in storage.
    // Never omit redirectTo — Supabase Site URL is still the .us hub.
    const redirectTo = authRedirects.callbackUrl()

    let error: unknown

    try {
      if (import.meta.client) {
        markOAuthFlowStarted()
      }

      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account'
          }
        }
      })
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    if (error) {
      clearOAuthFlowMarker()
      authError.value = getAuthErrorMessage(error)
      throw error
    }
  }

  async function sendPasswordReset(email: string) {
    authError.value = ''
    const normalizedEmail = requireAuthEmail(email)

    enforceAuthEmailCooldown(normalizedEmail)

    const redirectTo = authRedirects.resetPasswordUrl()

    let error: unknown

    try {
      const result = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo
      })
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    if (error) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }

    markAuthEmailSent(normalizedEmail)
  }

  async function signOut() {
    authError.value = ''
    const signedOutUserId = user.value?.id ?? null

    let error: unknown

    try {
      const result = await supabase.auth.signOut({ scope: 'local' })
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    if (error) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }

    clearLocalSymptomData(signedOutUserId)
    user.value = null
  }

  async function signOutEverywhere() {
    authError.value = ''
    const signedOutUserId = user.value?.id ?? null

    let error: unknown

    try {
      const result = await supabase.auth.signOut({ scope: 'global' })
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    await clearLocalAuthSession()
    clearLocalSymptomData(signedOutUserId)
    user.value = null

    if (error && !isBenignSignOutError(error)) {
      authError.value = getAuthErrorMessage(error)
      throw error
    }
  }

  async function verifyPassword(email: string, password: string) {
    if (!password) {
      throw new Error('Enter your password to continue.')
    }

    const normalizedEmail = requireAuthEmail(email)

    let error: unknown

    try {
      const result = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      })
      error = result.error
    } catch (caughtError) {
      error = caughtError
    }

    if (error) {
      throw new Error('Incorrect password.')
    }
  }

  return {
    user,
    isAuthLoading,
    authError,
    signIn,
    signUp,
    resendConfirmationEmail,
    signInWithGoogle,
    sendPasswordReset,
    signOut,
    signOutEverywhere,
    verifyPassword
  }
}
