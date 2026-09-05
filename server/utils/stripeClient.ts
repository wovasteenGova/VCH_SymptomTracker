import Stripe from 'stripe'
import { getHeader, getRequestHost, getRequestProtocol } from 'h3'
import {
  VCH_TRACKER_ORIGIN_COM,
  resolveVchPublicTld,
  rewriteVchUrlToCurrentTld
} from '../../app/utils/vchHost'

const PREVIEW_HOST_SUFFIXES = ['.onrender.com', '.netlify.app', '.netlify.com'] as const

/**
 * Use the API version bundled with the installed `stripe` SDK.
 * Do not pin a stale version such as 2023-10-16.
 */
export const TRACKER_STRIPE_API_VERSION = (Stripe as unknown as { API_VERSION?: string }).API_VERSION || null

export function getStripeClient() {
  const config = useRuntimeConfig()

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      message: 'Stripe secret key is not configured.'
    })
  }

  // Instance client (never set a global stripe.api_key). Use the API version
  // bundled with the installed SDK (currently 2026-08-26.dahlia on stripe@22).
  return new Stripe(config.stripeSecretKey, {
    apiVersion: Stripe.API_VERSION
  })
}

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

export function isLocalCheckoutHost(hostname: string) {
  const host = String(hostname || '').trim().toLowerCase().replace(/:\d+$/, '')
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

export function isAllowedCheckoutOrigin(origin: string | null | undefined) {
  const normalized = normalizeOrigin(origin)

  if (!normalized) {
    return false
  }

  try {
    const url = new URL(normalized)
    const hostname = url.hostname.toLowerCase()
    const local = isLocalCheckoutHost(hostname)

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

    if (origin && isAllowedCheckoutOrigin(origin)) {
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

  if (rewrittenConfigured && isAllowedCheckoutOrigin(rewrittenConfigured)) {
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
