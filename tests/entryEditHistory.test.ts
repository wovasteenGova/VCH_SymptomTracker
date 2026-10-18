import { describe, expect, it } from 'vitest'
import {
  buildFieldEditHistory,
  buildFieldEditPresentation,
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

  it('shows an unchanged paragraph once and labels only the added paragraph', () => {
    const before = 'My back hurt while I was sitting at work.'
    const addition = 'I will try a different office chair.'
    const revisions = [revision('entry-1', 1, baseSnapshot(before))]
    const originalRevisions = JSON.stringify(revisions)
    const paragraphs = buildFieldEditPresentation(revisions, baseSnapshot(`${before}\n\n${addition}`), { kind: 'summary' })

    expect(paragraphs).toEqual([
      { runs: [{ text: before, kind: 'unchanged' }] },
      { runs: [{ text: addition, kind: 'added', addedAt: revisions[0]!.revised_at }], addedAt: revisions[0]!.revised_at }
    ])
    expect(JSON.stringify(revisions)).toBe(originalRevisions)
  })

  it('marks only a replaced word and keeps the surrounding sentence untouched', () => {
    const paragraphs = buildFieldEditPresentation(
      [revision('entry-1', 1, baseSnapshot('The pain lasted two hours.'))],
      baseSnapshot('The pain lasted three hours.'),
      { kind: 'summary' }
    )
    expect(paragraphs[0]!.runs.map(({ text, kind }) => ({ text, kind }))).toEqual([
      { text: 'The pain lasted ', kind: 'unchanged' },
      { text: 'two', kind: 'removed' },
      { text: 'three', kind: 'added' },
      { text: ' hours.', kind: 'unchanged' }
    ])
    expect(paragraphs[0]!.addedAt).toBeUndefined()
  })

  it('retains intermediate word edits, including a later reversal', () => {
    const revisions = [
      revision('entry-1', 3, baseSnapshot('Pain was severe today.')),
      revision('entry-1', 1, baseSnapshot('Pain was mild today.')),
      revision('entry-1', 2, baseSnapshot('Pain was moderate today.'))
    ]
    const paragraphs = buildFieldEditPresentation(revisions, baseSnapshot('Pain was mild today.'), { kind: 'summary' })
    const runs = paragraphs.flatMap(paragraph => paragraph.runs)
    expect(runs.filter(run => run.kind === 'removed').map(run => run.text)).toEqual(['mild', 'moderate', 'severe'])
    expect(runs.filter(run => run.kind !== 'removed').map(run => run.text).join('')).toBe('Pain was mild today.')
  })

  it('handles insertion, deletion, empty fields, punctuation and paragraph boundaries', () => {
    for (const [before, after, hasRemoval] of [
      ['Pain today.', 'Pain after lunch today.', false],
      ['Pain after lunch today.', 'Pain today.', true],
      ['', 'New information.', false],
      ['Removed information.', '', true],
      ['One.\n\nTwo.', 'One.\n\nNew.\n\nTwo.', false],
      ['One.\r\n\r\nTwo.', 'One.\n\nTwo!', true],
      ['Same paragraph.', 'Same paragraph.', false]
    ] as const) {
      const paragraphs = buildFieldEditPresentation(
        [revision('entry-1', 1, baseSnapshot(before!))], baseSnapshot(after!), { kind: 'summary' }
      )
      const liveText = paragraphs.map(paragraph => paragraph.runs.filter(run => run.kind !== 'removed')
        .map(run => run.text).join('')).filter(Boolean).join('\n\n')
      expect(liveText).toBe(after)
      expect(paragraphs.flatMap(paragraph => paragraph.runs).some(run => run.kind === 'removed')).toBe(hasRemoval)
    }
  })

  it('uses existing detail snapshots and leaves fields without edits clean', () => {
    const before = baseSnapshot('No change')
    const current = { ...before, details: { flare_up_trigger: 'noise and stress' } }
    expect(buildFieldEditPresentation([revision('entry-1', 1, before)], current, { kind: 'detail', key: 'flare_up_trigger' })[0]!.runs)
      .toEqual([
        { text: 'noise', kind: 'unchanged' },
        { text: ' and stress', kind: 'added', addedAt: '2026-08-01T12:00:00.000Z' }
      ])
    expect(buildFieldEditPresentation([], before, { kind: 'impact' }))
      .toEqual([{ runs: [{ text: 'Tired', kind: 'unchanged' }] }])
  })

  it('keeps the original addition date when a newly added paragraph is edited again', () => {
    const first = revision('entry-1', 1, baseSnapshot('Original paragraph.'))
    const second = {
      ...revision('entry-1', 2, baseSnapshot('Original paragraph.\n\nPain lasted two hours.')),
      revised_at: '2026-08-02T12:00:00.000Z'
    }
    const paragraphs = buildFieldEditPresentation(
      [first, second], baseSnapshot('Original paragraph.\n\nPain lasted three hours.'), { kind: 'summary' }
    )
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[1]!.addedAt).toBe(first.revised_at)
    expect(paragraphs[1]!.runs.filter(run => run.kind === 'removed').map(run => run.text)).toEqual(['two'])
    expect(paragraphs[1]!.runs.filter(run => run.kind !== 'removed').map(run => run.text).join(''))
      .toBe('Pain lasted three hours.')
  })
})
