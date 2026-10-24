import { normalizeTrackedConditionKeys } from './conditionCatalog'

/** How logged-out tracked conditions load from localStorage vs guest log history. */
export function resolveGuestTrackedConditionsFromLocalState(options: {
  /** false when the guest has never saved tracked keys to localStorage. */
  hasStoredKeysRecord: boolean
  storedKeys: string[]
  onboardingCompleted: boolean
  entryConditionKeys: string[]
}) {
  const {
    hasStoredKeysRecord,
    storedKeys,
    onboardingCompleted,
    entryConditionKeys
  } = options

  if (hasStoredKeysRecord || onboardingCompleted) {
    const keys = normalizeTrackedConditionKeys(storedKeys)
    return {
      keys,
      completed: onboardingCompleted || keys.length > 0
    }
  }

  if (entryConditionKeys.length) {
    return {
      keys: normalizeTrackedConditionKeys(entryConditionKeys.slice(0, 12)),
      completed: true
    }
  }

  return { keys: [], completed: false }
}
