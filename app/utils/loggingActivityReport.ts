import { normalizeConditionLabel } from './conditionCatalog'

type LoggingEntry = {
  condition_label: string
  occurred_at?: string | null
  created_at?: string | null
}

export type LoggingActivityMetrics = {
  monthLabel: string
  year: number
  month: number
  daysInMonth: number
  totalLogs: number
  conditionCount: number
  conditionBreakdown: Array<{ label: string, count: number }>
  extraConditionCount: number
  weeklyBreakdown: Array<{ label: string, count: number }>
  dailyCounts: number[]
  mondayOffset: number
}

const MAX_VISIBLE_CONDITIONS = 5

function getEntryDate(entry: LoggingEntry) {
  return new Date(entry.occurred_at || entry.created_at || 0)
}

function isValidEntryDate(date: Date) {
  return !Number.isNaN(date.getTime())
}

function filterEntriesForMonth(entries: LoggingEntry[], year: number, month: number) {
  return entries.filter((entry) => {
    const entryDate = getEntryDate(entry)
    if (!isValidEntryDate(entryDate)) {
      return false
    }

    return entryDate.getFullYear() === year && entryDate.getMonth() === month
  })
}

function buildWeeklyBreakdown(monthEntries: LoggingEntry[], year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekCount = Math.ceil(daysInMonth / 7)

  return Array.from({ length: weekCount }, (_, index) => {
    const startDay = index * 7 + 1
    const endDay = Math.min(startDay + 6, daysInMonth)
    const count = monthEntries.filter((entry) => {
      const day = getEntryDate(entry).getDate()
      return day >= startDay && day <= endDay
    }).length

    return {
      label: `Week ${index + 1} (${startDay}-${endDay})`,
      count
    }
  })
}

export function buildLoggingActivityMetrics(
  entries: LoggingEntry[],
  year: number,
  month: number
): LoggingActivityMetrics {
  const monthEntries = filterEntriesForMonth(entries, year, month)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1

  const byCondition = new Map<string, number>()
  monthEntries.forEach((entry) => {
    const label = normalizeConditionLabel(entry.condition_label)
    byCondition.set(label, (byCondition.get(label) || 0) + 1)
  })

  const sortedConditions = [...byCondition.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, count]) => ({ label, count }))

  const dailyCounts = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    return monthEntries.filter((entry) => getEntryDate(entry).getDate() === day).length
  })

  return {
    monthLabel: new Date(year, month, 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    }),
    year,
    month,
    daysInMonth,
    totalLogs: monthEntries.length,
    conditionCount: byCondition.size,
    conditionBreakdown: sortedConditions.slice(0, MAX_VISIBLE_CONDITIONS),
    extraConditionCount: Math.max(0, sortedConditions.length - MAX_VISIBLE_CONDITIONS),
    weeklyBreakdown: buildWeeklyBreakdown(monthEntries, year, month),
    dailyCounts,
    mondayOffset
  }
}

export function buildAllMonthMetrics(
  entries: LoggingEntry[]
): LoggingActivityMetrics[] {
  const monthSet = new Set<string>()

  for (const entry of entries) {
    const date = getEntryDate(entry)
    if (!isValidEntryDate(date)) {
      continue
    }

    monthSet.add(`${date.getFullYear()}-${date.getMonth()}`)
  }

  return [...monthSet]
    .map((key) => {
      const [year, month] = key.split('-').map(Number)
      return buildLoggingActivityMetrics(entries, year, month)
    })
    .filter((metrics) => metrics.totalLogs > 0)
    .sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year
      }

      return a.month - b.month
    })
}

export type ConditionWeeklyFrequencyGroup = {
  conditionLabel: string
  rows: Array<{
    year: number
    month: number
    weeklyBreakdown: Array<{ label: string, count: number }>
    totalLogs: number
  }>
}

export function buildConditionWeeklyFrequencyGroups(
  entries: LoggingEntry[]
): ConditionWeeklyFrequencyGroup[] {
  const byConditionMonth = new Map<string, LoggingEntry[]>()

  for (const entry of entries) {
    const date = getEntryDate(entry)
    if (!isValidEntryDate(date)) {
      continue
    }

    const conditionLabel = normalizeConditionLabel(entry.condition_label)
    const monthKey = `${conditionLabel}\0${date.getFullYear()}-${date.getMonth()}`
    const bucket = byConditionMonth.get(monthKey) || []
    bucket.push(entry)
    byConditionMonth.set(monthKey, bucket)
  }

  const byCondition = new Map<string, ConditionWeeklyFrequencyGroup['rows']>()
  const conditionTotals = new Map<string, number>()

  for (const [key, monthEntries] of byConditionMonth.entries()) {
    const separatorIndex = key.indexOf('\0')
    const conditionLabel = key.slice(0, separatorIndex)
    const [year, month] = key.slice(separatorIndex + 1).split('-').map(Number)

    const row = {
      year,
      month,
      weeklyBreakdown: buildWeeklyBreakdown(monthEntries, year, month),
      totalLogs: monthEntries.length
    }

    const rows = byCondition.get(conditionLabel) || []
    rows.push(row)
    byCondition.set(conditionLabel, rows)
    conditionTotals.set(conditionLabel, (conditionTotals.get(conditionLabel) || 0) + monthEntries.length)
  }

  return [...byCondition.entries()]
    .sort((left, right) => (conditionTotals.get(right[0]) || 0) - (conditionTotals.get(left[0]) || 0))
    .map(([conditionLabel, rows]) => ({
      conditionLabel,
      rows: rows.sort((left, right) => {
        if (left.year !== right.year) {
          return left.year - right.year
        }

        return left.month - right.month
      })
    }))
}

export type AggregateLoggingMetrics = {
  rangeLabel: string
  totalLogs: number
  conditionCount: number
  conditionBreakdown: Array<{ label: string, count: number }>
  extraConditionCount: number
  monthCount: number
}

export function buildAggregateLoggingMetrics(entries: LoggingEntry[]): AggregateLoggingMetrics {
  const valid = entries.filter((entry) => {
    const date = getEntryDate(entry)
    return isValidEntryDate(date)
  })

  const byCondition = new Map<string, number>()
  const monthSet = new Set<string>()
  let earliest: Date | null = null
  let latest: Date | null = null

  for (const entry of valid) {
    const label = normalizeConditionLabel(entry.condition_label)
    byCondition.set(label, (byCondition.get(label) || 0) + 1)

    const date = getEntryDate(entry)
    monthSet.add(`${date.getFullYear()}-${date.getMonth()}`)

    if (!earliest || date < earliest) {
      earliest = date
    }

    if (!latest || date > latest) {
      latest = date
    }
  }

  const sortedConditions = [...byCondition.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, count]) => ({ label, count }))

  let rangeLabel = 'N/A'

  if (earliest && latest) {
    const sameMonth = earliest.getFullYear() === latest.getFullYear()
      && earliest.getMonth() === latest.getMonth()

    if (sameMonth) {
      rangeLabel = earliest.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    } else {
      const firstLabel = earliest.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      const lastLabel = latest.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      rangeLabel = `${firstLabel} – ${lastLabel}`
    }
  }

  return {
    rangeLabel,
    totalLogs: valid.length,
    conditionCount: byCondition.size,
    conditionBreakdown: sortedConditions.slice(0, MAX_VISIBLE_CONDITIONS),
    extraConditionCount: Math.max(0, sortedConditions.length - MAX_VISIBLE_CONDITIONS),
    monthCount: monthSet.size
  }
}

export function formatLoggingActivitySummary(metrics: LoggingActivityMetrics) {
  const logLabel = metrics.totalLogs === 1 ? 'symptom log' : 'symptom logs'
  const conditionLabel = metrics.conditionCount === 1 ? 'condition' : 'conditions'

  if (!metrics.totalLogs) {
    return `No symptom logs recorded in ${metrics.monthLabel}.`
  }

  return `${metrics.totalLogs} ${logLabel} this month · ${metrics.conditionCount} ${conditionLabel} tracked`
}

export function formatAggregateLoggingSummary(metrics: AggregateLoggingMetrics) {
  const logLabel = metrics.totalLogs === 1 ? 'symptom log' : 'symptom logs'
  const conditionLabel = metrics.conditionCount === 1 ? 'condition' : 'conditions'

  if (!metrics.totalLogs) {
    return 'No symptom logs recorded.'
  }

  if (metrics.monthCount <= 1) {
    return `${metrics.totalLogs} ${logLabel} · ${metrics.conditionCount} ${conditionLabel} tracked`
  }

  return `${metrics.totalLogs} ${logLabel} across ${metrics.monthCount} months · ${metrics.conditionCount} ${conditionLabel} tracked`
}
