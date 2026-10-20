import type { useToast as useToastComposable } from '#imports'

declare module '#app' {
  interface NuxtApp {
    $vchToast?: ReturnType<typeof useToastComposable>
  }
}

/**
 * Patched toast API from grouped-toast.client.ts.
 * Do not store this on useState; it holds refs that break when serialized.
 */
export function useVchToast() {
  const nuxtApp = useNuxtApp()

  if (nuxtApp.$vchToast) {
    return nuxtApp.$vchToast
  }

  return useToast()
}
