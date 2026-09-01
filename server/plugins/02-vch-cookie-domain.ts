import { getRequestHost, getResponseHeader, setResponseHeader } from 'h3'
import { rewriteSetCookieDomain } from '../../app/utils/vchHost'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    const hostname = getRequestHost(event, { xForwardedHost: true })
    const raw = getResponseHeader(event, 'set-cookie')

    if (!raw) {
      return
    }

    const cookies = (Array.isArray(raw) ? raw : [raw])
      .map((value) => rewriteSetCookieDomain(String(value), hostname))

    setResponseHeader(event, 'set-cookie', cookies)
  })
})
