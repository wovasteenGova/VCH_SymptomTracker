import { isStripePriceId } from '../../utils/subscriptionCheckoutSession'

export default defineEventHandler(() => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      message: 'Not found.'
    })
  }

  const config = useRuntimeConfig()
  const rawProPriceId = String(config.stripeProPriceId || '').trim()
  const hasValidProPriceId = isStripePriceId(rawProPriceId)

  return {
    hasSecretKey: Boolean(config.stripeSecretKey),
    hasPublishableKey: Boolean(config.public.stripePublishableKey),
    hasWebhookSecret: Boolean(config.stripeWebhookSecret),
    hasProPriceId: hasValidProPriceId,
    hasConfiguredProPriceValue: Boolean(rawProPriceId),
    proPriceIdValid: hasValidProPriceId,
    proPriceIdPreview: rawProPriceId ? `${rawProPriceId.slice(0, 12)}...` : null,
    hasSupabaseServiceRoleKey: Boolean(config.supabaseServiceRoleKey || config.supabaseServiceKey),
    secretKeyPreview: config.stripeSecretKey ? `${config.stripeSecretKey.slice(0, 12)}...` : null,
    publishableKeyPreview: config.public.stripePublishableKey
      ? `${config.public.stripePublishableKey.slice(0, 12)}...`
      : null,
    isTestMode: config.stripeSecretKey?.startsWith('sk_test_') ?? false,
    publishableIsTestMode: config.public.stripePublishableKey?.startsWith('pk_test_') ?? false,
    keysMatchMode: Boolean(
      config.stripeSecretKey
      && config.public.stripePublishableKey
      && config.stripeSecretKey.startsWith('sk_test_') === config.public.stripePublishableKey.startsWith('pk_test_')
    ),
    productKey: 'symptom_tracker_pro',
    proActivationReady: Boolean(config.stripeSecretKey && (config.supabaseServiceRoleKey || config.supabaseServiceKey)),
    webhookPath: '/api/stripe/webhook',
    webhookUrl: 'https://tracker.veteranscentralhub.us/api/stripe/webhook',
    environment: process.env.NODE_ENV || 'development'
  }
})
