export type TrackerLayoutMode = 'auto' | 'desktop' | 'mobile'

export function resolveTrackerLayoutState(input: {
  isEmbeddedPreview: boolean
  forceDesktopFromQuery: boolean
  layoutMode: TrackerLayoutMode
  matchesWideViewport: boolean
}) {
  const isWideDesktopWorkspace = (() => {
    if (input.isEmbeddedPreview || input.forceDesktopFromQuery) return true
    if (input.layoutMode === 'mobile' || !input.matchesWideViewport) return false
    return input.layoutMode === 'desktop' || input.layoutMode === 'auto'
  })()

  return {
    isWideDesktopWorkspace,
    isMobileCarouselLayout: !isWideDesktopWorkspace && !input.isEmbeddedPreview,
    prefersDesktopCarouselChrome: !isWideDesktopWorkspace
      && !input.isEmbeddedPreview
      && input.layoutMode === 'desktop'
  }
}
