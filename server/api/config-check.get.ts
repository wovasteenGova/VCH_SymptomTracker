import { getSupabasePublicConfig } from '../utils/supabasePublicConfig'
import { inspectSupabaseKey, previewSupabaseKey } from '../utils/supabaseKeyInspect'
import { getSupabaseConfigError, resolveSupabaseEnv } from '../utils/supabaseEnv'
import { getReminderCronSecret, getVapidPrivateKey, getVapidPublicKey } from '../utils/pushReminderAuth'
import { isStripePriceId } from '../utils/subscriptionCheckoutSession'

function extractSupabaseProjectRef(url: string) {
  const match = String(url || '').match(/https:\/\/([^.]+)\.supabase\.co/)
  return match?.[1] || null
}

export default defineEventHandler(() => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      message: 'Not found.'
    })
  }

  const config = useRuntimeConfig()
  const moduleConfig = config.public.supabase as { url?: string, key?: string } | undefined
  const resolved = getSupabasePublicConfig()
  const envConfig = resolveSupabaseEnv()
  const moduleUrl = String(moduleConfig?.url || '').trim()
  const moduleKey = String(moduleConfig?.key || '').trim()
  const runtimeUrl = String(config.public.supabaseUrl || '').trim()
  const runtimeKey = String(
    config.public.supabaseAnonKey || config.public.supabasePublishableKey || ''
  ).trim()
  const resolvedKeyInfo = inspectSupabaseKey(resolved.supabaseKey)
  const serviceKey = String(config.supabaseServiceRoleKey || config.supabaseServiceKey || '').trim()
  const serviceKeyInfo = inspectSupabaseKey(serviceKey)
  const anonKeyLooksLikeServiceRole = resolvedKeyInfo.role === 'service_role'
  const anonKeySameAsServiceKey = Boolean(
    resolved.supabaseKey && serviceKey && resolved.supabaseKey === serviceKey
  )
  const rawProPriceId = String(config.stripeProPriceId || '').trim()
  const hasValidProPriceId = isStripePriceId(rawProPriceId)

  return {
    configured: Boolean(resolved.supabaseUrl && resolved.supabaseKey),
    configError: getSupabaseConfigError({
      url: resolved.supabaseUrl || envConfig.url,
      anonKey: resolved.supabaseKey || envConfig.anonKey,
      serviceKey: serviceKey
    }),
    supabaseProjectRef: extractSupabaseProjectRef(resolved.supabaseUrl),
    expectedSupabaseProjectRef: 'bszlmqdqrwqocoxbzpyh',
    supabaseMatchesVch: extractSupabaseProjectRef(resolved.supabaseUrl) === 'bszlmqdqrwqocoxbzpyh',
    supabaseKeySource: resolved.source,
    moduleKeyMatchesRuntimeKey: Boolean(moduleKey && runtimeKey && moduleKey === runtimeKey),
    hasModuleSupabaseUrl: Boolean(moduleUrl),
    hasModuleSupabaseKey: Boolean(moduleKey),
    hasRuntimeSupabaseUrl: Boolean(runtimeUrl),
    hasRuntimeSupabaseAnonKey: Boolean(runtimeKey),
    moduleKeyPreview: previewSupabaseKey(moduleKey),
    runtimeKeyPreview: previewSupabaseKey(runtimeKey),
    resolvedKeyPreview: previewSupabaseKey(resolved.supabaseKey),
    resolvedKeyFormat: resolvedKeyInfo.format,
    resolvedKeyRole: resolvedKeyInfo.role,
    anonKeyLooksLikeServiceRole,
    anonKeySameAsServiceKey,
    serviceKeyPreview: previewSupabaseKey(serviceKey),
    serviceKeyRole: serviceKeyInfo.role,
    hasSupabaseServiceKey: Boolean(serviceKey),
    stripe: {
      hasSecretKey: Boolean(config.stripeSecretKey),
      hasPublishableKey: Boolean(config.public.stripePublishableKey),
      hasWebhookSecret: Boolean(config.stripeWebhookSecret),
      hasProPriceId: hasValidProPriceId,
      hasConfiguredProPriceValue: Boolean(rawProPriceId),
      proPriceIdValid: hasValidProPriceId,
      proPriceIdPreview: rawProPriceId ? `${rawProPriceId.slice(0, 12)}...` : null,
      isTestMode: config.stripeSecretKey?.startsWith('sk_test_') ?? false
    },
    reminders: {
      hasVapidPublicKey: Boolean(getVapidPublicKey()),
      hasVapidPrivateKey: Boolean(getVapidPrivateKey()),
      hasReminderCronSecret: Boolean(getReminderCronSecret())
    },
    environment: process.env.NODE_ENV || 'development',
    fixHint: anonKeyLooksLikeServiceRole || anonKeySameAsServiceKey
      ? 'SUPABASE_ANON_KEY is set to the service_role key. Copy the anon/publishable key from VCH .env (starts with sb_publishable_ or legacy anon JWT), not SUPABASE_SERVICE_KEY.'
      : 'Copy SUPABASE_URL and SUPABASE_ANON_KEY from VCH .env into Symptom_tracker/.env, then restart dev server.'
  }
})
