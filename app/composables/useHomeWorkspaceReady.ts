import { ref } from 'vue'

/**
 * Module refs, not `useState`. Nuxt payload/cookie hydration can reset
 * `useState` after the home UI is already on screen, which used to bring
 * the tank back for a frame.
 */
const homeWorkspaceReady = ref(false)

export function useHomeWorkspaceReady() {
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
