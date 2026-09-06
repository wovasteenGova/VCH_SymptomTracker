import { getRequestHost, getRequestURL, sendRedirect } from 'h3'
import {
  buildTrackerUsToComRedirectUrl,
  normalizeHostname,
  shouldRedirectRetiredUsTrackerHost
} from '../../app/utils/vchHost'

export default defineEventHandler((event) => {
  const hostname = normalizeHostname(getRequestHost(event, { xForwardedHost: true }))
  const requestUrl = getRequestURL(event)

  if (!shouldRedirectRetiredUsTrackerHost({
    hostname,
    path: requestUrl.pathname,
    method: event.method
  })) {
    return
  }

  const target = buildTrackerUsToComRedirectUrl(hostname, {
    pathname: requestUrl.pathname,
    search: requestUrl.search
  })

  if (!target) {
    return
  }

  return sendRedirect(event, target, 301)
})
