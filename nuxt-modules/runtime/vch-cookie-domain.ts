import {
  applyVchCookieDomain,
  resolveCurrentHostname,
  resolveVchClaimBuilderUrl,
  rewriteVchUrlToCurrentTld
} from '../../app/utils/vchHost'

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
    const hostname = import.meta.client
      ? window.location.hostname
      : (() => {
          try {
            return useRequestURL().hostname
          } catch {
            return resolveCurrentHostname()
          }
        })()

    // Only mutate public runtime config in the browser. Shared server config
    // would leak the last request's TLD across concurrent .com and .us hits.
    if (!import.meta.client) {
      return
    }

    const config = useRuntimeConfig()
    const supabase = (config.public as { supabase?: SupabasePublicConfig }).supabase

    if (supabase) {
      if (!supabase.cookieOptions) {
        supabase.cookieOptions = {}
      }

      applyVchCookieDomain(supabase.cookieOptions, hostname)
    }

    const publicConfig = config.public as {
      siteUrl?: string
      claimBuilderUrl?: string
    }

    if (publicConfig.siteUrl) {
      publicConfig.siteUrl = rewriteVchUrlToCurrentTld(publicConfig.siteUrl, hostname)
    }

    if (publicConfig.claimBuilderUrl) {
      publicConfig.claimBuilderUrl = resolveVchClaimBuilderUrl(publicConfig.claimBuilderUrl, hostname)
    }
  }
})
