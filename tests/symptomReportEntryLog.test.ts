import { describe, expect, it, vi } from 'vitest'
import { jsPDF } from 'jspdf'
import { drawEntryLogSection, type ReportEntryRecord } from '../app/utils/symptomReportEntryLog'
import { buildSymptomEntrySavePayloadFromReportEntry, type EntryRevisionRecord } from '../app/utils/entryEditHistory'

function renderRevision(beforeText: string, afterText: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const text = vi.spyOn(doc, 'text')
  const line = vi.spyOn(doc, 'line')
  const before: ReportEntryRecord = {
    id: 'entry-1',
    condition_label: 'Back pain',
    summary: beforeText,
    impact: 'Difficulty sitting at work',
    severity: 5,
    occurred_at: '2026-10-18T15:00:00Z',
    created_at: '2026-10-18T15:00:00Z',
    details: { duration: 'Two hours' }
  }
  const revision: EntryRevisionRecord = {
    entry_id: before.id!,
    revision_number: 1,
    revised_at: '2026-10-18T15:30:00Z',
    snapshot: buildSymptomEntrySavePayloadFromReportEntry(before)
  }
  const endY = drawEntryLogSection(doc, [{
    ...before, summary: afterText, edit_count: 1, updated_at: revision.revised_at
  }], 36, 48, 540, 36, 792, {
    reportMode: 'entries-only', entryRevisionsByEntryId: { 'entry-1': [revision] }
  })
  return { doc, text, line, endY }
}

describe('PDF edit history rendering', () => {
  it('prints an unchanged paragraph once and labels its addition without a strikeout', () => {
    const original = 'My back hurt while I was sitting at work.'
    const { text, line } = renderRevision(original, `${original}\n\nI will try a different chair.`)
    const labels = text.mock.calls.map(call => call[0])
    expect(labels.filter(value => value === original)).toHaveLength(1)
    expect(labels.some(value => typeof value === 'string' && value.startsWith('Added text'))).toBe(true)
    // Horizontal section dividers are the only lines when nothing was removed.
    expect(line.mock.calls.every(([x1, , x2]) => Math.abs(x2 - x1) >= 500)).toBe(true)
  })

  it('strikes only a replaced word rather than the whole sentence', () => {
    const { doc, text, line } = renderRevision('The pain lasted two hours.', 'The pain lasted three hours.')
    const oldWord = text.mock.calls.find(call => call[0] === 'two')!
    expect(oldWord).toBeDefined()
    expect(text.mock.calls.some(call => call[0] === 'The pain lasted two hours.')).toBe(false)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const strike = line.mock.calls.find(([x1, y1]) => x1 === oldWord[1] && y1 === Number(oldWord[2]) - 11 * 0.35)!
    expect(strike).toBeDefined()
    expect(strike[2] - strike[0]).toBeCloseTo(doc.getTextWidth('two'))
  })

  it('wraps additions and edits within the card and keeps all text above the footer', () => {
    const original = 'Sitting at my desk caused pain and made concentrating difficult. '.repeat(6).trim()
    const { text, endY } = renderRevision(original, `${original.replace('pain', 'discomfort')}\n\nI took several short breaks.`)
    expect(endY).toBeLessThan(744)
    expect(text.mock.calls.every(([, , y]) => Number(y) < 744)).toBe(true)
    expect(text.mock.calls.some(call => call[0] === 'pain')).toBe(true)
  })
})
