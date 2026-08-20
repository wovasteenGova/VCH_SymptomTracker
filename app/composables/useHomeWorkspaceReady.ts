/** Home page (`/`) keeps the tank loader until bootstrap completes. */
export function useHomeWorkspaceReady() {
  const homeWorkspaceReady = useState('tracker-home-workspace-ready', () => false)

  function markHomeWorkspaceReady() {
    homeWorkspaceReady.value = true
  }

  function resetHomeWorkspaceReady() {
    homeWorkspaceReady.value = false
  }

  return {
    homeWorkspaceReady,
    markHomeWorkspaceReady,
    resetHomeWorkspaceReady
  }
}
