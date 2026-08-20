import { describe, expect, it } from 'vitest'
import {
  buildFieldEditHistory,
  getRemainingEntryEdits,
  isEntryEditLocked,
  normalizeRevisionSnapshot,
  type EntryRevisionRecord
} from '../app/utils/entryEditHistory'
import type { SymptomEntrySavePayload } from '../app/utils/symptomEntrySavePayload'

function revision(entryId: string, revisionNumber: number, snapshot: SymptomEntrySavePayload): EntryRevisionRecord {
  return {
    entry_id: entryId,
    revision_number: revisionNumber,
    revised_at: '2026-08-01T12:00:00.000Z',
    snapshot
  }
}

const baseSnapshot = (summary: string, severity = 5): SymptomEntrySavePayload => ({
  condition_key: 'ptsd',
  condition_label: 'PTSD',
  severity,
  occurred_at: '2026-08-01T10:00:00.000Z',
  summary,
  impact: 'Tired',
  details: {
    flare_up_trigger: 'noise'
  }
})

describe('entry edit history', () => {
  it('tracks remaining edits up to three', () => {
    expect(getRemainingEntryEdits(0)).toBe(3)
    expect(getRemainingEntryEdits(2)).toBe(1)
    expect(getRemainingEntryEdits(3)).toBe(0)
    expect(isEntryEditLocked(3)).toBe(true)
  })

  it('builds prior summary values only when that field changed', () => {
    const entryId = 'entry-1'
    const revisions = [
      revision(entryId, 1, baseSnapshot('Headache morning')),
      revision(entryId, 2, baseSnapshot('Headache all day'))
    ]
    const current = baseSnapshot('Headache all day with nausea', 7)

    const summaryHistory = buildFieldEditHistory(revisions, current, { kind: 'summary' })
    expect(summaryHistory.priorValues).toEqual([
      'Headache morning',
      'Headache all day'
    ])
    expect(summaryHistory.currentValue).toBe('Headache all day with nausea')

    const impactHistory = buildFieldEditHistory(revisions, current, { kind: 'impact' })
    expect(impactHistory.priorValues).toEqual([])
    expect(impactHistory.currentValue).toBe('Tired')
  })

  it('normalizes string snapshot json from the database', () => {
    const snapshot = normalizeRevisionSnapshot(JSON.stringify({
      condition_key: 'gerd',
      condition_label: 'GERD',
      severity: 5,
      occurred_at: '2026-07-06T23:37:00.000Z',
      summary: 'Original summary',
      impact: 'Poor sleep',
      details: {}
    }))

    expect(snapshot.summary).toBe('Original summary')
    expect(snapshot.severity).toBe(5)
  })
})
