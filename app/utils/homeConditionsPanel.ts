/**
 * Home conditions panel: loading vs empty vs error.
 *
 * After login, auth hydration and the conditions fetch often finish after first
 * paint. Empty keys in that window are not a failure.
 */

export type HomeConditionsView = 'browser' | 'loading' | 'error' | 'carousel'

export function isTrackedConditionsHydrating(input: {
  isDemoMode: boolean
  isAuthLoading: boolean
  isLoading: boolean
  hasLoaded: boolean
  userId: string | null
  loadedOwnerId: string | null
  trackedKeyCount: number
}): boolean {
  if (input.isDemoMode) {
    return false
  }

  const hasKeysForCurrentOwner = input.trackedKeyCount > 0
    && input.loadedOwnerId === input.userId

  if (hasKeysForCurrentOwner) {
    return false
  }

  if (input.isAuthLoading || input.isLoading || !input.hasLoaded) {
    return true
  }

  return input.loadedOwnerId !== input.userId
}

export function resolveHomeConditionsView(input: {
  showConditionBrowser: boolean
  isHydrating: boolean
  loadError: string
  conditionsCount: number
}): HomeConditionsView {
  if (input.showConditionBrowser) {
    return 'browser'
  }

  if (input.loadError && input.conditionsCount === 0 && !input.isHydrating) {
    return 'error'
  }

  if (input.conditionsCount > 0) {
    return 'carousel'
  }

  return 'loading'
}
