import { createClient } from '@supabase/supabase-js'
import { getSupabaseNodeOptions } from './supabaseNodeOptions'
import { resolveSupabaseEnv } from './supabaseEnv'
import { describeServiceRoleKey } from './supabaseKeyInspect'

const TRACKER_SCHEMA = 'tracker'

function getTrackerUrl() {
  const config = useRuntimeConfig()
  const env = resolveSupabaseEnv()
  return String(config.public.supabaseUrl || env.url || '').trim()
}

function getServiceRoleKey() {
  const env = resolveSupabaseEnv()
  if (env.serviceKey) {
    return env.serviceKey
  }

  const config = useRuntimeConfig()
  return String(config.supabaseServiceRoleKey || config.supabaseServiceKey || '').trim()
}

function getAnonKey() {
  const config = useRuntimeConfig()
  const env = resolveSupabaseEnv()
  return String(
    config.public.supabaseAnonKey
    || config.public.supabasePublishableKey
    || config.public.supabaseKey
    || env.anonKey
    || ''
  ).trim()
}

export function getSupabaseAdmin() {
  const supabaseUrl = getTrackerUrl()
  const serviceRoleKey = getServiceRoleKey()
  const check = describeServiceRoleKey(serviceRoleKey, getAnonKey())

  if (!supabaseUrl || !check.ok) {
    throw createError({
      statusCode: 500,
      message: check.reason === 'same_as_anon' || check.reason === 'anon_jwt'
        ? 'SUPABASE_SERVICE_KEY is the anon/publishable key. Paste the VCH service_role or sb_secret_ key from Supabase → API Keys, then redeploy.'
        : 'Supabase service role is not configured on the server.'
    })
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    ...getSupabaseNodeOptions(),
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: TRACKER_SCHEMA
    }
  })
}
