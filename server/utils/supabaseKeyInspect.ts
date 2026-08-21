export function previewSupabaseKey(key: string) {
  if (!key) {
    return null
  }

  if (key.startsWith('sb_publishable_')) {
    return `sb_publishable_...${key.slice(-8)}`
  }

  if (key.startsWith('sb_secret_')) {
    return `sb_secret_...${key.slice(-8)}`
  }

  return `${key.slice(0, 16)}...${key.slice(-8)}`
}

export function inspectSupabaseKey(key: string) {
  if (!key) {
    return {
      format: 'missing' as const,
      role: null,
      projectRef: null
    }
  }

  if (key.startsWith('sb_publishable_')) {
    return {
      format: 'publishable' as const,
      role: 'anon',
      projectRef: null
    }
  }

  if (key.startsWith('sb_secret_')) {
    return {
      format: 'secret' as const,
      role: 'service_role',
      projectRef: null
    }
  }

  const parts = key.split('.')

  if (parts.length !== 3) {
    return {
      format: 'unknown' as const,
      role: null,
      projectRef: null
    }
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      role?: string
      ref?: string
    }

    return {
      format: 'legacy_jwt' as const,
      role: payload.role || null,
      projectRef: payload.ref || null
    }
  } catch {
    return {
      format: 'unknown' as const,
      role: null,
      projectRef: null
    }
  }
}

export function describeServiceRoleKey(serviceKey: string, anonKey = '') {
  const key = String(serviceKey || '').trim()
  const anon = String(anonKey || '').trim()

  if (!key) {
    return {
      ok: false as const,
      reason: 'missing' as const
    }
  }

  if (anon && key === anon) {
    return {
      ok: false as const,
      reason: 'same_as_anon' as const
    }
  }

  const info = inspectSupabaseKey(key)

  if (info.role === 'service_role') {
    return {
      ok: true as const,
      reason: null
    }
  }

  if (info.role === 'anon') {
    return {
      ok: false as const,
      reason: 'anon_jwt' as const
    }
  }

  return {
    ok: false as const,
    reason: 'unknown' as const
  }
}
