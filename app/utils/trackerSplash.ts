export const TRACKER_STATIC_SPLASH_ID = 'tracker-static-splash'
export const TRACKER_STATIC_SPLASH_FADE_MS = 500

declare global {
  interface Window {
    __trackerStaticSplashActive?: boolean
  }
}

export function isTrackerStaticSplashPresent() {
  if (typeof document === 'undefined') {
    return false
  }

  return Boolean(document.getElementById(TRACKER_STATIC_SPLASH_ID))
}

export function dismissTrackerStaticSplash() {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.remove('tracker-booting')

  if (typeof window !== 'undefined') {
    window.__trackerStaticSplashActive = false
  }

  const splash = document.getElementById(TRACKER_STATIC_SPLASH_ID)

  if (!splash || splash.classList.contains('tracker-static-splash--leaving')) {
    return
  }

  splash.classList.add('tracker-static-splash--leaving')
  window.setTimeout(() => {
    splash.remove()
  }, TRACKER_STATIC_SPLASH_FADE_MS)
}

/**
 * First home load uses the HTML tank only. Vue may paint a tank only after
 * an explicit retry (allowVueFallback), never because cookies/theme remounted.
 */
export function shouldShowVueAppSplash(input: {
  isClient: boolean
  staticSplashPresent: boolean
  splashDismissed: boolean
  allowVueFallback: boolean
  isHomeRoute: boolean
  homeWorkspaceReady: boolean
  nonHomeSplashVisible: boolean
}) {
  if (!input.isClient || input.splashDismissed || !input.allowVueFallback) {
    return false
  }

  if (input.staticSplashPresent) {
    return false
  }

  if (input.isHomeRoute) {
    return !input.homeWorkspaceReady
  }

  return input.nonHomeSplashVisible
}
