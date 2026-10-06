import {
  clearOAuthPkceVerifierCookie,
  createOAuthPkceStorage,
  isOAuthCodeVerifierStorageKey
} from '../utils/oauthPkceStorage'

type AuthStorage = {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}

/**
 * @nuxtjs/supabase uses cookie storage for SSR. Mirror the PKCE verifier to a
 * parent-domain cookie so signup confirm links and OAuth handoffs share the verifier.
 */
export default defineNuxtPlugin({
  name: 'oauth-pkce-storage',
  dependsOn: ['supabase'],
  setup() {
    const supabase = useSupabaseClient()
    const hostname = window.location.hostname
    const mirror = createOAuthPkceStorage({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }, hostname)

    const auth = supabase.auth as { storage?: AuthStorage }
    const storage = auth.storage
    if (!storage) return

    const originalGetItem = storage.getItem.bind(storage)
    const originalSetItem = storage.setItem.bind(storage)
    const originalRemoveItem = storage.removeItem.bind(storage)

    storage.getItem = async (key) => {
      if (isOAuthCodeVerifierStorageKey(key)) {
        const mirrored = mirror.getItem(key)
        if (mirrored) return mirrored
      }

      return await originalGetItem(key)
    }

    storage.setItem = async (key, value) => {
      await originalSetItem(key, value)

      if (isOAuthCodeVerifierStorageKey(key)) {
        mirror.setItem(key, value)
      }
    }

    storage.removeItem = async (key) => {
      await originalRemoveItem(key)

      if (isOAuthCodeVerifierStorageKey(key)) {
        mirror.removeItem(key)
        clearOAuthPkceVerifierCookie(hostname)
      }
    }
  }
})
