import { useRoute, useSupabaseClient } from '#imports'
import type { Session } from '@supabase/supabase-js'

export type EmailLinkStatus = 'signed-in' | 'confirmed-needs-sign-in' | 'no-session'

export type EmailLinkResult = {
  session: Session | null
  linkType: string | null
  status: EmailLinkStatus
}

function readHashParams() {
  if (!import.meta.client || !window.location.hash) {
    return new URLSearchParams()
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ''))
}

const OAUTH_ORIGIN_STORAGE_KEY = 'symptom-tracker-oauth-origin'

function clearOAuthOriginMarker() {
  if (import.meta.client) {
    window.sessionStorage.removeItem(OAUTH_ORIGIN_STORAGE_KEY)
  }
}

export function markOAuthFlowStarted() {
  if (import.meta.client) {
    window.sessionStorage.setItem(OAUTH_ORIGIN_STORAGE_KEY, window.location.origin)
  }
}

export function clearOAuthFlowMarker() {
  clearOAuthOriginMarker()
}

async function readAccessToken(supabase: ReturnType<typeof useSupabaseClient>) {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function waitForNewOAuthSession(
  supabase: ReturnType<typeof useSupabaseClient>,
  previousAccessToken: string | null,
  attempts = 24,
  delayMs = 200
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const accessToken = await readAccessToken(supabase)

    if (accessToken && accessToken !== previousAccessToken) {
      const { data } = await supabase.auth.getSession()
      return data.session ?? null
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, delayMs)
    })
  }

  return null
}

async function exchangeAuthCode(supabase: ReturnType<typeof useSupabaseClient>, code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    throw error
  }

  return data.session
}

function isPkceVerifierMissingError(error: unknown) {
  const authError = error as { message?: string, code?: string, msg?: string } | null
  const message = String(authError?.message || authError?.msg || '').toLowerCase()
  const code = String(authError?.code || '').toLowerCase()

  return message.includes('code verifier')
    || message.includes('pkce')
    || code.includes('pkce')
}

function normalizeRoutePath(path: string) {
  if (!path || path === '/') {
    return path
  }

  return path.replace(/\/$/, '')
}

function resolveEmailLinkResult(
  session: Session | null,
  linkType: string | null,
  status: EmailLinkStatus = session ? 'signed-in' : 'no-session'
): EmailLinkResult {
  return {
    session,
    linkType,
    status
  }
}

async function resolveEmailConfirmationFailure(
  supabase: ReturnType<typeof useSupabaseClient>,
  error: unknown,
  linkType: string | null
): Promise<EmailLinkResult> {
  const recoveredSession = await waitForAnySession(supabase, 8, 150)

  if (recoveredSession) {
    return resolveEmailLinkResult(recoveredSession, linkType, 'signed-in')
  }

  if (isPkceVerifierMissingError(error)) {
    // Supabase confirms the email when the link is opened. PKCE only affects auto sign-in.
    return resolveEmailLinkResult(null, linkType, 'confirmed-needs-sign-in')
  }

  throw error
}

export { isPkceVerifierMissingError }

async function waitForAnySession(
  supabase: ReturnType<typeof useSupabaseClient>,
  attempts = 15,
  delayMs = 200
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data } = await supabase.auth.getSession()

    if (data.session?.user) {
      return data.session
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, delayMs)
    })
  }

  return null
}

async function completeEmailConfirmation(
  supabase: ReturnType<typeof useSupabaseClient>,
  code: string,
  linkType: string | null
): Promise<EmailLinkResult> {
  try {
    const existingSession = await waitForAnySession(supabase, 5, 150)

    if (existingSession) {
      return resolveEmailLinkResult(existingSession, linkType, 'signed-in')
    }

    const previousAccessToken = import.meta.client
      ? await readAccessToken(supabase)
      : null

    const autoExchangedSession = import.meta.client
      ? await waitForNewOAuthSession(supabase, previousAccessToken, 12, 150)
      : null

    if (autoExchangedSession) {
      return resolveEmailLinkResult(autoExchangedSession, linkType, 'signed-in')
    }

    const session = await exchangeAuthCode(supabase, code)

    return resolveEmailLinkResult(session, linkType, 'signed-in')
  } catch (error) {
    return resolveEmailConfirmationFailure(supabase, error, linkType)
  }
}

async function completeOAuthCallback(
  supabase: ReturnType<typeof useSupabaseClient>,
  code: string,
  linkType: string | null
): Promise<EmailLinkResult> {
  const oauthOrigin = import.meta.client
    ? window.sessionStorage.getItem(OAUTH_ORIGIN_STORAGE_KEY)
    : null

  if (!oauthOrigin) {
    throw new Error('This sign-in link expired or was already used. Go back and tap Continue with Google again.')
  }

  if (oauthOrigin !== window.location.origin) {
    throw new Error(`Google sign-in started on ${oauthOrigin} but returned to ${window.location.origin}. Open the same site again and retry in one tab.`)
  }

  const previousAccessToken = import.meta.client
    ? await readAccessToken(supabase)
    : null

  // The Supabase client can auto-exchange the code in the background
  // (detectSessionInUrl). Watch for SIGNED_IN so we know a fresh sign-in
  // happened during callback processing and skip the redundant exchange.
  let freshSignInDetected = false
  const authSubscription = import.meta.client
    ? supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          freshSignInDetected = true
        }
      }).data?.subscription
    : null

  try {
    const autoExchangedSession = import.meta.client
      ? await waitForNewOAuthSession(supabase, previousAccessToken)
      : null

    if (autoExchangedSession) {
      clearOAuthOriginMarker()
      return {
        session: autoExchangedSession,
        linkType,
        status: 'signed-in'
      }
    }

    if (freshSignInDetected) {
      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        clearOAuthOriginMarker()
        return {
          session: data.session,
          linkType,
          status: 'signed-in'
        }
      }
    }

    let recoveredFromConsumedVerifier = false

    const session = await exchangeAuthCode(supabase, code).catch(async (error) => {
      const recoveredSession = await waitForNewOAuthSession(supabase, previousAccessToken, 8, 150)

      if (recoveredSession) {
        return recoveredSession
      }

      // "PKCE code verifier not found" after the background exchange already
      // consumed the verifier is cosmetic: if a real session exists for a
      // user, the sign-in succeeded, so use it instead of surfacing the error.
      if (isPkceVerifierMissingError(error)) {
        const existingSession = await waitForAnySession(supabase)

        if (existingSession) {
          recoveredFromConsumedVerifier = true
          return existingSession
        }
      }

      throw error
    })

    // When the auto-exchange finished before we captured previousAccessToken,
    // the recovered session legitimately carries that same token, so the
    // same-token rejection only applies to genuinely stale flows.
    if (
      import.meta.client
      && previousAccessToken
      && session?.access_token === previousAccessToken
      && !freshSignInDetected
      && !recoveredFromConsumedVerifier
    ) {
      clearOAuthOriginMarker()
      throw new Error('Google sign-in did not start a new session. Go back and tap Continue with Google again.')
    }

    clearOAuthOriginMarker()

    return {
      session,
      linkType,
      status: 'signed-in'
    }
  } finally {
    authSubscription?.unsubscribe()
  }
}

export async function establishSessionFromEmailLink(): Promise<EmailLinkResult> {
  const supabase = useSupabaseClient()
  const route = useRoute()

  const queryCode = route.query.code
  const queryType = typeof route.query.type === 'string' ? route.query.type : null
  const tokenHash = route.query.token_hash
  const routePath = normalizeRoutePath(route.path)
  const isOAuthCallbackRoute = routePath === '/auth/callback'
  const isConfirmRoute = routePath === '/auth/confirm'
  const isResetPasswordRoute = routePath === '/auth/reset-password'

  if (typeof queryCode === 'string' && queryCode) {
    if (isOAuthCallbackRoute) {
      return completeOAuthCallback(supabase, queryCode, queryType)
    }

    if (isConfirmRoute || isResetPasswordRoute) {
      return completeEmailConfirmation(supabase, queryCode, queryType)
    }

    try {
      return resolveEmailLinkResult(
        await exchangeAuthCode(supabase, queryCode),
        queryType,
        'signed-in'
      )
    } catch (error) {
      if (routePath.startsWith('/auth/confirm') || routePath.startsWith('/auth/reset-password')) {
        return resolveEmailConfirmationFailure(supabase, error, queryType)
      }

      throw error
    }
  }

  if (typeof tokenHash === 'string' && tokenHash) {
    const otpType = (queryType || 'signup') as 'signup' | 'recovery' | 'email' | 'invite' | 'magiclink'
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType
    })

    if (error) {
      throw error
    }

    return {
      session: data.session,
      linkType: queryType || otpType,
      status: data.session ? 'signed-in' : 'no-session'
    }
  }

  if (import.meta.client) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 150)
    })
  }

  const hashParams = readHashParams()
  const hashType = hashParams.get('type')

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  if (sessionData.session) {
    return {
      session: sessionData.session,
      linkType: hashType || queryType,
      status: 'signed-in'
    }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (userData.user) {
    const { data: refreshedSession } = await supabase.auth.getSession()

    return {
      session: refreshedSession.session,
      linkType: hashType || queryType,
      status: refreshedSession.session ? 'signed-in' : 'no-session'
    }
  }

  return {
    session: null,
    linkType: hashType || queryType,
    status: 'no-session'
  }
}
