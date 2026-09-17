import {
  buildAuthEmailLinkRedirectUrl,
  resolveAuthEmailLinkRedirectPath
} from '../utils/authEmailLinkRedirect'

export default defineNuxtPlugin({
  name: 'auth-email-link-redirect',
  enforce: 'pre',
  setup() {
    if (!import.meta.client) {
      return
    }

    const targetPath = resolveAuthEmailLinkRedirectPath({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    })

    if (!targetPath) {
      return
    }

    window.location.replace(buildAuthEmailLinkRedirectUrl(window.location, targetPath))
  }
})
