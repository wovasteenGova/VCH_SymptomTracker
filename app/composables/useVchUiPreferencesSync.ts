import {
  applyAccountUiPreferences,
  isApplyingAccountUiPreferences,
  persistAccountUiPreferences,
  resolveColorModeForAccount
} from '../utils/vchUiPreferencesAccount'

const SAVE_DEBOUNCE_MS = 500

let syncInstalled = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

export function useVchUiPreferencesSync() {
  if (!import.meta.client) return

  if (syncInstalled) return
  syncInstalled = true

  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const { themeId } = useClaimColorTheme()
  const colorMode = useColorMode()

  async function loadForUser(userId: string) {
    await applyAccountUiPreferences(supabase, userId)
  }

  function scheduleSave() {
    if (isApplyingAccountUiPreferences()) return
    const userId = user.value?.id
    if (!userId) return

    const mode = resolveColorModeForAccount(colorMode)
    if (!mode) return

    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void persistAccountUiPreferences(supabase, userId, {
        colorTheme: themeId.value,
        colorMode: mode
      })
    }, SAVE_DEBOUNCE_MS)
  }

  watch(
    () => user.value?.id ?? null,
    (userId, previousUserId) => {
      if (userId && userId !== previousUserId) {
        void loadForUser(userId)
      }
    },
    { immediate: true }
  )

  watch(themeId, scheduleSave)
  watch(() => colorMode.preference, scheduleSave)
  watch(() => colorMode.value, scheduleSave)
}
