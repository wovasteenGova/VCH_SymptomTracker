import { getSupabaseConfigError, resolveSupabaseEnv } from '../utils/supabaseEnv'
import { getSupabasePublicConfig } from '../utils/supabasePublicConfig'
import { describeServiceRoleKey, inspectSupabaseKey } from '../utils/supabaseKeyInspect'

export default defineEventHandler(() => {
  const isProduction = process.env.NODE_ENV === 'production'
  const resolved = getSupabasePublicConfig()
  const env = resolveSupabaseEnv()
  const configError = getSupabaseConfigError({
    url: resolved.supabaseUrl || env.url,
    anonKey: resolved.supabaseKey || env.anonKey,
    serviceKey: env.serviceKey
  })
  const serviceKeyCheck = describeServiceRoleKey(env.serviceKey, env.anonKey)
  const serviceKeyRole = inspectSupabaseKey(env.serviceKey).role
  const supabaseReady = Boolean(resolved.supabaseUrl && resolved.supabaseKey)

  if (isProduction) {
    return {
      ok: !configError && supabaseReady && serviceKeyCheck.ok,
      hasServiceKey: Boolean(env.serviceKey),
      serviceKeyRole,
      serviceKeyValid: serviceKeyCheck.ok,
      serviceKeyIssue: serviceKeyCheck.ok ? null : serviceKeyCheck.reason
    }
  }

  return {
    ok: !configError && supabaseReady,
    supabase: supabaseReady,
    hasServiceKey: Boolean(env.serviceKey),
    siteUrl: useRuntimeConfig().public.siteUrl || null,
    message: configError || (supabaseReady ? 'Supabase configured' : 'Set SUPABASE_URL and SUPABASE_ANON_KEY')
  }
})
