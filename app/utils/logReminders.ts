import type { LoggingCadence } from './loggingCadence'
import { getWeeklyLogDayLabel } from './loggingCadence'

export const LOG_REMINDERS_ENABLED_KEY = 'symptom-tracker-log-reminders-enabled'
export const LOG_REMINDER_HOUR_KEY = 'symptom-tracker-log-reminder-hour'
export const LOG_REMINDER_TIMEZONE_KEY = 'symptom-tracker-log-reminder-timezone'
export const LOG_REMINDER_SENT_PREFIX = 'symptom-tracker-log-reminder-sent:'
export const DEFAULT_LOG_REMINDER_HOUR = 10
export const DEFAULT_LOG_REMINDER_EVENING_HOUR = 20
export const FALLBACK_REMINDER_TIMEZONE = 'America/Chicago'

/** Temporary test hook: keep false in production. */
export const LOG_REMINDER_TEST_MODE = false
export const LOG_REMINDER_TEST_INTERVAL_MS = 2 * 60 * 1000
export const LOG_REMINDER_TEST_TITLE = 'VCH is testing app notification'
export const LOG_REMINDER_TEST_BODY = 'We should be done soon'

export type LogReminderKind =
  | 'daily-morning'
  | 'daily-evening'
  | 'weekly-eve'
  | 'weekly-day'
  | 'weekly-followup'

export type LogReminderPayload = {
  kind: LogReminderKind
  title: string
  body: string
  dedupeKey: string
}

export type SymptomEntryLike = {
  occurred_at?: string | null
  created_at?: string | null
}

export type LogReminderSettings = {
  enabled: boolean
  hour: number
  eveningHour: number
  timezone: string
}

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
}

export const LOG_REMINDER_HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
  .map((hour) => ({
    value: hour,
    label: formatLogReminderHour(hour)
  }))

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function getBrowserTimezone() {
  if (!import.meta.client) {
    return FALLBACK_REMINDER_TIMEZONE
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_REMINDER_TIMEZONE
}

export function resolveReminderTimezone(timeZone?: string | null) {
  const normalized = String(timeZone || '').trim()

  if (!normalized) {
    return import.meta.client ? getBrowserTimezone() : FALLBACK_REMINDER_TIMEZONE
  }

  try {
    Intl.DateTimeFormat('en-US', { timeZone: normalized })
    return normalized
  } catch {
    return import.meta.client ? getBrowserTimezone() : FALLBACK_REMINDER_TIMEZONE
  }
}

export function getZonedDateParts(date: Date, timeZone: string) {
  const resolvedTimeZone = resolveReminderTimezone(timeZone)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: resolvedTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    weekday: 'short'
  })
  const parts = formatter.formatToParts(date)
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    year: Number(lookup('year')),
    month: Number(lookup('month')),
    day: Number(lookup('day')),
    hour: Number(lookup('hour')),
    dayOfWeek: WEEKDAY_TO_INDEX[lookup('weekday')] ?? 0
  }
}

export function getLocalDateKey(date = new Date(), timeZone?: string) {
  if (!timeZone) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  const parts = getZonedDateParts(date, timeZone)

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export function getLocalDateKeyInTimezone(date: Date, timeZone: string) {
  return getLocalDateKey(date, timeZone)
}

export function getLocalDayOfWeekInTimezone(date: Date, timeZone: string) {
  return getZonedDateParts(date, timeZone).dayOfWeek
}

function subtractCalendarDays(year: number, month: number, day: number, days: number) {
  const cursor = new Date(Date.UTC(year, month - 1, day))
  cursor.setUTCDate(cursor.getUTCDate() - days)

  return {
    year: cursor.getUTCFullYear(),
    month: cursor.getUTCMonth() + 1,
    day: cursor.getUTCDate()
  }
}

export function readLogRemindersEnabled() {
  if (!import.meta.client) {
    return false
  }

  return window.localStorage.getItem(LOG_REMINDERS_ENABLED_KEY) === '1'
}

export function writeLogRemindersEnabled(enabled: boolean) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(LOG_REMINDERS_ENABLED_KEY, enabled ? '1' : '0')
}

export function readLogReminderHour() {
  if (!import.meta.client) {
    return DEFAULT_LOG_REMINDER_HOUR
  }

  const parsed = Number(window.localStorage.getItem(LOG_REMINDER_HOUR_KEY))

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 23) {
    return DEFAULT_LOG_REMINDER_HOUR
  }

  return parsed
}

export function writeLogReminderHour(hour: number) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(LOG_REMINDER_HOUR_KEY, String(Math.min(23, Math.max(0, hour))))
}

export function readLogReminderTimezone() {
  if (!import.meta.client) {
    return FALLBACK_REMINDER_TIMEZONE
  }

  return resolveReminderTimezone(window.localStorage.getItem(LOG_REMINDER_TIMEZONE_KEY))
}

export function writeLogReminderTimezone(timeZone: string) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(
    LOG_REMINDER_TIMEZONE_KEY,
    resolveReminderTimezone(timeZone)
  )
}

export function wasReminderSent(dedupeKey: string) {
  if (!import.meta.client) {
    return false
  }

  return window.localStorage.getItem(`${LOG_REMINDER_SENT_PREFIX}${dedupeKey}`) === '1'
}

export function markReminderSent(dedupeKey: string) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(`${LOG_REMINDER_SENT_PREFIX}${dedupeKey}`, '1')
}

function entryTimestamp(entry: SymptomEntryLike) {
  const raw = entry.occurred_at || entry.created_at

  if (!raw) {
    return null
  }

  const parsed = new Date(raw)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function hasLoggedToday(
  entries: SymptomEntryLike[],
  now = new Date(),
  timeZone?: string
) {
  const todayKey = getLocalDateKey(now, timeZone)

  return entries.some((entry) => {
    const timestamp = entryTimestamp(entry)

    if (!timestamp) {
      return false
    }

    return getLocalDateKey(timestamp, timeZone) === todayKey
  })
}

function getCurrentLogWeekStartKey(weeklyLogDay: number, timeZone: string, now = new Date()) {
  const parts = getZonedDateParts(now, timeZone)
  const diff = (parts.dayOfWeek - weeklyLogDay + 7) % 7
  const start = subtractCalendarDays(parts.year, parts.month, parts.day, diff)

  return `${start.year}-${pad(start.month)}-${pad(start.day)}`
}

export function hasLoggedThisLogWeek(
  entries: SymptomEntryLike[],
  weeklyLogDay: number,
  now = new Date(),
  timeZone?: string
) {
  const resolvedTimeZone = resolveReminderTimezone(timeZone)
  const weekStartKey = getCurrentLogWeekStartKey(weeklyLogDay, resolvedTimeZone, now)

  return entries.some((entry) => {
    const timestamp = entryTimestamp(entry)

    if (!timestamp) {
      return false
    }

    return getLocalDateKeyInTimezone(timestamp, resolvedTimeZone) >= weekStartKey
  })
}

export function isReminderHourMatch(
  reminderHour: number,
  now = new Date(),
  timeZone?: string
) {
  const hour = timeZone
    ? getZonedDateParts(now, resolveReminderTimezone(timeZone)).hour
    : now.getHours()

  return hour === reminderHour
}

export function buildLogReminderPayloads(input: {
  cadence: LoggingCadence
  weeklyLogDay: number
  entries: SymptomEntryLike[]
  reminderHour?: number
  reminderEveningHour?: number
  timeZone?: string
  now?: Date
}): LogReminderPayload[] {
  const now = input.now ?? new Date()

  if (LOG_REMINDER_TEST_MODE) {
    const bucket = Math.floor(now.getTime() / LOG_REMINDER_TEST_INTERVAL_MS)

    return [{
      kind: 'daily-morning',
      title: LOG_REMINDER_TEST_TITLE,
      body: LOG_REMINDER_TEST_BODY,
      dedupeKey: `test-notification:${bucket}`
    }]
  }

  const reminderHour = input.reminderHour ?? DEFAULT_LOG_REMINDER_HOUR
  const reminderEveningHour = input.reminderEveningHour ?? DEFAULT_LOG_REMINDER_EVENING_HOUR
  const timeZone = resolveReminderTimezone(input.timeZone)
  const payloads: LogReminderPayload[] = []
  const dateKey = getLocalDateKeyInTimezone(now, timeZone)

  if (input.cadence === 'daily') {
    if (hasLoggedToday(input.entries, now, timeZone)) {
      return payloads
    }

    if (isReminderHourMatch(reminderHour, now, timeZone)) {
      payloads.push({
        kind: 'daily-morning',
        title: 'VCH: Time to log symptoms',
        body: 'Add a quick entry while today is still fresh.',
        dedupeKey: `daily-morning:${dateKey}`
      })
    }

    if (isReminderHourMatch(reminderEveningHour, now, timeZone)) {
      payloads.push({
        kind: 'daily-evening',
        title: 'VCH: Evening log reminder',
        body: 'You have not logged today yet. Add a quick entry before the day ends.',
        dedupeKey: `daily-evening:${dateKey}`
      })
    }

    return payloads
  }

  if (!isReminderHourMatch(reminderHour, now, timeZone)) {
    return payloads
  }

  const logDayLabel = getWeeklyLogDayLabel(input.weeklyLogDay)
  const today = getLocalDayOfWeekInTimezone(now, timeZone)
  const dayBefore = (input.weeklyLogDay + 6) % 7
  const dayAfter = (input.weeklyLogDay + 1) % 7
  const loggedThisWeek = hasLoggedThisLogWeek(input.entries, input.weeklyLogDay, now, timeZone)

  if (today === dayBefore) {
    payloads.push({
      kind: 'weekly-eve',
      title: 'VCH: Log day is tomorrow',
      body: `You chose ${logDayLabel}s for weekly logging. Plan a few minutes tomorrow to capture the week.`,
      dedupeKey: `weekly-eve:${dateKey}`
    })
  }

  if (today === input.weeklyLogDay && !loggedThisWeek) {
    payloads.push({
      kind: 'weekly-day',
      title: 'VCH: Today is your log day',
      body: `It is ${logDayLabel}. Log once and capture the week together.`,
      dedupeKey: `weekly-day:${dateKey}`
    })
  }

  if (today === dayAfter && !loggedThisWeek) {
    payloads.push({
      kind: 'weekly-followup',
      title: 'VCH: Catch up on your weekly log',
      body: `You planned to log on ${logDayLabel}. Add an entry when you can while the week is still fresh.`,
      dedupeKey: `weekly-followup:${dateKey}`
    })
  }

  return payloads
}

export function formatLogReminderHour(hour = DEFAULT_LOG_REMINDER_HOUR) {
  const normalized = Math.min(23, Math.max(0, hour))
  const period = normalized >= 12 ? 'PM' : 'AM'
  const displayHour = normalized % 12 || 12

  return `${displayHour} ${period}`
}

export function formatTimezoneLabel(timeZone: string) {
  const resolvedTimeZone = resolveReminderTimezone(timeZone)

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: resolvedTimeZone,
      timeZoneName: 'short'
    }).formatToParts(new Date())
    const shortName = parts.find((part) => part.type === 'timeZoneName')?.value

    if (shortName) {
      return shortName
    }
  } catch {
    // Fall through to raw zone name.
  }

  return resolvedTimeZone.replace(/_/g, ' ')
}

export function describeLogReminderSchedule(
  cadence: LoggingCadence,
  weeklyLogDay: number,
  reminderHour = DEFAULT_LOG_REMINDER_HOUR,
  timeZone?: string,
  reminderEveningHour = DEFAULT_LOG_REMINDER_EVENING_HOUR
) {
  const timeLabel = formatLogReminderHour(reminderHour)
  const eveningLabel = formatLogReminderHour(reminderEveningHour)
  const zoneLabel = formatTimezoneLabel(resolveReminderTimezone(timeZone))

  if (cadence === 'daily') {
    return `Reminders at ${timeLabel} and ${eveningLabel} (${zoneLabel}) if you have not logged yet.`
  }

  const logDayLabel = getWeeklyLogDayLabel(weeklyLogDay)

  return `Reminders around ${logDayLabel}: day before, on ${logDayLabel}, and the day after: each at ${timeLabel} (${zoneLabel}).`
}

export function defaultLogReminderSettings(): LogReminderSettings {
  return {
    enabled: true,
    hour: DEFAULT_LOG_REMINDER_HOUR,
    eveningHour: DEFAULT_LOG_REMINDER_EVENING_HOUR,
    timezone: getBrowserTimezone()
  }
}
