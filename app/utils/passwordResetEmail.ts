import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const PASSWORD_RESET_MAILER_STORAGE_KEY = 'vch-password-reset-mailer'

export function readImplicitAuthSessionFromHash(hash: string | null | undefined) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) {
    return null
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    type: params.get('type')
  }
}

export function createPasswordResetMailerClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: PASSWORD_RESET_MAILER_STORAGE_KEY
    }
  })
}

export async function sendPasswordResetEmail(options: {
  supabaseUrl: string
  supabaseAnonKey: string
  email: string
  redirectTo: string
}) {
  if (!options.supabaseUrl || !options.supabaseAnonKey) {
    throw new Error('Password reset is not configured.')
  }

  if (!options.redirectTo) {
    throw new Error('Password reset redirectTo is required')
  }

  const client = createPasswordResetMailerClient(options.supabaseUrl, options.supabaseAnonKey)
  const { error } = await client.auth.resetPasswordForEmail(options.email, {
    redirectTo: options.redirectTo
  })

  if (error) {
    throw error
  }
}

export async function applyImplicitAuthHashSession(
  supabase: Pick<SupabaseClient, 'auth'>,
  hash: string
) {
  const tokens = readImplicitAuthSessionFromHash(hash)

  if (!tokens) {
    return null
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  })

  if (error) {
    throw error
  }

  if (import.meta.client) {
    const url = new URL(window.location.href)
    url.hash = ''
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
  }

  return {
    session: data.session,
    type: tokens.type
  }
}
