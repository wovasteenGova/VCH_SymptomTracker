const EDIT_HISTORY_NOTICE_KEY_PREFIX = 'symptom-tracker-edit-history-notice-'

export function getEditHistoryNoticeStorageKey(userId: string) {
  return `${EDIT_HISTORY_NOTICE_KEY_PREFIX}${userId}`
}

export function hasAcknowledgedEditHistoryNotice(userId: string | null | undefined) {
  if (!import.meta.client || !userId) {
    return true
  }

  return window.localStorage.getItem(getEditHistoryNoticeStorageKey(userId)) === '1'
}

export function acknowledgeEditHistoryNotice(userId: string) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(getEditHistoryNoticeStorageKey(userId), '1')
}
