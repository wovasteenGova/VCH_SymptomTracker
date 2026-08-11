export const PWA_PROMOTION_DELAY_MS = 45_000
export const PWA_DISMISSAL_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type PwaInstallPlatform = 'ios-safari' | 'ios-other' | 'android' | 'desktop'

export interface BeforeInstallPromptChoice {
  outcome: 'accepted' | 'dismissed'
  platform?: string
}

export interface BeforeInstallPromptEvent extends Event {
  platforms?: string[]
  prompt: () => Promise<void>
  userChoice: Promise<BeforeInstallPromptChoice>
}

export function resolvePwaInstallPlatform(input: {
  userAgent: string
  platform?: string
  maxTouchPoints?: number
}): PwaInstallPlatform {
  const userAgent = input.userAgent.toLowerCase()
  const isIpadDesktopMode = input.platform === 'MacIntel' && (input.maxTouchPoints ?? 0) > 1
  const isIos = /iphone|ipad|ipod/.test(userAgent) || isIpadDesktopMode

  if (isIos) {
    const isSafari = /safari/.test(userAgent)
      && !/crios|fxios|edgios|opios/.test(userAgent)
    return isSafari ? 'ios-safari' : 'ios-other'
  }

  if (/android/.test(userAgent)) return 'android'
  return 'desktop'
}

export function pwaDismissalIsActive(
  dismissedAt: string | number | null | undefined,
  now = Date.now()
) {
  const timestamp = Number(dismissedAt)
  return Number.isFinite(timestamp)
    && timestamp > 0
    && now - timestamp < PWA_DISMISSAL_TTL_MS
}

export function shouldOfferPwaPromotion(input: {
  signedIn: boolean
  inApp: boolean
  onboardingComplete: boolean
  engaged: boolean
  installPromptAvailable: boolean
  platform: PwaInstallPlatform
  standalone: boolean
  dismissedAt?: string | number | null
  now?: number
}) {
  if (
    !input.signedIn
    || !input.inApp
    || !input.onboardingComplete
    || !input.engaged
    || input.standalone
  ) return false
  if (pwaDismissalIsActive(input.dismissedAt, input.now)) return false

  return input.installPromptAvailable || input.platform === 'ios-safari'
}

export function browserIsStandalone() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches
    || iosNavigator.standalone === true
}
