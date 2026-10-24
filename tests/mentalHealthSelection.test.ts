import { describe, expect, it } from 'vitest'
import {
  findMentalHealthConditionKeyInList,
  isMentalHealthConditionKey,
  keysWithSingleMentalHealthSelection
} from '../app/utils/conditionCatalog'
import { conditionKeyFromLabel } from '../app/utils/subscription'

describe('mental health tracked selection', () => {
  const ptsdKey = conditionKeyFromLabel('PTSD')
  const anxietyKey = conditionKeyFromLabel('Anxiety')
  const backKey = conditionKeyFromLabel('Lower back pain')

  it('finds the current mental health pick in a tracked list', () => {
    expect(findMentalHealthConditionKeyInList([backKey, ptsdKey])).toBe(ptsdKey)
    expect(findMentalHealthConditionKeyInList([backKey])).toBe(null)
  })

  it('replaces a prior mental health pick when switching labels', () => {
    const next = keysWithSingleMentalHealthSelection([ptsdKey, backKey], anxietyKey)
    expect(next).toEqual([anxietyKey, backKey])
    expect(next.filter((key) => isMentalHealthConditionKey(key))).toHaveLength(1)
  })

  it('clears mental health locks when nothing is selected', () => {
    expect(findMentalHealthConditionKeyInList([])).toBe(null)
  })
})
