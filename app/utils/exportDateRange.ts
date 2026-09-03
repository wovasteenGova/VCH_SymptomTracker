export type ExportPeriodPreset = 'full' | 'since-last-va' | 'custom'

export type ExportDateRange = {
  preset: ExportPeriodPreset
  startDate: string | null
  endDate: string | null
}

export type ExportEntryLike = {
  occurred_at?: string | null
  created_at?: string | null
}

const CUTOFF_STORAGE_PREFIX = 'vch_tracker_va_export_cutoff_'
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function formatCalendarDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

export function getTodayCalendarDateString() {
  return formatCalendarDate(new Date())
}

export function isValidCalendarDateString(value: string | null | undefined) {
  return Boolean(value && CALENDAR_DATE_PATTERN.test(value))
}

export function getEntryCalendarDate(entry: ExportEntryLike) {
  const raw = entry.occurred_at || entry.created_at
  if (!raw) {
    return ''
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return formatCalendarDate(parsed)
}

export function addCalendarDays(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return formatCalendarDate(date)
}

export function isDateInRange(
  dateStr: string,
  startDate: string | null,
  endDate: string | null
) {
  if (!dateStr) {
    return false
  }

  if (startDate && dateStr < startDate) {
    return false
  }

  if (endDate && dateStr > endDate) {
    return false
  }

  return true
}

export function filterEntriesByDateRange<T extends ExportEntryLike>(
  entries: T[],
  range: Pick<ExportDateRange, 'startDate' | 'endDate'>
) {
  if (!range.startDate && !range.endDate) {
    return entries
  }

  return entries.filter((entry) => {
    const dateStr = getEntryCalendarDate(entry)
    return isDateInRange(dateStr, range.startDate, range.endDate)
  })
}

export function resolveExportDateRange(options: {
  preset: ExportPeriodPreset
  customStartDate?: string | null
  customEndDate?: string | null
  lastVaSubmissionEndDate?: string | null
}): ExportDateRange {
  const today = getTodayCalendarDateString()

  if (options.preset === 'full') {
    return {
      preset: 'full',
      startDate: null,
      endDate: null
    }
  }

  if (options.preset === 'since-last-va') {
    const cutoff = isValidCalendarDateString(options.lastVaSubmissionEndDate)
      ? options.lastVaSubmissionEndDate!
      : null

    return {
      preset: 'since-last-va',
      startDate: cutoff ? addCalendarDays(cutoff, 1) : null,
      endDate: today
    }
  }

  const startDate = isValidCalendarDateString(options.customStartDate)
    ? options.customStartDate!
    : null
  const endDate = isValidCalendarDateString(options.customEndDate)
    ? options.customEndDate!
    : today

  return {
    preset: 'custom',
    startDate,
    endDate
  }
}

export function formatReportingPeriodLabel(
  startDate: string | null,
  endDate: string | null
) {
  if (!startDate && !endDate) {
    return null
  }

  const formatDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (startDate && endDate) {
    if (startDate === endDate) {
      return formatDate(startDate)
    }

    return `${formatDate(startDate)} – ${formatDate(endDate)}`
  }

  if (startDate) {
    return `From ${formatDate(startDate)}`
  }

  return `Through ${formatDate(endDate!)}`
}

export function computeRangeEndFromEntries<T extends ExportEntryLike>(
  entries: T[],
  fallbackEndDate: string | null
) {
  let maxDate = isValidCalendarDateString(fallbackEndDate)
    ? fallbackEndDate!
    : getTodayCalendarDateString()

  for (const entry of entries) {
    const entryDate = getEntryCalendarDate(entry)
    if (entryDate && entryDate > maxDate) {
      maxDate = entryDate
    }
  }

  return maxDate
}

export function loadVaExportCutoff(userId: string | null | undefined) {
  if (!import.meta.client || !userId) {
    return null
  }

  try {
    const raw = localStorage.getItem(`${CUTOFF_STORAGE_PREFIX}${userId}`)
    return isValidCalendarDateString(raw) ? raw : null
  } catch {
    return null
  }
}

export function saveVaExportCutoff(userId: string, endDate: string) {
  if (!import.meta.client || !isValidCalendarDateString(endDate)) {
    return
  }

  try {
    localStorage.setItem(`${CUTOFF_STORAGE_PREFIX}${userId}`, endDate)
  } catch {
    // Ignore storage failures — export still succeeds.
  }
}

export function buildReportingPeriodSlug(
  startDate: string | null,
  endDate: string | null
) {
  if (!startDate && !endDate) {
    return null
  }

  if (startDate && endDate) {
    return `${startDate}_to_${endDate}`
  }

  if (startDate) {
    return `${startDate}_onward`
  }

  return `through_${endDate}`
}

export function isExportDateRangeValid(
  preset: ExportPeriodPreset,
  options: {
    customStartDate?: string | null
    customEndDate?: string | null
    lastVaSubmissionEndDate?: string | null
  }
) {
  if (preset === 'full') {
    return true
  }

  if (preset === 'since-last-va') {
    return isValidCalendarDateString(options.lastVaSubmissionEndDate)
  }

  if (!isValidCalendarDateString(options.customStartDate)) {
    return false
  }

  if (
    isValidCalendarDateString(options.customEndDate)
    && options.customStartDate!
    > options.customEndDate!
  ) {
    return false
  }

  return true
}
