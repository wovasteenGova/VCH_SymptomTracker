import { TRACKER_PUBLIC_ORIGIN } from './reportBranding'
import { rewriteVchUrlToCurrentTld } from './vchHost'

function isLocalOrigin(value: string) {
  try {
    const hostname = new URL(value).hostname
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname.endsWith('.local')
  } catch {
    return false
  }
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function hostnameFromOrigin(value?: string | null) {
  if (!value) {
    return ''
  }

  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

export function resolveCurrentOrigin(configuredSiteUrl?: string | null, currentOrigin?: string | null) {
  const configured = configuredSiteUrl?.trim()
  const liveOrigin = currentOrigin
    ?? (import.meta.client ? window.location.origin : '')

  if (liveOrigin) {
    const origin = stripTrailingSlash(liveOrigin)

    if (!isLocalOrigin(origin)) {
      return origin
    }

    if (configured && !isLocalOrigin(configured)) {
      return rewriteVchUrlToCurrentTld(stripTrailingSlash(configured), hostnameFromOrigin(origin))
    }

    return origin
  }

  if (configured && !isLocalOrigin(configured)) {
    return stripTrailingSlash(configured)
  }

  return TRACKER_PUBLIC_ORIGIN
}

export function resolveAuthSiteOrigin(configuredSiteUrl?: string | null, currentOrigin?: string | null) {
  return resolveCurrentOrigin(configuredSiteUrl, currentOrigin)
}

export function resolveAuthRedirectUrl(
  path: string,
  configuredSiteUrl?: string | null,
  currentOrigin?: string | null
) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${resolveAuthSiteOrigin(configuredSiteUrl, currentOrigin)}${normalizedPath}`
}

/** OAuth callback must stay on the same origin where sign-in started (PKCE verifier). */
export function resolveOAuthCallbackUrl(configuredSiteUrl?: string | null, currentOrigin?: string | null) {
  return `${resolveCurrentOrigin(configuredSiteUrl, currentOrigin)}/auth/callback`
}

export function useTrackerAuthRedirects() {
  const config = useRuntimeConfig()
  const configuredSiteUrl = String(config.public.siteUrl || '')

  return {
    siteOrigin: () => resolveAuthSiteOrigin(configuredSiteUrl),
    confirmUrl: () => resolveAuthRedirectUrl('/auth/confirm', configuredSiteUrl),
    resetPasswordUrl: () => resolveAuthRedirectUrl('/auth/reset-password', configuredSiteUrl),
    callbackUrl: () => resolveOAuthCallbackUrl(configuredSiteUrl)
  }
}
