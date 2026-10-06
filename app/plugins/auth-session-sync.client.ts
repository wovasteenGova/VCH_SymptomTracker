import { hasAuthHydratePending } from '../utils/authHydrate'
import { useAuthSessionRecovery } from '../utils/authSessionRecovery'

const MIN_SYNC_INTERVAL_MS = 2500

/**
 * Recover signed-in UI when Supabase has a session but useState user is stale.
 * Throttled so a bad refresh token cannot spam auth endpoints (login refresh storms).
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const { user, isAuthLoading, syncAuthSession } = useSupabaseAuth()
  const { isAuthSessionRecoveryBlocked } = useAuthSessionRecovery()
  const route = useRoute()
  let hydrateTimer: ReturnType<typeof setInterval> | null = null
  let lastSyncAt = 0

  const trySync = () => {
    if (user.value) {
      if (hydrateTimer) {
        clearInterval(hydrateTimer)
        hydrateTimer = null
      }
      return
    }
    if (isAuthSessionRecoveryBlocked()) return
    if (isAuthLoading.value && !hasAuthHydratePending()) return

    const now = Date.now()
    if (now - lastSyncAt < MIN_SYNC_INTERVAL_MS) return
    lastSyncAt = now

    void syncAuthSession({
      attempts: hasAuthHydratePending() ? 5 : 3,
      delayMs: 200
    })
  }

  const startHydratePolling = () => {
    if (hydrateTimer || user.value || !hasAuthHydratePending()) return
    hydrateTimer = setInterval(() => {
      if (user.value || !hasAuthHydratePending()) {
        if (hydrateTimer) {
          clearInterval(hydrateTimer)
          hydrateTimer = null
        }
        return
      }
      trySync()
    }, 800)
  }

  watch(() => route.fullPath, () => {
    trySync()
    startHydratePolling()
  })

  watch(isAuthLoading, (loading) => {
    if (!loading) {
      trySync()
      startHydratePolling()
    }
  })

  watch(user, (next) => {
    if (next && hydrateTimer) {
      clearInterval(hydrateTimer)
      hydrateTimer = null
    }
  })

  window.addEventListener('focus', trySync)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trySync()
  })

  trySync()
  startHydratePolling()
})
