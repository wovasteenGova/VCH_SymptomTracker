/** Symptom Tracker / ClaimBuilder header: collapse after a short downward scroll run. */
export const ACCUMULATED_HEADER_COLLAPSE_DEFAULTS = {
  compactThreshold: 36,
  topReveal: 8,
  rehideAccum: 48,
  revealAccum: 24
} as const

export interface AccumulatedHeaderCollapseInput {
  compact: boolean
  scrollTop: number
  lastScrollTop: number
  scrollDownAccum: number
  scrollUpAccum?: number
  compactThreshold?: number
  topReveal?: number
  rehideAccum?: number
  revealAccum?: number
  /** When true, scrolling up mid-list shows the chrome again. */
  revealOnUpward?: boolean
  /** When true, scroll position does not reopen the header until toggled off. */
  userCollapsed?: boolean
  revealLockedUntilMs?: number
  nowMs?: number
}

export interface AccumulatedHeaderCollapseResult {
  compact: boolean
  lastScrollTop: number
  scrollDownAccum: number
  scrollUpAccum: number
}

export function resolveAccumulatedHeaderCollapse(
  input: AccumulatedHeaderCollapseInput
): AccumulatedHeaderCollapseResult {
  const compactThreshold = input.compactThreshold ?? ACCUMULATED_HEADER_COLLAPSE_DEFAULTS.compactThreshold
  const topReveal = input.topReveal ?? ACCUMULATED_HEADER_COLLAPSE_DEFAULTS.topReveal
  const rehideAccum = input.rehideAccum ?? ACCUMULATED_HEADER_COLLAPSE_DEFAULTS.rehideAccum
  const revealAccum = input.revealAccum ?? ACCUMULATED_HEADER_COLLAPSE_DEFAULTS.revealAccum

  const scrollTop = input.scrollTop
  const delta = scrollTop - input.lastScrollTop
  let compact = input.compact
  let scrollDownAccum = input.scrollDownAccum
  let scrollUpAccum = input.scrollUpAccum ?? 0

  if (input.userCollapsed) {
    return { compact: true, lastScrollTop: scrollTop, scrollDownAccum: 0, scrollUpAccum: 0 }
  }

  if (scrollTop <= topReveal) {
    return { compact: false, lastScrollTop: scrollTop, scrollDownAccum: 0, scrollUpAccum: 0 }
  }

  const nowMs = input.nowMs ?? 0
  if (delta > 0 && nowMs >= (input.revealLockedUntilMs ?? 0)) {
    scrollDownAccum += delta
    scrollUpAccum = 0
    if (scrollTop > compactThreshold && scrollDownAccum >= rehideAccum) {
      compact = true
      scrollDownAccum = 0
    }
  } else if (delta < 0) {
    scrollDownAccum = 0
    if (input.revealOnUpward) {
      scrollUpAccum += -delta
      if (scrollUpAccum >= revealAccum) {
        compact = false
        scrollUpAccum = 0
      }
    }
  }

  return { compact, lastScrollTop: scrollTop, scrollDownAccum, scrollUpAccum }
}
