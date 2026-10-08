import { getHeader, getRequestHost, getRequestProtocol } from 'h3'
import {
  VCH_TRACKER_ORIGIN_COM,
  resolveVchPublicTld,
  rewriteVchUrlToCurrentTld
} from '../../app/utils/vchHost'

const PREVIEW_HOST_SUFFIXES = ['.onrender.com', '.netlify.app', '.netlify.com'] as const

export function normalizeOrigin(value: string | null | undefined) {
  const trimmed = String(value || '').trim()

  if (!trimmed) {
    return ''
  }

  try {
    return new URL(trimmed).origin
  } catch {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/$/, '')
    }

    return ''
  }
}

export function isLocalRequestHost(hostname: string) {
  const host = String(hostname || '').trim().toLowerCase().replace(/:\d+$/, '')
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

export function isAllowedPublicOrigin(origin: string | null | undefined) {
  const normalized = normalizeOrigin(origin)

  if (!normalized) {
    return false
  }

  try {
    const url = new URL(normalized)
    const hostname = url.hostname.toLowerCase()
    const local = isLocalRequestHost(hostname)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    if (url.protocol === 'http:' && !local) {
      return false
    }

    if (local) {
      return true
    }

    if (resolveVchPublicTld(hostname)) {
      return true
    }

    return PREVIEW_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  } catch {
    return false
  }
}

function firstAllowedOrigin(candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const origin = normalizeOrigin(candidate)

    if (origin && isAllowedPublicOrigin(origin)) {
      return origin.replace(/\/$/, '')
    }
  }

  return ''
}

export function resolveRequestBaseUrl(input: {
  configuredOrigin?: string | null
  isProduction?: boolean
  originHeader?: string | null
  referer?: string | null
  requestHost?: string | null
  requestProtocol?: string | null
}) {
  let refererOrigin = ''

  try {
    refererOrigin = input.referer ? new URL(String(input.referer).trim()).origin : ''
  } catch {
    refererOrigin = ''
  }

  const requestProtocol = String(input.requestProtocol || '').trim()
  const requestHost = String(input.requestHost || '').trim()
  const requestOrigin = requestProtocol && requestHost ? `${requestProtocol}://${requestHost}` : ''
  const configuredOrigin = String(input.configuredOrigin || '').trim().replace(/\/$/, '')
  const rewrittenConfigured = rewriteVchUrlToCurrentTld(configuredOrigin, requestHost)

  const allowed = firstAllowedOrigin([
    input.originHeader,
    refererOrigin,
    requestOrigin,
    rewrittenConfigured,
    configuredOrigin
  ])

  if (allowed) {
    return allowed
  }

  if (rewrittenConfigured && isAllowedPublicOrigin(rewrittenConfigured)) {
    return rewrittenConfigured
  }

  return VCH_TRACKER_ORIGIN_COM
}

export function getRequestBaseUrl(event: Parameters<typeof getRequestHost>[0]) {
  const config = useRuntimeConfig()
  const configuredOrigin = String(config.public.siteUrl || '').trim().replace(/\/$/, '')

  return resolveRequestBaseUrl({
    configuredOrigin,
    isProduction: process.env.NODE_ENV === 'production',
    originHeader: getHeader(event, 'origin'),
    referer: getHeader(event, 'referer'),
    requestHost: getRequestHost(event, { xForwardedHost: true }),
    requestProtocol: getRequestProtocol(event, { xForwardedProto: true })
  })
}
