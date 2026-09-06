/** Canonical VCH account name: same resolution in ClaimBuilder and Symptom Tracker. */
export function resolveVchAccountFullName(options: {
  trackerFullName?: string | null
  authFullName?: string | null
  email?: string | null
}) {
  const tracker = options.trackerFullName?.trim()
  if (tracker) return tracker

  const auth = options.authFullName?.trim()
  if (auth) return auth

  const emailLocal = options.email?.split('@')[0]?.trim()
  if (emailLocal) return emailLocal

  return 'Your account'
}
