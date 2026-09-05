export const PRO_PRODUCT_KEY = 'symptom_tracker_pro'
export const TRACKER_PAYMENT_SOURCE = 'tracker'
export const TRACKER_PAYMENT_TYPE_SUBSCRIPTION = 'subscription'
export const FREE_CONDITION_LIMIT = 1
/** @deprecated Use FREE_CONDITION_LIMIT */
export const FREE_ENTRY_LIMIT = FREE_CONDITION_LIMIT
export const PRO_MONTHLY_PRICE = 6.99
export const PRO_MONTHLY_PRICE_LABEL = '$6.99/month'
export const PRO_MONTHLY_PRICE_DETAIL = 'Billed monthly · cancel anytime'
/** @deprecated Prefer PRO_MONTHLY_PRICE — Pro is billed monthly */
export const PRO_ANNUAL_PRICE = PRO_MONTHLY_PRICE
/** @deprecated Prefer PRO_MONTHLY_PRICE_LABEL */
export const PRO_ANNUAL_PRICE_LABEL = PRO_MONTHLY_PRICE_LABEL
/** @deprecated Prefer PRO_MONTHLY_PRICE_DETAIL */
export const PRO_ANNUAL_PRICE_DETAIL = PRO_MONTHLY_PRICE_DETAIL
export const PRO_REFUND_POLICY_SHORT = '14-day refund'
export const PRO_REFUND_POLICY =
  '14-day refund. Email hello@veteranscentralhub.com within 14 days of purchase if Pro is not right for you.'
export const PRO_CHECKOUT_SUBMIT_MESSAGE =
  '$6.99/month · 14-day refund. Contact support within 14 days of purchase for a refund.'

/** Fallback origins when no current host is available. UI should use useVchPublicUrls(). */
export const VCH_HUB_URL = 'https://www.veteranscentralhub.com'
export const VCH_PRIVACY_URL = `${VCH_HUB_URL}/privacy`
export const VCH_TERMS_URL = `${VCH_HUB_URL}/terms`
export const VCH_CONTACT_URL = `${VCH_HUB_URL}/contact?source=tracker`
export const VCH_CLAIM_MAKER_URL = `${VCH_HUB_URL}/claims-maker`
export const VCH_CLAIMBUILDER_URL = 'https://claimbuilder.veteranscentralhub.com'

export const WHY_WE_CHARGE_COPY =
  "Pro subscriptions help fund our upcoming VCH Claim Maker, a separate tool for organizing service history, symptoms, and claim evidence into a stronger first draft. It is not live yet. This is a self-funded build, so symptom tracker Pro helps cover servers and development until Claim Maker ships. Don't wait on us to file; file on VA.gov when you're ready."

export const FREE_TIER_FEATURES = [
  'Pick 1 condition to track',
  'Unlimited entries within that condition',
  'Calendar logging charts and entry PDFs with weekly symptom counts'
] as const

export const PRO_TIER_FEATURES = [
  'Unlimited conditions',
  'Family reporting links for supporters',
  'Severity trends, functional impact, and advanced charts in PDF exports',
  'Personal review summaries with topics pulled from your logs'
] as const

export function conditionKeyFromLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function formatConditionKeyLabel(conditionKey: string) {
  return conditionKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function isActiveEntitlementStatus(status: string | null | undefined) {
  return status === 'active' || status === 'comped'
}

type BillableEntitlement = {
  status?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
} | null | undefined

/** Stripe Customer Portal — paid subscriptions only (not comped / Claim Maker / manual grants). */
export function canManageStripeBilling(entitlement: BillableEntitlement) {
  if (!entitlement?.stripe_customer_id || !entitlement.stripe_subscription_id) {
    return false
  }

  return entitlement.status === 'active'
}

export const NO_BILLING_PORTAL_MESSAGE =
  'Your Pro access was not set up through a subscription we can manage here. If you think something is wrong, contact us.'

export const BILLING_PORTAL_UNAVAILABLE_MESSAGE =
  'We could not open the billing portal right now. If you think something is wrong, contact us.'

export const VCH_SUPPORT_EMAIL = 'hello@veteranscentralhub.com'

export function buildSupportEmailHref(subject = 'Symptom Tracker: free Pro access request') {
  return `mailto:${VCH_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
}
