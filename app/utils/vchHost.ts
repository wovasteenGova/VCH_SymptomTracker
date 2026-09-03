/** Shared VCH production apex hosts. One Render deploy serves both TLDs. */

export const VCH_APEX_US = 'veteranscentralhub.us'
export const VCH_APEX_COM = 'veteranscentralhub.com'

export const VCH_HUB_ORIGIN_US = `https://${VCH_APEX_US}`
export const VCH_HUB_ORIGIN_COM = `https://www.${VCH_APEX_COM}`
export const VCH_TRACKER_ORIGIN_US = `https://tracker.${VCH_APEX_US}`
export const VCH_TRACKER_ORIGIN_COM = `https://tracker.${VCH_APEX_COM}`
export const VCH_CLAIMBUILDER_ORIGIN_US = `https://claimbuilder.${VCH_APEX_US}`
export const VCH_CLAIMBUILDER_ORIGIN_COM = `https://claimbuilder.${VCH_APEX_COM}`

const APEX_BY_TLD = {
  com: VCH_APEX_COM,
  us: VCH_APEX_US
} as const

export type VchPublicTld = keyof typeof APEX_BY_TLD

export function normalizeHostname(hostname: string | null | undefined) {
  return String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/:\d+$/, '')
}

export function resolveVchPublicTld(hostname: string | null | undefined): VchPublicTld | null {
  const host = normalizeHostname(hostname)

  if (host === VCH_APEX_COM || host.endsWith(`.${VCH_APEX_COM}`)) {
    return 'com'
  }

  if (host === VCH_APEX_US || host.endsWith(`.${VCH_APEX_US}`)) {
    return 'us'
  }

  return null
}

/**
 * Parent-domain cookie for hub + tracker on the same TLD.
 * A .com page cannot set Domain=.veteranscentralhub.us — derive from the current host.
 */
export function resolveVchCookieDomain(hostname: string | null | undefined): string | undefined {
  const tld = resolveVchPublicTld(hostname)

  if (!tld) {
    return undefined
  }

  return `.${APEX_BY_TLD[tld]}`
}

export function isVchProductionHost(hostname: string | null | undefined) {
  return resolveVchPublicTld(hostname) !== null
}

export function rewriteVchUrlToCurrentTld(url: string, hostname?: string | null) {
  const trimmed = String(url || '').trim()
  const tld = resolveVchPublicTld(hostname)

  if (!trimmed || !tld) {
    return trimmed
  }

  const targetApex = APEX_BY_TLD[tld]
  const otherApex = tld === 'com' ? VCH_APEX_US : VCH_APEX_COM

  return trimmed.split(otherApex).join(targetApex)
}

export function resolveCurrentHostname(hostname?: string | null) {
  if (hostname) {
    return normalizeHostname(hostname)
  }

  if (import.meta.client) {
    return normalizeHostname(window.location.hostname)
  }

  return ''
}

export function resolveVchHubUrl(hostname?: string | null) {
  return rewriteVchUrlToCurrentTld(VCH_HUB_ORIGIN_COM, resolveCurrentHostname(hostname) || hostname)
}

export function resolveVchTrackerUrl(hostname?: string | null) {
  return rewriteVchUrlToCurrentTld(VCH_TRACKER_ORIGIN_COM, resolveCurrentHostname(hostname) || hostname)
}

export function resolveVchClaimBuilderUrl(configuredUrl?: string | null, hostname?: string | null) {
  const fallback = String(configuredUrl || '').trim() || VCH_CLAIMBUILDER_ORIGIN_COM
  return rewriteVchUrlToCurrentTld(fallback.replace(/\/$/, ''), resolveCurrentHostname(hostname) || hostname)
}

export function resolveVchHubPath(path: string, hostname?: string | null) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${resolveVchHubUrl(hostname)}${normalizedPath}`
}

export function applyVchCookieDomain<T extends { domain?: string }>(
  cookieOptions: T | null | undefined,
  hostname: string | null | undefined
): T | undefined {
  if (!cookieOptions) {
    return cookieOptions ?? undefined
  }

  const domain = resolveVchCookieDomain(hostname)

  if (domain) {
    cookieOptions.domain = domain
  } else {
    delete cookieOptions.domain
  }

  return cookieOptions
}

export function isSupabaseOrVchDomainCookie(header: string) {
  return /^(?:__host-|__secure-)?sb-/i.test(header)
    || /;\s*domain=\.veteranscentralhub\.(us|com)/i.test(header)
}

export function rewriteSetCookieDomain(header: string, hostname: string | null | undefined) {
  if (!isSupabaseOrVchDomainCookie(header)) {
    return header
  }

  const domain = resolveVchCookieDomain(hostname)
  const withoutDomain = header.replace(/;\s*domain=[^;]*/ig, '')

  if (!domain) {
    return withoutDomain
  }

  return `${withoutDomain}; Domain=${domain}`
}
