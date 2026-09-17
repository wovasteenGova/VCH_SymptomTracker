import { normalizeAuthEmail } from './authNotices'

const STORAGE_KEY = 'vch-pending-confirm-email'

export function markPendingConfirmEmail(email: string) {
  if (!import.meta.client) return

  const normalized = normalizeAuthEmail(email)
  if (!normalized) return

  window.sessionStorage.setItem(STORAGE_KEY, normalized)
}

export function readPendingConfirmEmail() {
  if (!import.meta.client) return ''

  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function clearPendingConfirmEmail() {
  if (!import.meta.client) return
  window.sessionStorage.removeItem(STORAGE_KEY)
}
