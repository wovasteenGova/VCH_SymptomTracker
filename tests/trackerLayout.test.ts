import { describe, expect, it } from 'vitest'
import { resolveTrackerLayoutState } from '../app/composables/useTrackerLayout'

describe('tracker layout breakpoints', () => {
  it('uses the phone carousel when desktop mode is forced on a narrow viewport', () => {
    const layout = resolveTrackerLayoutState({
      isEmbeddedPreview: false,
      forceDesktopFromQuery: false,
      layoutMode: 'desktop',
      matchesWideViewport: false
    })

    expect(layout.isWideDesktopWorkspace).toBe(false)
    expect(layout.isMobileCarouselLayout).toBe(true)
    expect(layout.prefersDesktopCarouselChrome).toBe(true)
  })

  it('keeps the three-panel workspace on wide screens in auto mode', () => {
    const layout = resolveTrackerLayoutState({
      isEmbeddedPreview: false,
      forceDesktopFromQuery: false,
      layoutMode: 'auto',
      matchesWideViewport: true
    })

    expect(layout.isWideDesktopWorkspace).toBe(true)
    expect(layout.isMobileCarouselLayout).toBe(false)
    expect(layout.prefersDesktopCarouselChrome).toBe(false)
  })
})
