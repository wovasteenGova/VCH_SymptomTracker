/** Restore workspace-ready before the home page paints so remounts never replay the tank loader. */
export default defineNuxtPlugin({
  name: 'tracker-workspace-ready-restore',
  enforce: 'pre',
  setup() {
    const { markHomeWorkspaceReady, homeWorkspaceReady } = useHomeWorkspaceReady()

    if (homeWorkspaceReady.value) {
      return
    }

    try {
      const bootstrapped = window.sessionStorage.getItem('symptom-tracker-workspace-bootstrapped') === '1'
      const cachedKeys = window.localStorage.getItem('symptom-tracker-tracked-condition-keys')
      const hasCachedConditions = Boolean(cachedKeys && cachedKeys !== '[]')

      if (bootstrapped || hasCachedConditions) {
        markHomeWorkspaceReady()
      }
    } catch {
      // Keep default bootstrap loader path.
    }
  }
})
