import { getSupabaseConfigError, resolveSupabaseEnv } from '../utils/supabaseEnv'
import { getSupabasePublicConfig } from '../utils/supabasePublicConfig'
import { describeServiceRoleKey, inspectSupabaseKey } from '../utils/supabaseKeyInspect'
import { isStripePriceId } from '../utils/subscriptionCheckoutSession'

export default defineEventHandler(() => {
  const isProduction = process.env.NODE_ENV === 'production'
  const resolved = getSupabasePublicConfig()
  const env = resolveSupabaseEnv()
  const config = useRuntimeConfig()
  const configError = getSupabaseConfigError({
    url: resolved.supabaseUrl || env.url,
    anonKey: resolved.supabaseKey || env.anonKey,
    serviceKey: env.serviceKey
  })

  const stripeConfigured = Boolean(
    config.stripeSecretKey && config.public.stripePublishableKey
  )
  const rawProPriceId = String(config.stripeProPriceId || '').trim()
  const hasValidProPriceId = isStripePriceId(rawProPriceId)
  const checkoutReady = Boolean(
    stripeConfigured
    && config.stripeWebhookSecret
    && hasValidProPriceId
    && env.serviceKey
  )
  const serviceKeyCheck = describeServiceRoleKey(env.serviceKey, env.anonKey)
  const serviceKeyRole = inspectSupabaseKey(env.serviceKey).role

  if (isProduction) {
    return {
      ok: !configError && stripeConfigured && checkoutReady && serviceKeyCheck.ok,
      hasServiceKey: Boolean(env.serviceKey),
      serviceKeyRole,
      serviceKeyValid: serviceKeyCheck.ok,
      serviceKeyIssue: serviceKeyCheck.ok ? null : serviceKeyCheck.reason
    }
  }

  return {
    ok: !configError && stripeConfigured,
    supabase: Boolean(resolved.supabaseUrl && resolved.supabaseKey),
    stripe: stripeConfigured,
    checkoutReady,
    checkout: {
      hasWebhookSecret: Boolean(config.stripeWebhookSecret),
      hasProPriceId: hasValidProPriceId,
      hasConfiguredProPriceValue: Boolean(rawProPriceId),
      proPriceIdValid: hasValidProPriceId,
      proPriceIdPreview: rawProPriceId ? `${rawProPriceId.slice(0, 12)}...` : null,
      hasServiceKey: Boolean(env.serviceKey),
      siteUrl: config.public.siteUrl || null
    },
    message: configError
      || (checkoutReady ? 'Checkout ready' : 'Stripe keys set; add webhook secret + valid STRIPE_PRO_PRICE_ID + service key for Pro unlock')
  }
})
