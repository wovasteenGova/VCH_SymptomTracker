import { describe, expect, it } from 'vitest'
import {
  applyVchCookieDomain,
  isVchProductionHost,
  resolveVchClaimBuilderUrl,
  resolveVchCookieDomain,
  resolveVchHubPath,
  resolveVchHubUrl,
  resolveVchPublicTld,
  resolveVchTrackerUrl,
  rewriteSetCookieDomain,
  rewriteVchUrlToCurrentTld
} from '../app/utils/vchHost'
import { resolveAuthSiteOrigin, resolveOAuthCallbackUrl } from '../app/utils/authRedirects'
import { resolveRequestBaseUrl } from '../server/utils/stripeClient'
import { resolveTrackerPublicOrigin } from '../app/utils/reportBranding'
import { buildClaimBuilderUrl } from '../app/utils/claimBuilderLinks'
import { readFileSync } from 'node:fs'

describe('resolveVchCookieDomain', () => {
  it('uses the .com parent domain on veteranscentralhub.com hosts', () => {
    expect(resolveVchCookieDomain('tracker.veteranscentralhub.com')).toBe('.veteranscentralhub.com')
    expect(resolveVchCookieDomain('veteranscentralhub.com')).toBe('.veteranscentralhub.com')
    expect(resolveVchCookieDomain('TRACKER.VeteransCentralHub.COM')).toBe('.veteranscentralhub.com')
  })

  it('uses the .us parent domain on veteranscentralhub.us hosts', () => {
    expect(resolveVchCookieDomain('tracker.veteranscentralhub.us')).toBe('.veteranscentralhub.us')
    expect(resolveVchCookieDomain('veteranscentralhub.us')).toBe('.veteranscentralhub.us')
    expect(resolveVchCookieDomain('claimbuilder.veteranscentralhub.us')).toBe('.veteranscentralhub.us')
  })

  it('stays host-only off production VCH hosts', () => {
    expect(resolveVchCookieDomain('localhost')).toBeUndefined()
    expect(resolveVchCookieDomain('127.0.0.1')).toBeUndefined()
    expect(resolveVchCookieDomain('tracker.example.com')).toBeUndefined()
    expect(resolveVchCookieDomain('')).toBeUndefined()
    expect(resolveVchCookieDomain(null)).toBeUndefined()
  })

  it('never returns a .us domain for a .com host', () => {
    expect(resolveVchCookieDomain('tracker.veteranscentralhub.com')).not.toBe('.veteranscentralhub.us')
  })
})

describe('rewriteSetCookieDomain', () => {
  it('rewrites a baked .us Supabase cookie when the request is on .com', () => {
    const header = 'sb-auth-token=abc; Path=/; Domain=.veteranscentralhub.us; SameSite=Lax'
    expect(rewriteSetCookieDomain(header, 'tracker.veteranscentralhub.com'))
      .toBe('sb-auth-token=abc; Path=/; SameSite=Lax; Domain=.veteranscentralhub.com')
  })

  it('leaves unrelated cookies untouched', () => {
    const header = 'session=1; Path=/; Domain=.example.com'
    expect(rewriteSetCookieDomain(header, 'tracker.veteranscentralhub.com')).toBe(header)
  })
})

describe('applyVchCookieDomain', () => {
  it('sets or clears Domain on cookie options from the current host', () => {
    const comOptions = { secure: true, sameSite: 'lax' as const }
    applyVchCookieDomain(comOptions, 'tracker.veteranscentralhub.com')
    expect(comOptions.domain).toBe('.veteranscentralhub.com')

    const localOptions = { domain: '.veteranscentralhub.us', secure: true }
    applyVchCookieDomain(localOptions, 'localhost')
    expect(localOptions.domain).toBeUndefined()
  })
})

describe('VCH public URL TLD rewrite', () => {
  it('keeps hub, tracker, and ClaimBuilder on the current TLD', () => {
    expect(resolveVchHubUrl('tracker.veteranscentralhub.com')).toBe('https://www.veteranscentralhub.com')
    expect(resolveVchHubUrl('tracker.veteranscentralhub.us')).toBe('https://www.veteranscentralhub.us')
    expect(resolveVchTrackerUrl('tracker.veteranscentralhub.com')).toBe('https://tracker.veteranscentralhub.com')
    expect(resolveVchClaimBuilderUrl('https://claimbuilder.veteranscentralhub.us/', 'tracker.veteranscentralhub.com'))
      .toBe('https://claimbuilder.veteranscentralhub.com')
    expect(resolveVchHubPath('/privacy', 'tracker.veteranscentralhub.com'))
      .toBe('https://www.veteranscentralhub.com/privacy')
    expect(resolveVchHubPath('contact', 'claimbuilder.veteranscentralhub.us'))
      .toBe('https://www.veteranscentralhub.us/contact')
  })

  it('defaults to .com when no current host is available', () => {
    expect(resolveVchHubUrl()).toBe('https://www.veteranscentralhub.com')
    expect(resolveVchHubUrl('')).toBe('https://www.veteranscentralhub.com')
    expect(resolveVchHubUrl('localhost')).toBe('https://www.veteranscentralhub.com')
    expect(resolveVchTrackerUrl()).toBe('https://tracker.veteranscentralhub.com')
    expect(resolveVchTrackerUrl('localhost')).toBe('https://tracker.veteranscentralhub.com')
    expect(resolveVchClaimBuilderUrl()).toBe('https://claimbuilder.veteranscentralhub.com')
    expect(resolveVchClaimBuilderUrl(null, '127.0.0.1')).toBe('https://claimbuilder.veteranscentralhub.com')
    expect(resolveVchHubPath('/privacy')).toBe('https://www.veteranscentralhub.com/privacy')
  })

  it('rewrites configured .us URLs when the page is on .com', () => {
    expect(rewriteVchUrlToCurrentTld('https://veteranscentralhub.us/cookies', 'tracker.veteranscentralhub.com'))
      .toBe('https://veteranscentralhub.com/cookies')
    expect(rewriteVchUrlToCurrentTld('https://tracker.veteranscentralhub.us/', 'veteranscentralhub.com'))
      .toBe('https://tracker.veteranscentralhub.com/')
    expect(rewriteVchUrlToCurrentTld('https://claimbuilder.veteranscentralhub.com', 'tracker.veteranscentralhub.us'))
      .toBe('https://claimbuilder.veteranscentralhub.us')
  })

  it('leaves localhost and unknown hosts on the configured URL', () => {
    expect(rewriteVchUrlToCurrentTld('https://veteranscentralhub.us', 'localhost'))
      .toBe('https://veteranscentralhub.us')
    expect(resolveVchPublicTld('localhost')).toBeNull()
    expect(isVchProductionHost('tracker.veteranscentralhub.com')).toBe(true)
    expect(isVchProductionHost('localhost')).toBe(false)
  })

  it('builds ClaimBuilder links on the current TLD', () => {
    expect(buildClaimBuilderUrl({
      claimBuilderUrl: 'https://claimbuilder.veteranscentralhub.us/',
      hostname: 'tracker.veteranscentralhub.com'
    })).toBe('https://claimbuilder.veteranscentralhub.com')
  })
})

describe('auth and checkout origins stay on the opened host', () => {
  it('prefers the current non-local origin over a configured .us siteUrl', () => {
    expect(resolveAuthSiteOrigin(
      'https://tracker.veteranscentralhub.us',
      'https://tracker.veteranscentralhub.com'
    )).toBe('https://tracker.veteranscentralhub.com')

    expect(resolveOAuthCallbackUrl(
      'https://tracker.veteranscentralhub.us',
      'https://tracker.veteranscentralhub.com'
    )).toBe('https://tracker.veteranscentralhub.com/auth/callback')
  })

  it('never omits an OAuth callback URL', () => {
    expect(resolveOAuthCallbackUrl('https://tracker.veteranscentralhub.com', ''))
      .toBe('https://tracker.veteranscentralhub.com/auth/callback')
    expect(resolveOAuthCallbackUrl('', 'https://tracker.veteranscentralhub.com'))
      .toBe('https://tracker.veteranscentralhub.com/auth/callback')
    expect(resolveOAuthCallbackUrl('', '')).toBe('https://tracker.veteranscentralhub.com/auth/callback')
  })

  it('rewrites tracker public origin to the current TLD', () => {
    expect(resolveTrackerPublicOrigin(
      'https://tracker.veteranscentralhub.us',
      'tracker.veteranscentralhub.com'
    )).toBe('https://tracker.veteranscentralhub.com')
  })

  it('uses the request origin for Stripe return URLs instead of APP_URL', () => {
    expect(resolveRequestBaseUrl({
      configuredOrigin: 'https://tracker.veteranscentralhub.us',
      isProduction: true,
      originHeader: 'https://tracker.veteranscentralhub.com',
      requestHost: 'tracker.veteranscentralhub.com',
      requestProtocol: 'https'
    })).toBe('https://tracker.veteranscentralhub.com')
  })
})

describe('baked production cookie domain', () => {
  it('does not hardcode Domain=.veteranscentralhub.us in nuxt.config', () => {
    const config = readFileSync('nuxt.config.ts', 'utf8')
    expect(config).not.toMatch(/domain:\s*['"]\.veteranscentralhub\.us['"]/)
    expect(config).toContain('./nuxt-modules/vch-host')
  })

  it('uses .com production fallbacks instead of .us', () => {
    const config = readFileSync('nuxt.config.ts', 'utf8')
    const render = readFileSync('render.yaml', 'utf8')
    const cron = readFileSync('scripts/reminder-cron.mjs', 'utf8')
    const netlifyCron = readFileSync('netlify/functions/reminder-cron.mjs', 'utf8')
    const cronEnv = readFileSync('.local/render-cron.env.example', 'utf8')
    const subscription = readFileSync('app/utils/subscription.ts', 'utf8')

    expect(config).toContain('https://tracker.veteranscentralhub.com')
    expect(config).toContain('https://claimbuilder.veteranscentralhub.com')
    expect(config).not.toContain('https://tracker.veteranscentralhub.us')
    expect(config).not.toContain('https://claimbuilder.veteranscentralhub.us')
    expect(render).toContain('https://tracker.veteranscentralhub.com')
    expect(render).not.toContain('veteranscentralhub.us')
    expect(cron).toContain('https://tracker.veteranscentralhub.com')
    expect(cron).not.toContain('veteranscentralhub.us')
    expect(netlifyCron).toContain('https://tracker.veteranscentralhub.com')
    expect(netlifyCron).not.toContain('veteranscentralhub.us')
    expect(cronEnv).toContain('APP_URL=https://tracker.veteranscentralhub.com')
    expect(cronEnv).not.toContain('veteranscentralhub.us')
    expect(subscription).toContain("VCH_HUB_URL = 'https://www.veteranscentralhub.com'")
    expect(subscription).toContain("VCH_CLAIMBUILDER_URL = 'https://claimbuilder.veteranscentralhub.com'")
    expect(subscription).not.toContain('veteranscentralhub.us')
  })

  it('always passes OAuth redirectTo from the current origin helper', () => {
    const auth = readFileSync('app/composables/useSupabaseAuth.ts', 'utf8')
    expect(auth).toContain('const redirectTo = authRedirects.callbackUrl()')
    expect(auth).toMatch(/signInWithOAuth\(\{[\s\S]*redirectTo/)
    expect(auth).not.toMatch(/redirectTo = import\.meta\.client\s*\n\s*\? authRedirects\.callbackUrl\(\)\s*\n\s*: undefined/)
  })
})
