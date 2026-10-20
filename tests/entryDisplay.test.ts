import { describe, expect, it } from 'vitest'
import { HISTORY_ENTRY_LIST_MAX_WORDS, mapEntryHistoryItem, truncateToWordCount } from '../app/utils/entryDisplay'

describe('truncateToWordCount', () => {
  it('leaves short text unchanged', () => {
    expect(truncateToWordCount('one two three')).toBe('one two three')
  })

  it('truncates at the word limit with an ellipsis', () => {
    const words = Array.from({ length: HISTORY_ENTRY_LIST_MAX_WORDS + 5 }, (_, index) => `w${index}`)
    const text = words.join(' ')
    const result = truncateToWordCount(text)

    expect(result.endsWith('…')).toBe(true)
    expect(result.replace(/…$/, '').split(/\s+/)).toHaveLength(HISTORY_ENTRY_LIST_MAX_WORDS)
  })
})

describe('mapEntryHistoryItem', () => {
  it('exposes list preview fields without changing full title', () => {
    const longSummary = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ')
    const mapped = mapEntryHistoryItem({
      id: '1',
      created_at: '2026-10-19T12:00:00.000Z',
      occurred_at: '2026-10-19T12:00:00.000Z',
      condition_label: 'Lower back pain',
      summary: longSummary,
      impact: 'Could not leave home',
      severity: 7,
      source: 'veteran'
    })

    expect(mapped.title).toBe(longSummary)
    expect(mapped.listTitle).toBe(truncateToWordCount(longSummary))
    expect(mapped.listSummary).toBe('Could not leave home')
  })
})
