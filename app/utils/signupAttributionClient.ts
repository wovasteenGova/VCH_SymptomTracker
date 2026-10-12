import type { SupabaseClient } from '@supabase/supabase-js'
import {
  mergeSignupAttributionMetadata,
  readSignupAttribution,
  type SignupProduct
} from '#shared/signupAttribution'

export const PENDING_SIGNUP_PRODUCT_STORAGE_KEY = 'vch-signup-product-pending'
export const SYMPTOM_TRACKER_SIGNUP_PRODUCT = 'symptom_tracker' as const satisfies SignupProduct

export function markPendingSignupProduct(product: SignupProduct = SYMPTOM_TRACKER_SIGNUP_PRODUCT) {
  if (!import.meta.client) return
  try {
    window.sessionStorage.setItem(PENDING_SIGNUP_PRODUCT_STORAGE_KEY, product)
    window.localStorage.setItem(PENDING_SIGNUP_PRODUCT_STORAGE_KEY, product)
  } catch {
    // ignore
  }
}

export function consumePendingSignupProduct(): SignupProduct | null {
  if (!import.meta.client) return null
  try {
    const raw = window.sessionStorage.getItem(PENDING_SIGNUP_PRODUCT_STORAGE_KEY)
      || window.localStorage.getItem(PENDING_SIGNUP_PRODUCT_STORAGE_KEY)
    window.sessionStorage.removeItem(PENDING_SIGNUP_PRODUCT_STORAGE_KEY)
    window.localStorage.removeItem(PENDING_SIGNUP_PRODUCT_STORAGE_KEY)
    if (!raw) return null
    const product = raw.trim().toLowerCase()
    if (product === 'hub' || product === 'claimbuilder' || product === 'claim_tracker' || product === 'symptom_tracker') {
      return product
    }
    return null
  } catch {
    return null
  }
}

export async function ensureUserSignupAttribution(
  supabase: SupabaseClient,
  fallbackProduct: SignupProduct = SYMPTOM_TRACKER_SIGNUP_PRODUCT
) {
  if (!import.meta.client) return

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return
  if (readSignupAttribution(user.user_metadata).product) return

  const product = consumePendingSignupProduct() ?? fallbackProduct
  const merged = mergeSignupAttributionMetadata(user.user_metadata, {
    product,
    host: window.location.host
  })
  if (!merged) return

  await supabase.auth.updateUser({ data: merged })
}
