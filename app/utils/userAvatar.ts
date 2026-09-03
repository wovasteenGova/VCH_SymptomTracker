type AuthIdentity = {
  provider?: string
  identity_data?: Record<string, unknown> | null
}

type AuthUserLike = {
  id?: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  identities?: AuthIdentity[] | null
} | null | undefined

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function googlePhotoUrl(user: AuthUserLike) {
  const metadata = user?.user_metadata && typeof user.user_metadata === 'object'
    ? user.user_metadata
    : {}
  const fromMeta = readString(metadata.avatar_url) || readString(metadata.picture)
  if (fromMeta.startsWith('https://')) return fromMeta

  for (const identity of user?.identities || []) {
    if (identity?.provider !== 'google') continue
    const data = identity.identity_data && typeof identity.identity_data === 'object'
      ? identity.identity_data
      : {}
    const fromIdentity = readString(data.avatar_url) || readString(data.picture)
    if (fromIdentity.startsWith('https://')) return fromIdentity
  }

  return ''
}

function displayName(user: AuthUserLike) {
  const metadata = user?.user_metadata && typeof user.user_metadata === 'object'
    ? user.user_metadata
    : {}
  return readString(metadata.full_name)
    || [readString(metadata.first_name), readString(metadata.last_name)].filter(Boolean).join(' ')
    || readString(user?.email).split('@')[0]
    || 'V'
}

function generatedInitialsAvatar(name: string) {
  const initial = (name.trim().charAt(0) || 'V').toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true">
    <rect width="64" height="64" rx="32" fill="#3d2b1f"/>
    <text x="32" y="40" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="28" font-weight="700" fill="#e8c547">${initial}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Google photo when they signed in with Google; generated initials avatar otherwise. */
export function resolveAuthUserAvatarUrl(user: AuthUserLike) {
  if (!user) return generatedInitialsAvatar('V')
  return googlePhotoUrl(user) || generatedInitialsAvatar(displayName(user))
}
