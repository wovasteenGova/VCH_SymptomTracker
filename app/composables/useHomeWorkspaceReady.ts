/** Home page (`/`) keeps the tank loader until bootstrap completes. */
export function useHomeWorkspaceReady() {
  const homeWorkspaceReady = useState('tracker-home-workspace-ready', () => false)
  const splashDismissed = useState('tracker-home-splash-dismissed', () => false)
  const allowVueSplashFallback = useState('tracker-home-allow-vue-splash', () => false)

  function markHomeWorkspaceReady() {
    homeWorkspaceReady.value = true
    splashDismissed.value = true
  }

  function resetHomeWorkspaceReady() {
    homeWorkspaceReady.value = false
    splashDismissed.value = false
    allowVueSplashFallback.value = true
  }

  return {
    homeWorkspaceReady,
    splashDismissed,
    allowVueSplashFallback,
    markHomeWorkspaceReady,
    resetHomeWorkspaceReady
  }
}
