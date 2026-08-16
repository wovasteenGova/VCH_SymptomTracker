/** Shared with VCH hub — localStorage on each origin + cookie on *.veteranscentralhub.us. */

export const VCH_COOKIE_CONSENT_STORAGE_KEY = 'cookieConsent'
export const VCH_COOKIE_CONSENT_COOKIE_NAME = 'vch_cookie_consent'
const VCH_COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function isVchProductionHost() {
  if (!import.meta.client) {
    return false
  }

  const host = window.location.hostname
  return host === 'veteranscentralhub.us' || host.endsWith('.veteranscentralhub.us')
}

function readConsentCookie(): boolean {
  if (!import.meta.client) {
    return false
  }

  return document.cookie
    .split(';')
    .some((entry) => entry.trim() === `${VCH_COOKIE_CONSENT_COOKIE_NAME}=true`)
}

export function hasVchCookieConsent(): boolean {
  if (!import.meta.client) {
    return true
  }

  if (localStorage.getItem(VCH_COOKIE_CONSENT_STORAGE_KEY) === 'true') {
    return true
  }

  return readConsentCookie()
}

export function acceptVchCookieConsent() {
  if (!import.meta.client) {
    return
  }

  localStorage.setItem(VCH_COOKIE_CONSENT_STORAGE_KEY, 'true')

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const domain = isVchProductionHost() ? '; domain=.veteranscentralhub.us' : ''
  document.cookie = `${VCH_COOKIE_CONSENT_COOKIE_NAME}=true; path=/; max-age=${VCH_COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}${domain}`
}
