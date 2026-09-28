import { shouldSkipPagePath } from '#shared/productSiteAnalytics'
import { useProductAnalytics } from '../composables/useProductAnalytics'

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const { trackPageView } = useProductAnalytics()
  let lastPath = ''
  let lastAt = 0

  const record = (to: { path?: string }) => {
    const path = String(to.path || '').split('?')[0] || '/'
    if (shouldSkipPagePath(path)) return
    const now = Date.now()
    if (path === lastPath && now - lastAt < 1200) return
    lastPath = path
    lastAt = now
    trackPageView({
      path,
      title: typeof document !== 'undefined' ? document.title : ''
    })
  }

  nuxtApp.hook('page:finish', () => {
    record(router.currentRoute.value)
  })
})
