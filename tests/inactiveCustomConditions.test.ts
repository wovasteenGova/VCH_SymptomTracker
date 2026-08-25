import { describe, expect, it } from 'vitest'
import { buildInactiveCustomConditions } from '../app/utils/inactiveCustomConditions'

describe('inactive custom conditions', () => {
  it('lists custom keys that are not on the home screen but still have logs', () => {
    const items = buildInactiveCustomConditions({
      trackedKeys: ['ptsd'],
      entries: [
        { condition_key: 'skin_flare_up', condition_label: 'Skin flare-up' },
        { condition_key: 'skin_flare_up', condition_label: 'Skin flare-up' },
        { condition_key: 'ptsd', condition_label: 'PTSD' }
      ],
      customLabels: {
        skin_flare_up: 'Skin flare-up'
      }
    })

    expect(items).toEqual([
      {
        key: 'skin_flare_up',
        label: 'Skin flare-up',
        entryCount: 2
      }
    ])
  })

  it('includes saved custom labels without logs when they are not tracked', () => {
    const items = buildInactiveCustomConditions({
      trackedKeys: ['ptsd'],
      entries: [],
      customLabels: {
        rare_issue: 'Rare issue'
      }
    })

    expect(items).toEqual([
      {
        key: 'rare_issue',
        label: 'Rare issue',
        entryCount: 0
      }
    ])
  })

  it('excludes catalog conditions and tracked custom keys', () => {
    const items = buildInactiveCustomConditions({
      trackedKeys: ['tracker', 'ptsd'],
      entries: [
        { condition_key: 'tracker', condition_label: 'Tracker!' },
        { condition_key: 'ptsd', condition_label: 'PTSD' },
        { condition_key: 'yo_mama', condition_label: 'Yo mama' }
      ],
      customLabels: {
        tracker: 'Tracker!'
      }
    })

    expect(items).toEqual([
      {
        key: 'yo_mama',
        label: 'Yo mama',
        entryCount: 1
      }
    ])
  })
})
