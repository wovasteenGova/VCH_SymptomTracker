export type LoggingCadence = 'daily' | 'weekly'

export const LOGGING_CADENCE_STORAGE_KEY = 'symptom-tracker-logging-cadence'
export const WEEKLY_LOG_DAY_STORAGE_KEY = 'symptom-tracker-weekly-log-day'
export const APP_WELCOME_COMPLETED_STORAGE_KEY = 'symptom-tracker-app-welcome-completed'
export const APP_WELCOME_STEP_STORAGE_KEY = 'symptom-tracker-app-welcome-step'
export const TERMS_ACCEPTED_AT_STORAGE_KEY = 'symptom-tracker-terms-accepted-at'

export function readAppWelcomeStep() {
  if (!import.meta.client) {
    return 0
  }

  const parsed = Number(window.sessionStorage.getItem(APP_WELCOME_STEP_STORAGE_KEY))
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 2 ? parsed : 0
}

export function writeAppWelcomeStep(step: number) {
  if (!import.meta.client) {
    return
  }

  window.sessionStorage.setItem(APP_WELCOME_STEP_STORAGE_KEY, String(step))
}

export function clearAppWelcomeStep() {
  if (!import.meta.client) {
    return
  }

  window.sessionStorage.removeItem(APP_WELCOME_STEP_STORAGE_KEY)
}

export const WEEKLY_LOG_DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
] as const

export type WeeklyLogCaution = {
  tone: 'soft' | 'strong'
  daysUntilLogDay: number
  logDayLabel: string
  title: string
  message: string
}

export function getWeeklyLogDayLabel(day: number) {
  return WEEKLY_LOG_DAY_OPTIONS.find((option) => option.value === day)?.label || 'Sunday'
}

export function getWeeklyLogCaution(
  weeklyLogDay: number,
  cadence: LoggingCadence,
  now = new Date()
): WeeklyLogCaution | null {
  if (cadence !== 'weekly') {
    return null
  }

  const today = now.getDay()
  let daysUntil = weeklyLogDay - today

  if (daysUntil < 0) {
    return null
  }

  if (daysUntil === 0) {
    return null
  }

  const logDayLabel = getWeeklyLogDayLabel(weeklyLogDay)

  if (daysUntil <= 3) {
    return {
      tone: 'soft',
      daysUntilLogDay: daysUntil,
      logDayLabel,
      title: 'Logging before your chosen day',
      message: `You chose to log weekly on ${logDayLabel}s. That helps you capture the week without revisiting every event daily: especially helpful for mental health conditions. Continue logging early anyway?`
    }
  }

  return {
    tone: 'strong',
    daysUntilLogDay: daysUntil,
    logDayLabel,
    title: 'It is still early in your logging week',
    message: `Your plan is to log on ${logDayLabel}s. Logging this far ahead may bring up symptoms more often than you intended. You can still continue if you need to catch up on paper notes.`
  }
}
