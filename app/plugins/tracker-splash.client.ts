import {
  holdTrackerSpaSplashForBootstrap,
  isBootSplashLockedOff
} from '../utils/trackerSplash'

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client || isBootSplashLockedOff()) {
    return
  }

  const route = useRoute()
  const isHomeRoute = route.path === '/' || route.path === ''

  if (!isHomeRoute) {
    return
  }

  nuxtApp.hook('app:beforeMount', () => {
    holdTrackerSpaSplashForBootstrap()
  })
})
