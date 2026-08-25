import { describe, expect, it } from 'vitest'
import {
  customConditionLabelsChanged,
  mergeStoredCustomConditionLabels,
  normalizeCustomConditionLabels
} from '../app/utils/customConditionLabels'
import {
  buildCustomConditionItem,
  buildConditionPickerOptions,
  collectCustomConditionBrowserKeys,
  isCustomTrackedConditionKey,
  mergeCustomConditionLabelMaps,
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

  it('keeps draft custom conditions visible when they are not selected', () => {
    const extraKeys = collectCustomConditionBrowserKeys({
      trackedKeys: ['ptsd'],
      listOrderKeys: ['skin_flare_up', 'ptsd'],
      draftKeys: []
    })

    const options = buildConditionPickerOptions({
      trackedKeys: ['ptsd'],
      extraKeys,
      customLabels: { skin_flare_up: 'Skin flare-up' }
    })

    expect(extraKeys).toEqual(['skin_flare_up'])
    expect(options.some((option) => option.key === 'skin_flare_up')).toBe(true)
    expect(options.find((option) => option.key === 'skin_flare_up')?.title).toBe('Skin flare-up')
  })

  it('merges persisted and entry-derived custom labels', () => {
    expect(mergeCustomConditionLabelMaps(
      { skin_flare_up: 'Skin flare-up' },
      { rare_issue: 'Rare issue' }
    )).toEqual({
      skin_flare_up: 'Skin flare-up',
      rare_issue: 'Rare issue'
    })
  })

  it('normalizes stored custom condition labels', () => {
    expect(normalizeCustomConditionLabels({
      skin_flare_up: ' Skin flare-up ',
      '': 'Ignored',
      invalid: 42
    })).toEqual({
      skin_flare_up: 'Skin flare-up'
    })
  })

  it('merges remote and local custom labels with local winning conflicts', () => {
    expect(mergeStoredCustomConditionLabels(
      { skin_flare_up: 'Remote label' },
      { skin_flare_up: 'Local label', rare_issue: 'Rare issue' }
    )).toEqual({
      skin_flare_up: 'Local label',
      rare_issue: 'Rare issue'
    })
  })

  it('detects custom label map changes', () => {
    expect(customConditionLabelsChanged(
      { skin_flare_up: 'Skin flare-up' },
      { skin_flare_up: 'Skin flare-up' }
    )).toBe(false)

    expect(customConditionLabelsChanged(
      { skin_flare_up: 'Skin flare-up' },
      { skin_flare_up: 'Updated label' }
    )).toBe(true)
  })
})
