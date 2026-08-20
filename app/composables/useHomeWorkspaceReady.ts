const WORKSPACE_BOOTSTRAPPED_SESSION_KEY = 'symptom-tracker-workspace-bootstrapped'
const TRACKED_CONDITIONS_STORAGE_KEY = 'symptom-tracker-tracked-condition-keys'

function readBootstrappedFromSession() {
  if (!import.meta.client) {
    return false
  }

  try {
    return window.sessionStorage.getItem(WORKSPACE_BOOTSTRAPPED_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function hasCachedTrackedConditions() {
  if (!import.meta.client) {
    return false
  }

  try {
    const raw = window.localStorage.getItem(TRACKED_CONDITIONS_STORAGE_KEY)
    if (!raw) {
      return false
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.some(Boolean)
  } catch {
    return false
  }
}

function persistBootstrappedSession() {
  if (!import.meta.client) {
    return
  }

  try {
    window.sessionStorage.setItem(WORKSPACE_BOOTSTRAPPED_SESSION_KEY, '1')
  } catch {
    // sessionStorage unavailable — in-memory ready flag still applies this visit.
  }
}

function clearBootstrappedSession() {
  if (!import.meta.client) {
    return
  }

  try {
    window.sessionStorage.removeItem(WORKSPACE_BOOTSTRAPPED_SESSION_KEY)
  } catch {
    // ignore
  }
}

/** Home page (`/`) keeps the tank loader until this flips true (once per session). */
export function useHomeWorkspaceReady() {
  const homeWorkspaceReady = useState(
    'tracker-home-workspace-ready',
    () => readBootstrappedFromSession() || hasCachedTrackedConditions()
  )

  function markHomeWorkspaceReady() {
    homeWorkspaceReady.value = true
    persistBootstrappedSession()
  }

  function resetHomeWorkspaceReady() {
    homeWorkspaceReady.value = false
    clearBootstrappedSession()
  }

  return {
    homeWorkspaceReady,
    markHomeWorkspaceReady,
    resetHomeWorkspaceReady
  }
}
