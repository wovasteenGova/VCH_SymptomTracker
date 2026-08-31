/**
 * Home first paint uses Nuxt `spaLoadingTemplate` (HTML tank + brand).
 * Vue must not mount a second fullscreen VchOpeningWorkspaceLoader on that
 * same load, or when color-mode / cookies / theme hydrate afterwards.
 *
 * In-app waits (auth, welcome, saving, /dev/loader) still use the Vue loader.
 */

export const TRACKER_TANK_LOADER_SRC = '/vch-tank-loader.svg'
export const TRACKER_BRAND_LOGO_SRC = '/brand/vch-symptom-tracker-logo.png'
export const TRACKER_SPA_SPLASH_SELECTOR = '.vch-spa-loading-template'
export const TRACKER_NUXT_SPA_LOADER_ID = '__nuxt-loader'

declare global {
  interface Window {
    __trackerSpaSplashActive?: boolean
    __trackerBootSplashDone?: boolean
  }
}

export function isTrackerSpaSplashPresent() {
  if (typeof document === 'undefined') {
    return false
  }

  return Boolean(document.querySelector(TRACKER_SPA_SPLASH_SELECTOR))
}

export function isBootSplashLockedOff() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.__trackerBootSplashDone === true
}

/**
 * Keep the HTML tank visible until home bootstrap finishes. Nuxt removes
 * `#__nuxt-loader` on `app:suspense:resolve` (before data loads); the splash
 * plugin strips that id so we control dismissal here.
 */
export function holdTrackerSpaSplashForBootstrap() {
  if (typeof document === 'undefined') {
    return
  }

  const splash = document.querySelector(TRACKER_SPA_SPLASH_SELECTOR)

  if (!splash) {
    return
  }

  if (typeof window !== 'undefined') {
    window.__trackerSpaSplashActive = true
  }

  splash.setAttribute('data-tracker-splash-held', 'true')

  if (splash.id === TRACKER_NUXT_SPA_LOADER_ID) {
    splash.removeAttribute('id')
  }
}

/**
 * Hide the HTML tank immediately. Do not fade: a leaving transition can
 * snap back after cookies/theme hydrate and look like a second tank.
 */
export function dismissTrackerSpaSplash() {
  if (typeof document === 'undefined') {
    return
  }

  if (typeof window !== 'undefined') {
    window.__trackerSpaSplashActive = false
    window.__trackerBootSplashDone = true
  }

  document.documentElement.classList.remove('tracker-booting')

  const splash = document.querySelector(TRACKER_SPA_SPLASH_SELECTOR)

  if (!splash) {
    return
  }

  splash.style.setProperty('opacity', '0', 'important')
  splash.style.setProperty('display', 'none', 'important')
  splash.style.setProperty('pointer-events', 'none', 'important')
  splash.setAttribute('aria-hidden', 'true')
  splash.remove()
}

export function shouldShowHomeVueSplash(input: {
  isEmbeddedPreview: boolean
  /** True when spaLoadingTemplate already showed the tank this navigation. */
  htmlSplashAlreadyPlayed: boolean
  themeHydrating?: boolean
  cookiesHydrating?: boolean
}): boolean {
  if (input.isEmbeddedPreview) {
    return false
  }

  if (input.htmlSplashAlreadyPlayed) {
    return false
  }

  if (input.themeHydrating || input.cookiesHydrating) {
    return false
  }

  // Home no longer uses a Vue fullscreen tank. A missing HTML splash is still
  // not a reason to remount SVG animation after hydrate/remount.
  return false
}
