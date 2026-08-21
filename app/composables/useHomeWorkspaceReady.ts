/** Home page (`/`) keeps the tank loader until bootstrap completes. */
export function useHomeWorkspaceReady() {
  const homeWorkspaceReady = useState('tracker-home-workspace-ready', () => false)
  const splashDismissed = useState('tracker-home-splash-dismissed', () => false)

  function markHomeWorkspaceReady() {
    homeWorkspaceReady.value = true
    splashDismissed.value = true
  }

  function resetHomeWorkspaceReady() {
    homeWorkspaceReady.value = false
    splashDismissed.value = false
  }

  return {
    homeWorkspaceReady,
    splashDismissed,
    markHomeWorkspaceReady,
    resetHomeWorkspaceReady
  }
}
