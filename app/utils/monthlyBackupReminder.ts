const STORAGE_PREFIX = 'symptom-tracker-backup-reminder'

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function isMonthlyBackupWindow(date = new Date()) {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return date.getDate() >= lastDayOfMonth - 2
}

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export function shouldShowMonthlyBackupReminder(userId: string, hasEntries: boolean) {
  if (!import.meta.client || !userId || !hasEntries) {
    return false
  }

  if (!isMonthlyBackupWindow()) {
    return false
  }

  const dismissedMonth = window.localStorage.getItem(getStorageKey(userId))
  return dismissedMonth !== getMonthKey()
}

export function markMonthlyBackupReminderSeen(userId: string) {
  if (!import.meta.client || !userId) {
    return
  }

  window.localStorage.setItem(getStorageKey(userId), getMonthKey())
}

export const MONTHLY_BACKUP_REMINDER_COPY =
  'End of the month: download a PDF backup and keep it somewhere safe.'
