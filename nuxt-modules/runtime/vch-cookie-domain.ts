import { applyVchCookieDomain, resolveCurrentHostname } from '../../app/utils/vchHost'

type SupabasePublicConfig = {
  cookieOptions?: {
    domain?: string
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
  }
}

export default defineNuxtPlugin({
  name: 'vch-cookie-domain',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig()
    const hostname = import.meta.client
      ? window.location.hostname
      : (() => {
          try {
            return useRequestURL().hostname
          } catch {
            return resolveCurrentHostname()
          }
        })()

    const supabase = (config.public as { supabase?: SupabasePublicConfig }).supabase

    if (!supabase) {
      return
    }

    if (!supabase.cookieOptions) {
      supabase.cookieOptions = {}
    }

    applyVchCookieDomain(supabase.cookieOptions, hostname)
  }
})
