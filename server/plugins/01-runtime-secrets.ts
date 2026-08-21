/**
 * Fill private runtimeConfig from process.env at request time so build-time
 * env (Netlify/Render) does not inline secrets into the server bundle.
 */
function readEnv(...names: string[]) {
  for (const name of names) {
    const value = String(process.env[name] || '').trim()
    if (value) return value
  }
  return ''
}

function safeSet(target: Record<string, unknown>, key: string, value: string) {
  if (!value) return
  const current = String(target[key] || '').trim()
  if (current) return
  try {
    target[key] = value
  } catch {
    // Frozen prerender config — ignore.
  }
}

function forceSet(target: Record<string, unknown>, key: string, value: string) {
  if (!value) return
  try {
    target[key] = value
  } catch {
    // Frozen prerender config — ignore.
  }
}

function patchSecrets(config: Record<string, unknown>) {
  safeSet(config, 'stripeSecretKey', readEnv('STRIPE_SECRET_KEY', 'NUXT_STRIPE_SECRET_KEY'))
  safeSet(config, 'stripeWebhookSecret', readEnv('STRIPE_WEBHOOK_SECRET', 'NUXT_STRIPE_WEBHOOK_SECRET'))
  const serviceKey = readEnv(
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NUXT_SUPABASE_SERVICE_KEY',
    'NUXT_SUPABASE_SECRET_KEY'
  )
  // Always prefer live Render env over any stale build-time value in runtimeConfig.
  forceSet(config, 'supabaseServiceKey', serviceKey)
  forceSet(config, 'supabaseServiceRoleKey', serviceKey)
  safeSet(config, 'vapidPrivateKey', readEnv('VAPID_PRIVATE_KEY', 'NUXT_VAPID_PRIVATE_KEY'))
  safeSet(config, 'reminderCronSecret', readEnv('REMINDER_CRON_SECRET', 'NUXT_REMINDER_CRON_SECRET'))
}

export default defineNitroPlugin((nitroApp) => {
  patchSecrets(useRuntimeConfig() as Record<string, unknown>)

  nitroApp.hooks.hook('request', (event) => {
    patchSecrets(useRuntimeConfig(event) as Record<string, unknown>)
  })
})
