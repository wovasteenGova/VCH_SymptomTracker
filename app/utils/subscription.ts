/** Fallback origins when no current host is available. UI should use useVchPublicUrls(). */
export const VCH_HUB_URL = 'https://www.veteranscentralhub.com'
export const VCH_PRIVACY_URL = `${VCH_HUB_URL}/privacy`
export const VCH_TERMS_URL = `${VCH_HUB_URL}/terms`
export const VCH_CONTACT_URL = `${VCH_HUB_URL}/contact?source=tracker`
export const VCH_CLAIM_MAKER_URL = `${VCH_HUB_URL}/claims-maker`
export const VCH_CLAIMBUILDER_URL = 'https://claimbuilder.veteranscentralhub.com'

export const VCH_SUPPORT_EMAIL = 'hello@veteranscentralhub.com'

export function buildSupportEmailHref(subject = 'Symptom Tracker support') {
  return `mailto:${VCH_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

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
