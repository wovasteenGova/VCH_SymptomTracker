import {
  isAnalyticsExcludedUser,
  shouldSkipAnalyticsWrite,
  shouldSkipPagePath
} from '#shared/productSiteAnalytics'

function canTrackOnClient() {
  return import.meta.client === true && import.meta.server !== true
}

function clientVisitorSignals() {
  if (typeof navigator === 'undefined') return { userAgent: '' }
  return { userAgent: navigator.userAgent }
}

function isExcludedAnalyticsClientUser() {
  try {
    const { user } = useSupabaseAuth()
    const config = useRuntimeConfig()
    return isAnalyticsExcludedUser(user.value, config.public?.analyticsExcludeEmails)
  } catch {
    return false
  }
}

function fireTrack(body: Record<string, unknown>) {
  if (!canTrackOnClient()) return
  if (shouldSkipAnalyticsWrite(clientVisitorSignals())) return
  if (isExcludedAnalyticsClientUser()) return
  $fetch('/api/analytics/track', {
    method: 'POST',
    body
  }).catch(() => {})
}

/** Page-view analytics for Symptom Tracker. */
export function useProductAnalytics() {
  function trackPageView(input: { path?: string, title?: string } = {}) {
    if (!canTrackOnClient()) return
    const path = String(input.path || '').split('?')[0] || '/'
    if (shouldSkipPagePath(path)) return
    fireTrack({
      path,
      title: input.title || (typeof document !== 'undefined' ? document.title : ''),
      product: 'symptom_tracker',
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    })
  }

  return { trackPageView }
}
