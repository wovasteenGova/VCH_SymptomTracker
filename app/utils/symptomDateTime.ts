import {
  CalendarDate,
  Time,
  fromDate,
  getLocalTimeZone,
  now,
  today,
  toCalendarDateTime
} from '@internationalized/date'

export function getTodayCalendarDate() {
  return today(getLocalTimeZone())
}

export function isCalendarDateBeforeToday(calendarDate: CalendarDate) {
  return calendarDate.compare(getTodayCalendarDate()) < 0
}

export function getMinEntryCalendarDate() {
  return getTodayCalendarDate().subtract({ years: 50 })
}

export function getNowTime() {
  const current = now(getLocalTimeZone())
  return new Time(current.hour, current.minute)
}

export function partsToLocalDateTimeString(calendarDate: CalendarDate, time: Time) {
  const year = calendarDate.year
  const month = String(calendarDate.month).padStart(2, '0')
  const day = String(calendarDate.day).padStart(2, '0')
  const hour = String(time.hour).padStart(2, '0')
  const minute = String(time.minute).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}`
}

export function localDateTimeStringToParts(value: string) {
  const normalized = value || getMaxEntryDateTimeLocal()
  const [datePart, timePart = '12:00'] = normalized.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  return {
    calendarDate: new CalendarDate(year, month, day),
    time: new Time(hour, minute)
  }
}

function entryDateTimeFromParts(calendarDate: CalendarDate, time: Time) {
  return toCalendarDateTime(calendarDate, time, getLocalTimeZone())
}

export function getMinEntryDateLocal() {
  const min = getMinEntryCalendarDate()
  const month = String(min.month).padStart(2, '0')
  const day = String(min.day).padStart(2, '0')
  return `${min.year}-${month}-${day}`
}

export function dateStringToCalendarDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)
  return new CalendarDate(year, month, day)
}

export function calendarDateToDateString(calendarDate: CalendarDate) {
  return calendarDate.toString()
}

export function coerceCalendarDate(value: unknown): CalendarDate | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const candidate = value as { year?: number, month?: number, day?: number }

  if (
    typeof candidate.year === 'number'
    && typeof candidate.month === 'number'
    && typeof candidate.day === 'number'
  ) {
    return value instanceof CalendarDate
      ? value
      : new CalendarDate(candidate.year, candidate.month, candidate.day)
  }

  return undefined
}

export function formatPartsToTime24(
  hour12: string | number,
  minute: string | number,
  period: 'AM' | 'PM'
) {
  let hour = Number(hour12)

  if (Number.isNaN(hour) || hour < 1 || hour > 12) {
    hour = 12
  }

  const minuteNum = Number(minute)
  const minuteValue = String(
    Number.isNaN(minuteNum) ? 0 : Math.min(59, Math.max(0, minuteNum))
  ).padStart(2, '0')

  if (period === 'AM') {
    if (hour === 12) {
      hour = 0
    }
  } else if (hour !== 12) {
    hour += 12
  }

  return `${String(hour).padStart(2, '0')}:${minuteValue}`
}

export function parseTime24ToParts(time24: string) {
  const [hour24Raw = '12', minuteRaw = '0'] = (time24 || '12:00').split(':')
  let hour24 = Number(hour24Raw)

  if (Number.isNaN(hour24)) {
    hour24 = 0
  }

  const minuteNum = Number(minuteRaw)
  const minute = String(Number.isNaN(minuteNum) ? 0 : minuteNum).padStart(2, '0')
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'
  let hour12 = hour24 % 12

  if (hour12 === 0) {
    hour12 = 12
  }

  return {
    hour12: String(hour12),
    minute,
    period
  }
}

export function clampTime24ToMax(time24: string, maxTime24: string) {
  return time24 > maxTime24 ? maxTime24 : time24
}

export function mergeEntryDateAndTime(dateValue: string, timeValue: string) {
  return clampEntryDateTime(`${dateValue}T${timeValue}`)
}

export function splitEntryDateTimeLocal(value: string) {
  const normalized = clampEntryDateTime(value || getMaxEntryDateTimeLocal())
  return {
    date: normalized.slice(0, 10),
    time: normalized.slice(11, 16)
  }
}

export function getMaxEntryDateTimeLocal() {
  const current = now(getLocalTimeZone())
  return partsToLocalDateTimeString(
    new CalendarDate(current.year, current.month, current.day),
    new Time(current.hour, current.minute)
  )
}

export function getMaxEntryDateLocal() {
  return getMaxEntryDateTimeLocal().slice(0, 10)
}

export function getMaxEntryTimeLocal(dateValue: string) {
  const todayStr = calendarDateToDateString(getTodayCalendarDate())

  if (dateValue === todayStr) {
    return getMaxEntryDateTimeLocal().slice(11, 16)
  }

  return '23:59'
}

export function getMaxEntryTimeForCalendarDate(calendarDate: CalendarDate) {
  if (calendarDate.compare(getTodayCalendarDate()) === 0) {
    return getNowTime()
  }

  return new Time(23, 59)
}

export function toLocalDateTimeInputValue(date = new Date()) {
  const zoned = fromDate(date, getLocalTimeZone())
  return partsToLocalDateTimeString(
    new CalendarDate(zoned.year, zoned.month, zoned.day),
    new Time(zoned.hour, zoned.minute)
  )
}

export function clampEntryDateTime(value: string) {
  if (!value) {
    return getMaxEntryDateTimeLocal()
  }

  const { calendarDate, time } = localDateTimeStringToParts(value)
  const selected = entryDateTimeFromParts(calendarDate, time)

  if (selected.compare(now(getLocalTimeZone())) > 0) {
    return getMaxEntryDateTimeLocal()
  }

  return value
}

export function isFutureEntryDateTime(value: string) {
  if (!value) {
    return false
  }

  const { calendarDate, time } = localDateTimeStringToParts(value)
  const selected = entryDateTimeFromParts(calendarDate, time)
  return selected.compare(now(getLocalTimeZone())) > 0
}

export function formatEntryDateTimePreview(value: string) {
  if (!value) {
    return 'Select when this happened'
  }

  const { calendarDate, time } = localDateTimeStringToParts(value)
  const date = new Date(
    calendarDate.year,
    calendarDate.month - 1,
    calendarDate.day,
    time.hour,
    time.minute
  )

  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatEntryDateTimeForDisplay(value: string | null | undefined) {
  if (!value) {
    return 'Not recorded'
  }

  const { calendarDate, time } = localDateTimeStringToParts(value)
  const date = new Date(
    calendarDate.year,
    calendarDate.month - 1,
    calendarDate.day,
    time.hour,
    time.minute
  )

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
