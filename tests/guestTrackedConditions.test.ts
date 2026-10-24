import { describe, expect, it } from 'vitest'
import { conditionKeyFromLabel } from '../app/utils/subscription'
import { resolveGuestTrackedConditionsFromLocalState } from '../app/utils/guestTrackedConditions'

describe('resolveGuestTrackedConditionsFromLocalState', () => {
  const ptsdKey = conditionKeyFromLabel('PTSD')
  const backKey = conditionKeyFromLabel('Lower back pain')

  it('keeps an explicit empty guest selection instead of re-deriving from entries', () => {
    const resolved = resolveGuestTrackedConditionsFromLocalState({
      hasStoredKeysRecord: true,
      storedKeys: [],
      onboardingCompleted: true,
      entryConditionKeys: [ptsdKey, backKey]
    })

    expect(resolved.keys).toEqual([])
    expect(resolved.completed).toBe(true)
  })

  it('bootstraps from guest entries only before any saved tracked keys exist', () => {
    const resolved = resolveGuestTrackedConditionsFromLocalState({
      hasStoredKeysRecord: false,
      storedKeys: [],
      onboardingCompleted: false,
      entryConditionKeys: [ptsdKey]
    })

    expect(resolved.keys).toEqual([ptsdKey])
    expect(resolved.completed).toBe(true)
  })
})
