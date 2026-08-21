export const TRACKER_STATIC_SPLASH_ID = 'tracker-static-splash'
export const TRACKER_STATIC_SPLASH_FADE_MS = 500

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
 * Vue must not paint a second tank when the HTML splash is already on screen,
 * or after bootstrap has already dismissed it once this session.
 */
export function shouldShowVueAppSplash(input: {
  isClient: boolean
  staticSplashPresent: boolean
  splashDismissed: boolean
  isHomeRoute: boolean
  homeWorkspaceReady: boolean
  nonHomeSplashVisible: boolean
}) {
  if (!input.isClient || input.staticSplashPresent || input.splashDismissed) {
    return false
  }

  if (input.isHomeRoute) {
    return !input.homeWorkspaceReady
  }

  return input.nonHomeSplashVisible
}
