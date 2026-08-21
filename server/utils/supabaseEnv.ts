type SupabaseEnv = {
  url: string
  anonKey: string
  serviceKey: string
}

function readEnv(name: string) {
  return String(process.env[name] || '').trim()
}

/** Resolve Supabase URL + anon key from every supported env alias (local, Netlify, Nuxt runtime). */
export function resolveSupabaseEnv(): SupabaseEnv {
  const url = readEnv('SUPABASE_URL')
    || readEnv('NUXT_PUBLIC_SUPABASE_URL')
    || readEnv('NUXT_SUPABASE_URL')

  const anonKey = readEnv('SUPABASE_ANON_KEY')
    || readEnv('SUPABASE_KEY')
    || readEnv('NUXT_PUBLIC_SUPABASE_ANON_KEY')
    || readEnv('NUXT_PUBLIC_SUPABASE_KEY')
    || readEnv('NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    || readEnv('NUXT_SUPABASE_KEY')

  const serviceKey = readEnv('SUPABASE_SERVICE_KEY')
    || readEnv('SUPABASE_SERVICE_ROLE_KEY')
    || readEnv('NUXT_SUPABASE_SERVICE_KEY')
    || readEnv('NUXT_SUPABASE_SECRET_KEY')

  return { url, anonKey, serviceKey }
}

export function isSupabaseEnvConfigured(env: SupabaseEnv = resolveSupabaseEnv()) {
  return Boolean(env.url && env.anonKey)
}

export function getSupabaseConfigError(env: SupabaseEnv = resolveSupabaseEnv()) {
  if (isSupabaseEnvConfigured(env)) {
    return null
  }

  const missing: string[] = []
  if (!env.url) {
    missing.push('SUPABASE_URL')
  }
  if (!env.anonKey) {
    missing.push('SUPABASE_ANON_KEY')
  }

  return `Missing ${missing.join(' and ')}. Add them in Render/Netlify → Environment variables, then redeploy. Use the anon/publishable key — not the service role key.`
}

type RuntimePublicConfig = {
  supabase?: {
    url?: string
    key?: string
  }
  supabaseUrl?: string
  supabaseAnonKey?: string
  supabasePublishableKey?: string
  supabaseKey?: string
}

/** Fill @nuxtjs/supabase runtime config when build-time env was empty (common on Netlify). */
export function patchSupabaseRuntimeConfig(publicConfig: RuntimePublicConfig) {
  const env = resolveSupabaseEnv()

  if (!publicConfig.supabase) {
    publicConfig.supabase = {}
  }

  if (!publicConfig.supabase.url && env.url) {
    publicConfig.supabase.url = env.url
  }

  if (!publicConfig.supabase.key && env.anonKey) {
    publicConfig.supabase.key = env.anonKey
  }

  if (!publicConfig.supabaseUrl && env.url) {
    publicConfig.supabaseUrl = env.url
  }

  if (!publicConfig.supabaseAnonKey && env.anonKey) {
    publicConfig.supabaseAnonKey = env.anonKey
  }

  if (!publicConfig.supabasePublishableKey && env.anonKey) {
    publicConfig.supabasePublishableKey = env.anonKey
  }

  if (!publicConfig.supabaseKey && env.anonKey) {
    publicConfig.supabaseKey = env.anonKey
  }

  return env
}
