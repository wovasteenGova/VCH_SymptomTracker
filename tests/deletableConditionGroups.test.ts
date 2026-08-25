import { describe, expect, it } from 'vitest'
import {
  buildDeletableConditionGroups,
  totalDeletableEntryCount
} from '../app/utils/deletableConditionGroups'

describe('deletable condition groups', () => {
  it('groups active entries by condition key', () => {
    const groups = buildDeletableConditionGroups({
      activeEntries: [
        { condition_key: 'ptsd', condition_label: 'PTSD' },
        { condition_key: 'ptsd', condition_label: 'PTSD' },
        { condition_key: 'gerd_acid_reflux', condition_label: 'GERD / Acid Reflux' }
      ]
    })

    expect(groups).toEqual([
      {
        key: 'gerd_acid_reflux',
        label: 'GERD / Acid Reflux',
        activeEntryCount: 1,
        deletedEntryCount: 0
      },
      {
        key: 'ptsd',
        label: 'PTSD',
        activeEntryCount: 2,
        deletedEntryCount: 0
      }
    ])
  })

  it('merges active and deleted counts for the same condition', () => {
    const groups = buildDeletableConditionGroups({
      activeEntries: [
        { condition_key: 'tracker', condition_label: 'Tracker!' }
      ],
      deletedEntries: [
        { condition_key: 'tracker', condition_label: 'Tracker!' },
        { condition_key: 'traer', condition_label: 'Traer' }
      ]
    })

    expect(groups).toHaveLength(2)
    expect(groups.find((group) => group.key === 'tracker')).toEqual({
      key: 'tracker',
      label: 'Tracker!',
      activeEntryCount: 1,
      deletedEntryCount: 1
    })
    expect(totalDeletableEntryCount(groups[0]!)).toBe(2)
  })
})
