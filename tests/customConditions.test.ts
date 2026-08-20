import { describe, expect, it } from 'vitest'
import {
  buildCustomConditionItem,
  buildConditionPickerOptions,
  isCustomTrackedConditionKey,
  normalizeTrackedConditionKeys,
  resolveTrackedConditionByStoredKey,
  resolveTrackedConditionKey
} from '../app/utils/conditionCatalog'

describe('custom tracked conditions', () => {
  it('keeps custom keys when normalizing tracked conditions', () => {
    expect(normalizeTrackedConditionKeys(['ptsd', 'skin_flare_up'])).toEqual([
      'ptsd',
      'skin_flare_up'
    ])
  })

  it('builds a custom condition item with a readable title', () => {
    const item = buildCustomConditionItem('skin_flare_up', 'Skin flare-up')
    expect(item.title).toBe('Skin flare-up')
    expect(item.category).toBe('Custom')
    expect(item.key).toBe('skin_flare_up')
    expect(item.image).toBe('/image/custom-condition.png')
  })

  it('detects custom vs catalog keys', () => {
    expect(isCustomTrackedConditionKey('ptsd')).toBe(false)
    expect(isCustomTrackedConditionKey('rare_nerve_issue')).toBe(true)
  })

  it('resolves custom labels from entry history', () => {
    const resolved = resolveTrackedConditionByStoredKey('rare_nerve_issue', {
      rare_nerve_issue: 'Rare nerve issue'
    })

    expect(resolved?.title).toBe('Rare nerve issue')
    expect(resolveTrackedConditionKey('Rare nerve issue')).toBe('rare_nerve_issue')
  })

  it('includes custom tracked conditions in picker options', () => {
    const options = buildConditionPickerOptions({
      trackedKeys: ['ptsd', 'custom_tinnitus'],
      customLabels: { custom_tinnitus: 'Custom tinnitus' }
    })

    expect(options[0]?.title).toBe('Custom tinnitus')
    expect(options.some((option) => option.key === 'ptsd')).toBe(true)
  })
})
