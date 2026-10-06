/** Survives post-OAuth redirect so the home page keeps retrying session hydrate. */

export const AUTH_HYDRATE_KEY = 'symptom-tracker-auth-hydrate'
export const AUTH_HYDRATE_TTL_MS = 60_000

export function isAuthHydrateTimestampFresh(at: number, now = Date.now(), ttlMs = AUTH_HYDRATE_TTL_MS) {
  return Number.isFinite(at) && now - at <= ttlMs
}

export function markAuthHydratePending() {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(AUTH_HYDRATE_KEY, String(Date.now()))
  } catch {
    // Ignore quota / private mode.
  }
}

export function hasAuthHydratePending(now = Date.now()) {
  if (!import.meta.client) return false
  try {
    const raw = window.localStorage.getItem(AUTH_HYDRATE_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!isAuthHydrateTimestampFresh(at, now)) {
      window.localStorage.removeItem(AUTH_HYDRATE_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

export function clearAuthHydratePending() {
  if (!import.meta.client) return
  try {
    window.localStorage.removeItem(AUTH_HYDRATE_KEY)
  } catch {
    // Ignore.
  }
}
