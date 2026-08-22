import type { H3Event } from 'h3'

import {
  getSupabaseConfigError,
  patchSupabaseRuntimeConfig,
  resolveSupabaseEnv
} from './supabaseEnv'

type SupabasePublicConfig = {
  supabaseUrl: string
  supabaseKey: string
  source: 'module' | 'runtime' | 'env' | 'missing'
}

export function getSupabasePublicConfig(event?: H3Event): SupabasePublicConfig {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  patchSupabaseRuntimeConfig(config.public as Parameters<typeof patchSupabaseRuntimeConfig>[0])

  const moduleConfig = config.public.supabase as { url?: string, key?: string } | undefined
  const moduleUrl = String(moduleConfig?.url || '').trim()
  const moduleKey = String(moduleConfig?.key || '').trim()
  const runtimeUrl = String(config.public.supabaseUrl || '').trim()
  const runtimeKey = String(
    config.public.supabaseAnonKey || config.public.supabasePublishableKey || config.public.supabaseKey || ''
  ).trim()
  const envConfig = resolveSupabaseEnv()

  if (moduleUrl && moduleKey) {
    return {
      supabaseUrl: moduleUrl,
      supabaseKey: moduleKey,
      source: 'module'
    }
  }

  if (runtimeUrl && runtimeKey) {
    return {
      supabaseUrl: runtimeUrl,
      supabaseKey: runtimeKey,
      source: 'runtime'
    }
  }

  if (envConfig.url && envConfig.anonKey) {
    return {
      supabaseUrl: envConfig.url,
      supabaseKey: envConfig.anonKey,
      source: 'env'
    }
  }

  return {
    supabaseUrl: moduleUrl || runtimeUrl || envConfig.url,
    supabaseKey: moduleKey || runtimeKey || envConfig.anonKey,
    source: 'missing'
  }
}

export function assertSupabasePublicConfig(event?: H3Event) {
  const resolved = getSupabasePublicConfig(event)
  const configError = getSupabaseConfigError({
    url: resolved.supabaseUrl,
    anonKey: resolved.supabaseKey,
    serviceKey: ''
  })

  if (configError) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: configError
    })
  }

  return resolved
}
