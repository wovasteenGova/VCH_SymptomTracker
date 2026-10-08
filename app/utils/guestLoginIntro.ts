const VIEWS_KEY = 'symptom-tracker-guest-login-intro-views'

export function hasAcknowledgedGuestLoginIntro() {
  if (!import.meta.client) {
    return true
  }

  if (window.localStorage.getItem('symptom-tracker-guest-login-intro-seen') === '1') {
    return true
  }

  return Number(window.localStorage.getItem(VIEWS_KEY) || 0) >= 2
}

export function recordGuestLoginIntroShown() {
  if (!import.meta.client || hasAcknowledgedGuestLoginIntro()) {
    return
  }

  const n = Number(window.localStorage.getItem(VIEWS_KEY) || 0)
  window.localStorage.setItem(VIEWS_KEY, String(n + 1))
}

export function acknowledgeGuestLoginIntro() {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(VIEWS_KEY, '2')
}
