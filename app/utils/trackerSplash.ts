export const TRACKER_STATIC_SPLASH_ID = 'tracker-static-splash'

declare global {
  interface Window {
    __trackerStaticSplashActive?: boolean
    __trackerBootSplashDone?: boolean
  }
}

export function isTrackerStaticSplashPresent() {
  if (typeof document === 'undefined') {
    return false
  }

  return Boolean(document.getElementById(TRACKER_STATIC_SPLASH_ID))
}

export function isBootSplashLockedOff() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.__trackerBootSplashDone === true
}

/**
 * Hide the HTML tank immediately. Do not fade: a 500ms leaving class can
 * snap back to opacity 1 after cookies/theme hydrate, which looks like a
 * second tank on top of an already-visible page.
 */
export function dismissTrackerStaticSplash() {
  if (typeof document === 'undefined') {
    return
  }

  if (typeof window !== 'undefined') {
    window.__trackerStaticSplashActive = false
    window.__trackerBootSplashDone = true
  }

  document.documentElement.classList.remove('tracker-booting')

  const splash = document.getElementById(TRACKER_STATIC_SPLASH_ID)

  if (!splash) {
    return
  }

  splash.style.setProperty('opacity', '0', 'important')
  splash.style.setProperty('display', 'none', 'important')
  splash.style.setProperty('pointer-events', 'none', 'important')
  splash.setAttribute('aria-hidden', 'true')
  splash.remove()
}

/**
 * Vue must never paint a second tank. First load uses the HTML splash only.
 * Kept as a guard so a future overlay cannot replay after bootstrap.
 */
export function shouldShowVueAppSplash(input: {
  isClient: boolean
  staticSplashPresent: boolean
  splashDismissed: boolean
  allowVueFallback: boolean
  isHomeRoute: boolean
  homeWorkspaceReady: boolean
  nonHomeSplashVisible: boolean
  bootSplashLockedOff?: boolean
}) {
  if (!input.isClient || input.splashDismissed || input.bootSplashLockedOff) {
    return false
  }

  if (!input.allowVueFallback) {
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
