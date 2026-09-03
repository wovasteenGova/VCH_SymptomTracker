import { describe, expect, it } from 'vitest'
import {
  addCalendarDays,
  computeRangeEndFromEntries,
  filterEntriesByDateRange,
  formatReportingPeriodLabel,
  getEntryCalendarDate,
  isExportDateRangeValid,
  resolveExportDateRange
} from '../app/utils/exportDateRange'

describe('exportDateRange', () => {
  it('filters entries by inclusive calendar dates', () => {
    const entries = [
      { occurred_at: '2025-01-10T12:00:00.000Z', created_at: null },
      { occurred_at: '2025-03-15T12:00:00.000Z', created_at: null },
      { occurred_at: '2025-06-01T12:00:00.000Z', created_at: null }
    ]

    const filtered = filterEntriesByDateRange(entries, {
      startDate: '2025-03-01',
      endDate: '2025-05-31'
    })

    expect(filtered).toHaveLength(1)
    expect(getEntryCalendarDate(filtered[0]!)).toBe('2025-03-15')
  })

  it('builds since-last-va ranges from the day after the cutoff', () => {
    const range = resolveExportDateRange({
      preset: 'since-last-va',
      lastVaSubmissionEndDate: '2025-03-15'
    })

    expect(range.startDate).toBe('2025-03-16')
    expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('formats reporting period labels for PDF headers', () => {
    expect(formatReportingPeriodLabel('2025-03-16', '2026-09-02')).toBe('Mar 16, 2025 – Sep 2, 2026')
    expect(formatReportingPeriodLabel(null, null)).toBeNull()
  })

  it('uses the latest entry date when saving a VA cutoff', () => {
    const endDate = computeRangeEndFromEntries([
      { occurred_at: '2025-04-01T08:00:00.000Z', created_at: null },
      { occurred_at: '2025-06-12T08:00:00.000Z', created_at: null }
    ], '2025-05-01')

    expect(endDate).toBe('2025-06-12')
  })

  it('validates increase export requirements', () => {
    expect(isExportDateRangeValid('since-last-va', {
      lastVaSubmissionEndDate: '2025-01-01'
    })).toBe(true)

    expect(isExportDateRangeValid('since-last-va', {
      lastVaSubmissionEndDate: null
    })).toBe(false)

    expect(isExportDateRangeValid('custom', {
      customStartDate: '2025-06-01',
      customEndDate: '2025-05-01'
    })).toBe(false)
  })

  it('adds calendar days without timezone drift', () => {
    expect(addCalendarDays('2025-12-31', 1)).toBe('2026-01-01')
  })
})
