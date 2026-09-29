import { describe, expect, it } from 'vitest'
import {
  formatProAccessUntilDate,
  resolveDisplayedProAccessUntilIso
} from '../shared/proAccessUntil'

describe('proAccessUntil', () => {
  it('prefers current_period_end over founding grant until', () => {
    expect(resolveDisplayedProAccessUntilIso({
      currentPeriodEnd: '2027-09-29T00:00:00.000Z',
      foundingProUntil: '2027-02-21T00:00:00.000Z'
    })).toBe('2027-09-29T00:00:00.000Z')
  })

  it('falls back to founding until when period end is missing', () => {
    expect(resolveDisplayedProAccessUntilIso({
      currentPeriodEnd: null,
      foundingProUntil: '2027-02-21T00:00:00.000Z'
    })).toBe('2027-02-21T00:00:00.000Z')
  })

  it('formats Access until without shifting the UTC calendar day', () => {
    expect(formatProAccessUntilDate('2027-09-29T00:00:00.000Z', 'en-US')).toBe('Sep 29, 2027')
  })
})
