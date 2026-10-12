/**
 * Where the veteran created their Veterans Central Hub account (shared Supabase auth).
 * Stored on auth.users.user_metadata for email segmentation and ops.
 */

export const SIGNUP_PRODUCT_USER_METADATA_KEY = 'signup_product'
export const SIGNUP_HOST_USER_METADATA_KEY = 'signup_host'
export const SIGNUP_AT_USER_METADATA_KEY = 'signup_at'

export const SIGNUP_PRODUCTS = [
  'hub',
  'claimbuilder',
  'claim_tracker',
  'symptom_tracker'
] as const

export type SignupProduct = typeof SIGNUP_PRODUCTS[number]

export function normalizeSignupProduct(value: unknown): SignupProduct | null {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'hub' || raw === 'vch') return 'hub'
  if (raw === 'claimbuilder' || raw === 'claim_builder') return 'claimbuilder'
  if (raw === 'claim_tracker' || raw === 'track_claims') return 'claim_tracker'
  if (raw === 'symptom_tracker' || raw === 'symptoms') return 'symptom_tracker'
  return (SIGNUP_PRODUCTS as readonly string[]).includes(raw) ? raw as SignupProduct : null
}

export type SignupAttribution = {
  product: SignupProduct | null
  host: string | null
  at: string | null
}

export function readSignupAttribution(
  metadata: Record<string, unknown> | null | undefined
): SignupAttribution {
  if (!metadata) {
    return { product: null, host: null, at: null }
  }
  return {
    product: normalizeSignupProduct(metadata[SIGNUP_PRODUCT_USER_METADATA_KEY]),
    host: typeof metadata[SIGNUP_HOST_USER_METADATA_KEY] === 'string'
      ? metadata[SIGNUP_HOST_USER_METADATA_KEY].trim() || null
      : null,
    at: typeof metadata[SIGNUP_AT_USER_METADATA_KEY] === 'string'
      ? metadata[SIGNUP_AT_USER_METADATA_KEY].trim() || null
      : null
  }
}

export function signupProductEmailLabel(product: SignupProduct | null | undefined): string {
  if (product === 'hub') return 'Veterans Central Hub'
  if (product === 'claimbuilder') return 'ClaimBuilder'
  if (product === 'claim_tracker') return 'Claim Tracker'
  if (product === 'symptom_tracker') return 'Symptom Tracker'
  return 'Unknown'
}

export function buildSignupAttributionMetadata(input: {
  product: SignupProduct
  host?: string | null
  at?: string
}): Record<string, string> {
  const at = input.at ?? new Date().toISOString()
  const host = String(input.host || '').trim()
  return {
    [SIGNUP_PRODUCT_USER_METADATA_KEY]: input.product,
    [SIGNUP_AT_USER_METADATA_KEY]: at,
    ...(host ? { [SIGNUP_HOST_USER_METADATA_KEY]: host.slice(0, 253) } : {})
  }
}

/** Returns merged metadata, or null when signup_product is already set (never overwrite). */
export function mergeSignupAttributionMetadata(
  existing: Record<string, unknown> | null | undefined,
  input: { product: SignupProduct, host?: string | null, at?: string }
): Record<string, unknown> | null {
  if (readSignupAttribution(existing).product) return null
  return {
    ...(existing ?? {}),
    ...buildSignupAttributionMetadata(input)
  }
}
