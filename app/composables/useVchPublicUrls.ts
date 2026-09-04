import { computed } from 'vue'
import {
  resolveCurrentHostname,
  resolveVchClaimBuilderUrl,
  resolveVchContactUrl,
  resolveVchHubPath,
  resolveVchHubUrl
} from '../utils/vchHost'

export function useVchPublicUrls() {
  const config = useRuntimeConfig()

  const hostname = computed(() => {
    if (import.meta.client) {
      return window.location.hostname
    }

    try {
      return useRequestURL().hostname
    } catch {
      return resolveCurrentHostname()
    }
  })

  const hubUrl = computed(() => resolveVchHubUrl(hostname.value))
  const privacyUrl = computed(() => resolveVchHubPath('/privacy', hostname.value))
  const termsUrl = computed(() => resolveVchHubPath('/terms', hostname.value))
  const contactUrl = computed(() => resolveVchContactUrl(hostname.value))
  const cookiesUrl = computed(() => resolveVchHubPath('/cookies', hostname.value))
  const claimMakerUrl = computed(() => resolveVchHubPath('/claims-maker', hostname.value))
  const symptomTrackerMarketingUrl = computed(() => resolveVchHubPath('/symptom-tracker', hostname.value))
  const claimBuilderUrl = computed(() => resolveVchClaimBuilderUrl(config.public.claimBuilderUrl, hostname.value))

  return {
    hostname,
    hubUrl,
    privacyUrl,
    termsUrl,
    contactUrl,
    cookiesUrl,
    claimMakerUrl,
    symptomTrackerMarketingUrl,
    claimBuilderUrl
  }
}
