/** Safe in-app back target from legal pages (family observation links only). */
export function resolveFamilyObservationReturnPath(returnTo: unknown): string {
  const raw = String(returnTo || '').trim()
  if (!raw.startsWith('/') || raw.startsWith('//')) {
    return '/'
  }

  const path = raw.split('?')[0]?.split('#')[0] ?? ''
  if (!path.startsWith('/report/')) {
    return '/'
  }

  const tokenSegment = path.slice('/report/'.length)
  if (!tokenSegment || tokenSegment.includes('/')) {
    return '/'
  }

  return path
}
