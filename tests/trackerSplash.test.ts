import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  TRACKER_BRAND_LOGO_SRC,
  TRACKER_NUXT_SPA_LOADER_ID,
  TRACKER_SPA_SPLASH_SELECTOR,
  TRACKER_TANK_LOADER_SRC,
  shouldShowHomeVueSplash
} from '../app/utils/trackerSplash.ts'

const spaTemplate = readFileSync('app/spa-loading-template.html', 'utf8')
const config = readFileSync('nuxt.config.ts', 'utf8')
const indexPage = readFileSync('app/pages/index.vue', 'utf8')
const appPage = readFileSync('app/app.vue', 'utf8')
const splashPlugin = readFileSync('app/plugins/tracker-splash.client.ts', 'utf8')
const themePlugin = readFileSync('app/plugins/claim-color-theme.client.ts', 'utf8')
const cookieBanner = readFileSync('app/components/VchCookieConsentBanner.vue', 'utf8')
const authPage = readFileSync('app/pages/auth/index.vue', 'utf8')
const loaderPreview = readFileSync('app/pages/dev/loader.vue', 'utf8')
const tankSvg = readFileSync('public/vch-tank-loader.svg', 'utf8')
const reminderTip = readFileSync('app/components/MonthlyBackupReminderTip.vue', 'utf8')

describe('VCH tank spa loading template', () => {
  it('includes the tank SVG and VCH brand logo on first paint', () => {
    expect(spaTemplate).toContain(TRACKER_TANK_LOADER_SRC)
    expect(spaTemplate).toContain(TRACKER_BRAND_LOGO_SRC)
    expect(spaTemplate).toContain('VCH')
    expect(spaTemplate).not.toContain('Setting up workspace')
  })

  it('is wired from nuxt.config with tank preload', () => {
    expect(config).toContain("spaLoadingTemplate: 'spa-loading-template.html'")
    expect(config).toContain("spaLoadingTemplateLocation: 'body'")
    expect(config).toContain("href: '/vch-tank-loader.svg'")
    expect(config).toContain("rel: 'preload'")
    expect(config).toContain("'/': { ssr: false }")
  })
})

describe('home bootstrap does not replay the tank', () => {
  it('skips a second fullscreen Vue loader on the initial SPA load', () => {
    expect(shouldShowHomeVueSplash({
      isEmbeddedPreview: false,
      htmlSplashAlreadyPlayed: true
    })).toBe(false)
    expect(indexPage).toContain('shouldShowHomeVueSplash')
    expect(indexPage).toContain('htmlSplashAlreadyPlayed: true')
    expect(indexPage).toContain('v-if="showHomeBootstrapLoader"')
  })

  it('still skips the home splash in the embedded preview', () => {
    expect(shouldShowHomeVueSplash({
      isEmbeddedPreview: true,
      htmlSplashAlreadyPlayed: false
    })).toBe(false)
  })

  it('does not retrigger the splash when theme or cookies hydrate', () => {
    expect(shouldShowHomeVueSplash({
      isEmbeddedPreview: false,
      htmlSplashAlreadyPlayed: true,
      themeHydrating: true
    })).toBe(false)
    expect(shouldShowHomeVueSplash({
      isEmbeddedPreview: false,
      htmlSplashAlreadyPlayed: false,
      themeHydrating: true
    })).toBe(false)
    expect(shouldShowHomeVueSplash({
      isEmbeddedPreview: false,
      htmlSplashAlreadyPlayed: false,
      cookiesHydrating: true
    })).toBe(false)

    expect(themePlugin).not.toContain('VchOpeningWorkspaceLoader')
    expect(themePlugin).not.toContain('showHomeBootstrapLoader')
    expect(themePlugin).not.toContain('homeWorkspaceReady')
    expect(cookieBanner).not.toContain('VchOpeningWorkspaceLoader')
    expect(cookieBanner).not.toContain('showHomeBootstrapLoader')
  })

  it('keeps the Vue tank loader for in-app waits', () => {
    expect(authPage).toContain('VchOpeningWorkspaceLoader')
    expect(loaderPreview).toContain('VchOpeningWorkspaceLoader')
  })

  it('holds the HTML splash until home workspace is ready', () => {
    expect(splashPlugin).toContain('holdTrackerSpaSplashForBootstrap')
    expect(readFileSync('app/utils/trackerSplash.ts', 'utf8')).toContain(TRACKER_NUXT_SPA_LOADER_ID)
    expect(appPage).toContain('dismissTrackerSpaSplash')
    expect(appPage).toContain('homeWorkspaceReady')
    expect(indexPage).toContain('markHomeWorkspaceReady')
    expect(indexPage).toContain('tracker-app-shell--ready')
    expect(TRACKER_SPA_SPLASH_SELECTOR).toBe('.vch-spa-loading-template')
  })

  it('does not flash an empty tank frame at the end of the SVG loop', () => {
    expect(tankSvg).toContain('25%, 100% { opacity: 1; }')
    expect(tankSvg).not.toContain('translate(315px, -38px)')
    expect(tankSvg).toContain('46%, 100% { transform: translate(125px, -38px); }')
  })
})

describe('monthly backup reminder tip', () => {
  it('teleports above the history badge so overflow-hidden does not clip the bubble', () => {
    expect(reminderTip).toContain('<Teleport to="body">')
    expect(reminderTip).toContain('z-[120]')
    expect(indexPage).toContain('id="monthly-backup-reminder-anchor"')
  })
})
