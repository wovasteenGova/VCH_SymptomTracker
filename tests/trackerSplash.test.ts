import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TRACKER_LOADER_SENTENCES } from '../app/utils/trackerLoaderCopy.ts'
import {
  TRACKER_BRAND_LOGO_SRC,
  TRACKER_TANK_LOADER_SRC,
  shouldShowHomeVueSplash
} from '../app/utils/trackerSplash.ts'

const spaTemplate = readFileSync('app/spa-loading-template.html', 'utf8')
const config = readFileSync('nuxt.config.ts', 'utf8')
const indexPage = readFileSync('app/pages/index.vue', 'utf8')
const themePlugin = readFileSync('app/plugins/claim-color-theme.client.ts', 'utf8')
const cookieBanner = readFileSync('app/components/VchCookieConsentBanner.vue', 'utf8')
const authPage = readFileSync('app/pages/auth/index.vue', 'utf8')
const loaderPreview = readFileSync('app/pages/dev/loader.vue', 'utf8')
const vueLoader = readFileSync('app/components/VchOpeningWorkspaceLoader.vue', 'utf8')
const tankSvg = readFileSync('public/vch-tank-loader.svg', 'utf8')

describe('VCH tank spa loading template', () => {
  it('includes the tank SVG and VCH brand logo on first paint', () => {
    expect(spaTemplate).toContain(TRACKER_TANK_LOADER_SRC)
    expect(spaTemplate).toContain(TRACKER_BRAND_LOGO_SRC)
    expect(spaTemplate).toContain('VCH')
    expect(spaTemplate).not.toContain('Setting up workspace')
    expect(spaTemplate).toContain('vch-spa-loader-label')
    expect(spaTemplate).toContain('Math.random()')
    for (const sentence of TRACKER_LOADER_SENTENCES) {
      expect(spaTemplate).toContain(sentence)
    }
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
    expect(themePlugin).not.toContain('homeBootstrapComplete')
    expect(cookieBanner).not.toContain('VchOpeningWorkspaceLoader')
    expect(cookieBanner).not.toContain('showHomeBootstrapLoader')
  })

  it('keeps the Vue tank loader for in-app waits', () => {
    expect(authPage).toContain('VchOpeningWorkspaceLoader')
    expect(loaderPreview).toContain('VchOpeningWorkspaceLoader')
  })
})

describe('loader splash caption', () => {
  it('picks a shared sentence once per Vue loader mount', () => {
    expect(vueLoader).toContain('pickTrackerLoaderSentence')
    expect(vueLoader).toContain('fallbackLabel')
    expect(vueLoader).toContain('{{ statusLabel }}')
    expect(vueLoader).not.toContain('v-if="label"')
  })

  it('does not bake a fixed caption into the tank SVG', () => {
    expect(tankSvg).not.toContain('GETTING THINGS READY')
    expect(tankSvg).not.toContain('Getting things ready')
    expect(tankSvg).toContain('class="tank-move"')
  })
})
