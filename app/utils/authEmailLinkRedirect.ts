const AUTH_HANDLER_PATHS = new Set([
  '/auth/reset-password',
  '/auth/confirm',
  '/auth/callback'
])

function readParamBag(value: string) {
  const raw = String(value || '').replace(/^[#?]/, '')
  return raw ? new URLSearchParams(raw) : new URLSearchParams()
}

export function hasAuthLinkPayload(search = '', hash = '') {
  const hashParams = readParamBag(hash)
  const searchParams = readParamBag(search)

  return hashParams.has('access_token')
    || hashParams.has('refresh_token')
    || hashParams.has('token_hash')
    || searchParams.has('code')
    || searchParams.has('token_hash')
}

export function resolveAuthEmailLinkType(search = '', hash = '') {
  const hashParams = readParamBag(hash)
  const searchParams = readParamBag(search)

  return hashParams.get('type') || searchParams.get('type')
}

export function resolveAuthEmailLinkRedirectPath({
  pathname = '',
  search = '',
  hash = ''
}: {
  pathname?: string
  search?: string
  hash?: string
} = {}) {
  const normalizedPath = String(pathname || '').replace(/\/+$/, '') || '/'

  if (AUTH_HANDLER_PATHS.has(normalizedPath)) {
    return null
  }

  if (!hasAuthLinkPayload(search, hash)) {
    return null
  }

  const linkType = resolveAuthEmailLinkType(search, hash)
  const searchParams = readParamBag(search)

  if (linkType === 'recovery') {
    return '/auth/reset-password'
  }

  if (searchParams.has('code')) {
    return '/auth/confirm'
  }

  return '/auth/confirm'
}

export function buildAuthEmailLinkRedirectUrl(
  location: Pick<Location, 'search' | 'hash'>,
  targetPath: string
) {
  const search = location?.search || ''
  const hash = location?.hash || ''
  return `${targetPath}${search}${hash}`
}
