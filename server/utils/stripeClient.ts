import Stripe from 'stripe'
import { getHeader, getRequestHost, getRequestProtocol } from 'h3'
import { rewriteVchUrlToCurrentTld } from '../../app/utils/vchHost'

export function getStripeClient() {
  const config = useRuntimeConfig()

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      message: 'Stripe secret key is not configured.'
    })
  }

  return new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-10-16'
  })
}

export function resolveRequestBaseUrl(input: {
  configuredOrigin?: string | null
  isProduction?: boolean
  originHeader?: string | null
  referer?: string | null
  requestHost?: string | null
  requestProtocol?: string | null
}) {
  const originHeader = String(input.originHeader || '').trim()

  if (originHeader && /^https?:\/\//i.test(originHeader)) {
    return originHeader.replace(/\/$/, '')
  }

  const referer = String(input.referer || '').trim()

  if (referer) {
    try {
      return new URL(referer).origin
    } catch {
      // Ignore malformed referer values.
    }
  }

  const requestProtocol = String(input.requestProtocol || '').trim()
  const requestHost = String(input.requestHost || '').trim()
  const requestOrigin = requestProtocol && requestHost ? `${requestProtocol}://${requestHost}` : ''

  if (requestOrigin) {
    return requestOrigin.replace(/\/$/, '')
  }

  const configuredOrigin = String(input.configuredOrigin || '').trim().replace(/\/$/, '')

  if (configuredOrigin) {
    return rewriteVchUrlToCurrentTld(configuredOrigin, requestHost)
  }

  return 'http://localhost:3001'
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
