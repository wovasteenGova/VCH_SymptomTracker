import { describe, expect, it } from 'vitest'
import { CalendarDate } from '@internationalized/date'
import {
  coerceCalendarDate,
  getTodayCalendarDate
} from '../app/utils/symptomDateTime'

describe('coerceCalendarDate', () => {
  it('returns undefined for nullish values', () => {
    expect(coerceCalendarDate(null)).toBeUndefined()
    expect(coerceCalendarDate(undefined)).toBeUndefined()
  })

  it('parses plain date objects and CalendarDate instances', () => {
    const plain = { year: 2024, month: 3, day: 15 }
    const parsed = coerceCalendarDate(plain)

    expect(parsed).toBeInstanceOf(CalendarDate)
    expect(parsed?.year).toBe(2024)
    expect(parsed?.month).toBe(3)
    expect(parsed?.day).toBe(15)

    const calendarDate = new CalendarDate(2025, 1, 2)
    expect(coerceCalendarDate(calendarDate)).toBe(calendarDate)
  })

  it('falls back to today when coercing invalid values in UI helpers', () => {
    const fallback = coerceCalendarDate(null) ?? getTodayCalendarDate()
    expect(fallback.year).toBeGreaterThan(2000)
    expect(fallback.month).toBeGreaterThanOrEqual(1)
    expect(fallback.day).toBeGreaterThanOrEqual(1)
  })
})
