import Stripe from 'stripe'
import { readBody } from 'h3'
import { PRO_PRODUCT_KEY } from '../../../app/utils/subscription'
import { requireAuthUser } from '../../utils/authUser'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'
import { getRequestBaseUrl, getStripeClient } from '../../utils/stripeClient'
import {
  buildSubscriptionCheckoutParams,
  isStripePriceId,
  resolveSubscriptionLineItems
} from '../../utils/subscriptionCheckoutSession'

function logCheckoutError(step: string, details: Record<string, unknown> = {}) {
  console.error(`[stripe checkout] ${step}`, details)
}

export default defineEventHandler(async (event) => {
  const requestId = crypto.randomUUID()
  const config = useRuntimeConfig()
  const body = await readBody<{ embedded?: boolean }>(event).catch(() => ({}))
  const embedded = body?.embedded === true

  if (!config.stripeSecretKey) {
    logCheckoutError('missing stripe secret key', { requestId })
    throw createError({
      statusCode: 500,
      message: 'Stripe secret key is not configured.'
    })
  }

  const publishableKey = String(config.public.stripePublishableKey || '').trim()
  const secretIsTest = config.stripeSecretKey.startsWith('sk_test_')
  const secretIsLive = config.stripeSecretKey.startsWith('sk_live_')
  const publishableIsTest = publishableKey.startsWith('pk_test_')
  const publishableIsLive = publishableKey.startsWith('pk_live_')

  if (publishableKey && secretIsTest !== publishableIsTest) {
    logCheckoutError('stripe key mode mismatch', { requestId, secretIsTest, publishableIsTest })
    throw createError({
      statusCode: 500,
      message: 'Stripe secret and publishable keys must both be test or both be live.'
    })
  }

  if (process.env.NODE_ENV === 'production' && (!secretIsLive || (publishableKey && !publishableIsLive))) {
    logCheckoutError('production requires live stripe keys', { requestId })
    throw createError({
      statusCode: 500,
      message: 'Production checkout requires live Stripe keys.'
    })
  }

  let user

  try {
    const authResult = await requireAuthUser(event)
    user = authResult.user
  } catch (error) {
    logCheckoutError('auth failed', {
      requestId,
      message: error instanceof Error ? error.message : String(error)
    })
    throw error
  }

  const stripe = getStripeClient()
  const baseUrl = getRequestBaseUrl(event)
  const rawConfiguredPriceId = String(config.stripeProPriceId || '').trim()
  const configuredPriceId = isStripePriceId(rawConfiguredPriceId) ? rawConfiguredPriceId : ''

  try {
    const lineItems = await resolveSubscriptionLineItems(stripe, configuredPriceId)
    let existingCustomerId: string | null = null

    try {
      const supabase = getSupabaseAdmin()
      const { data: entitlement } = await supabase
        .from('user_entitlements')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .eq('product_key', PRO_PRODUCT_KEY)
        .maybeSingle()

      existingCustomerId = entitlement?.stripe_customer_id || null
    } catch (error) {
      logCheckoutError('existing customer lookup skipped', {
        requestId,
        message: error instanceof Error ? error.message : String(error)
      })
    }

    const checkoutParams = buildSubscriptionCheckoutParams({
      user,
      baseUrl,
      lineItems,
      embedded,
      existingCustomerId
    })
    const session = await stripe.checkout.sessions.create(checkoutParams)

    if (embedded) {
      if (!session.client_secret) {
        logCheckoutError('stripe returned no client secret', {
          requestId,
          sessionId: session.id
        })
        throw createError({
          statusCode: 500,
          message: 'Stripe did not return an embedded checkout secret.'
        })
      }

      return {
        clientSecret: session.client_secret,
        sessionId: session.id,
        returnUrl: typeof checkoutParams.return_url === 'string' ? checkoutParams.return_url : null
      }
    }

    if (!session.url) {
      logCheckoutError('stripe returned no checkout url', {
        requestId,
        sessionId: session.id
      })
      throw createError({
        statusCode: 500,
        message: 'Stripe did not return a checkout URL.'
      })
    }

    return { url: session.url, sessionId: session.id }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    if (error instanceof Stripe.errors.StripeError) {
      logCheckoutError('stripe api error', {
        requestId,
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode
      })

      throw createError({
        statusCode: error.statusCode || 500,
        message: `${error.message}${error.code ? ` (${error.code})` : ''}`
      })
    }

    const message = error instanceof Error ? error.message : 'Stripe checkout failed.'
    logCheckoutError('unexpected error', {
      requestId,
      message
    })

    throw createError({
      statusCode: 500,
      message
    })
  }
})
