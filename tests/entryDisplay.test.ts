import { describe, expect, it } from 'vitest'
import {
  HISTORY_ENTRY_LIST_TITLE_MAX_CHARS,
  mapEntryHistoryItem,
  truncateToCharCount
} from '../app/utils/entryDisplay'

describe('truncateToCharCount', () => {
  it('leaves short text unchanged', () => {
    expect(truncateToCharCount('one two three', 65)).toBe('one two three')
  })

  it('matches the expected ~one-line preview length', () => {
    const preview = 'Mayjor back pain. Woke up with it. Its the start of the day, but'
    expect(preview.length).toBe(64)
    expect(truncateToCharCount(preview, HISTORY_ENTRY_LIST_TITLE_MAX_CHARS)).toBe(preview)
  })

  it('truncates at the character limit with an ellipsis', () => {
    const text = 'a'.repeat(HISTORY_ENTRY_LIST_TITLE_MAX_CHARS + 10)
    const result = truncateToCharCount(text, HISTORY_ENTRY_LIST_TITLE_MAX_CHARS)

    expect(result.endsWith('…')).toBe(true)
    expect(result.replace(/…$/, '').length).toBe(HISTORY_ENTRY_LIST_TITLE_MAX_CHARS)
  })
})

describe('mapEntryHistoryItem', () => {
  it('exposes list preview fields without changing full title', () => {
    const longSummary = `${'word '.repeat(40)}end`
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
    expect(mapped.listTitle).toBe(truncateToCharCount(longSummary, HISTORY_ENTRY_LIST_TITLE_MAX_CHARS))
    expect(mapped.listSummary).toBe('Could not leave home')
  })
})
