/** Sync palette + light/dark mode to the signed-in account (cross-device). */
export default defineNuxtPlugin(() => {
  useVchUiPreferencesSync()
})
