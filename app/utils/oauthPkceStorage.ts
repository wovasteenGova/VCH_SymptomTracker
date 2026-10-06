import { resolveVchCookieDomain } from './vchHost'

/** Short-lived cookie so PKCE verifier survives email confirm and OAuth handoffs on VCH hosts. */
export const OAUTH_PKCE_VERIFIER_COOKIE = 'vch-oauth-pkce-verifier'
export const OAUTH_PKCE_VERIFIER_MAX_AGE_SECONDS = 15 * 60

export type OAuthPkceStorageAdapter = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function isOAuthCodeVerifierStorageKey(key: string) {
  return /code-verifier/i.test(key)
}

function readDocumentCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const prefix = `${name}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }

  return null
}

function writeDocumentCookie(
  name: string,
  value: string,
  options: { domain?: string, maxAge: number }
) {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const domain = options.domain ? `; Domain=${options.domain}` : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${options.maxAge}; SameSite=Lax${secure}${domain}`
}

export function clearOAuthPkceVerifierCookie(hostname?: string | null) {
  if (typeof document === 'undefined') return

  const host = hostname?.trim() || window.location.hostname
  const domain = resolveVchCookieDomain(host)
  writeDocumentCookie(OAUTH_PKCE_VERIFIER_COOKIE, '', { domain, maxAge: 0 })
}

export function createOAuthPkceStorage(
  baseStorage: OAuthPkceStorageAdapter,
  hostname?: string | null
): OAuthPkceStorageAdapter {
  const host = hostname?.trim()
    || (typeof window !== 'undefined' ? window.location.hostname : '')
  const domain = host ? resolveVchCookieDomain(host) : undefined

  return {
    getItem(key) {
      if (isOAuthCodeVerifierStorageKey(key)) {
        const fromCookie = readDocumentCookie(OAUTH_PKCE_VERIFIER_COOKIE)
        if (fromCookie) return fromCookie
      }

      return baseStorage.getItem(key)
    },
    setItem(key, value) {
      if (isOAuthCodeVerifierStorageKey(key)) {
        writeDocumentCookie(OAUTH_PKCE_VERIFIER_COOKIE, value, {
          domain,
          maxAge: OAUTH_PKCE_VERIFIER_MAX_AGE_SECONDS
        })
      }

      baseStorage.setItem(key, value)
    },
    removeItem(key) {
      if (isOAuthCodeVerifierStorageKey(key)) {
        clearOAuthPkceVerifierCookie(host)
      }

      baseStorage.removeItem(key)
    }
  }
}

export const oauthPkceBrowserStorage: OAuthPkceStorageAdapter = {
  getItem(key) {
    if (typeof window === 'undefined') return null
    return createOAuthPkceStorage(window.localStorage).getItem(key)
  },
  setItem(key, value) {
    if (typeof window === 'undefined') return
    createOAuthPkceStorage(window.localStorage).setItem(key, value)
  },
  removeItem(key) {
    if (typeof window === 'undefined') return
    createOAuthPkceStorage(window.localStorage).removeItem(key)
  }
}
