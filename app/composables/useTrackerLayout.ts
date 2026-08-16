import { useRoute, useState } from '#imports'
import { useMediaQuery } from '@vueuse/core'
import { computed, inject, onMounted } from 'vue'

export type TrackerLayoutMode = 'auto' | 'desktop' | 'mobile'

export const TRACKER_LAYOUT_STORAGE_KEY = 'symptom-tracker-layout-mode'
export const TRACKER_EMBED_KEY = Symbol('tracker-embed')
export const TRACKER_DEMO_KEY = Symbol('tracker-demo')
export const TRACKER_DEMO_ACTIONS_KEY = Symbol('tracker-demo-actions')
export const TRACKER_DEMO_CONTROL_KEY = Symbol('tracker-demo-control')
export const TRACKER_CLOSE_EMBED_PROFILE_KEY = Symbol('close-embed-profile')
export const TRACKER_CLOSE_SETTINGS_KEY = Symbol('close-tracker-settings')

function readStoredLayoutMode(): TrackerLayoutMode {
  if (!import.meta.client) {
    return 'auto'
  }

  const stored = window.localStorage.getItem(TRACKER_LAYOUT_STORAGE_KEY)

  if (stored === 'auto' || stored === 'desktop' || stored === 'mobile') {
    return stored
  }

  return 'auto'
}

export function resolveTrackerLayoutState(input: {
  isEmbeddedPreview: boolean
  forceDesktopFromQuery: boolean
  layoutMode: TrackerLayoutMode
  matchesWideViewport: boolean
}) {
  const isWideDesktopWorkspace = (() => {
    if (input.isEmbeddedPreview || input.forceDesktopFromQuery) {
      return true
    }

    if (input.layoutMode === 'mobile') {
      return false
    }

    if (!input.matchesWideViewport) {
      return false
    }

    return input.layoutMode === 'desktop' || input.layoutMode === 'auto'
  })()

  const isMobileCarouselLayout = !isWideDesktopWorkspace && !input.isEmbeddedPreview

  const prefersDesktopCarouselChrome = !isWideDesktopWorkspace
    && !input.isEmbeddedPreview
    && input.layoutMode === 'desktop'

  return {
    isWideDesktopWorkspace,
    isMobileCarouselLayout,
    prefersDesktopCarouselChrome
  }
}

export function useTrackerLayout() {
  const route = useRoute()
  const isEmbeddedPreview = inject(TRACKER_EMBED_KEY, false)
  const matchesWideViewport = useMediaQuery('(min-width: 1024px)')
  const layoutMode = useState<TrackerLayoutMode>('tracker-layout-mode', readStoredLayoutMode)

  if (import.meta.client) {
    onMounted(() => {
      layoutMode.value = readStoredLayoutMode()
    })
  }

  const forceDesktopFromQuery = computed(() => {
    const layout = route.query.layout
    const embed = route.query.embed

    return layout === 'desktop' || embed === 'desktop' || embed === '1' || embed === 'true'
  })

  /** Three-column desktop workspace (conditions | log | history). Requires a wide viewport. */
  const isWideDesktopWorkspace = computed(() => resolveTrackerLayoutState({
    isEmbeddedPreview,
    forceDesktopFromQuery: forceDesktopFromQuery.value,
    layoutMode: layoutMode.value,
    matchesWideViewport: matchesWideViewport.value
  }).isWideDesktopWorkspace)

  /** Phone-style carousel (overview + condition slides). */
  const isMobileCarouselLayout = computed(() => resolveTrackerLayoutState({
    isEmbeddedPreview,
    forceDesktopFromQuery: forceDesktopFromQuery.value,
    layoutMode: layoutMode.value,
    matchesWideViewport: matchesWideViewport.value
  }).isMobileCarouselLayout)

  /** Arrow controls on the carousel when desktop layout is forced on a narrow window. */
  const prefersDesktopCarouselChrome = computed(() => resolveTrackerLayoutState({
    isEmbeddedPreview,
    forceDesktopFromQuery: forceDesktopFromQuery.value,
    layoutMode: layoutMode.value,
    matchesWideViewport: matchesWideViewport.value
  }).prefersDesktopCarouselChrome)

  const isDesktopLayout = isWideDesktopWorkspace
  const isMobileLayout = computed(() => !isWideDesktopWorkspace.value)

  function setLayoutMode(mode: TrackerLayoutMode) {
    layoutMode.value = mode

    if (import.meta.client) {
      window.localStorage.setItem(TRACKER_LAYOUT_STORAGE_KEY, mode)
    }
  }

  return {
    layoutMode,
    isDesktopLayout,
    isMobileLayout,
    isWideDesktopWorkspace,
    isMobileCarouselLayout,
    prefersDesktopCarouselChrome,
    isEmbeddedPreview,
    setLayoutMode
  }
}
