/**
 * Home first paint uses Nuxt `spaLoadingTemplate` (HTML tank + brand).
 * Vue must not mount a second fullscreen VchOpeningWorkspaceLoader on that
 * same load, or when color-mode / cookies / theme hydrate afterwards.
 *
 * In-app waits (auth, welcome, saving, /dev/loader) still use the Vue loader.
 */

export const TRACKER_TANK_LOADER_SRC = '/vch-tank-loader.svg'
export const TRACKER_BRAND_LOGO_SRC = '/brand/vch-symptom-tracker-logo.png'

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
