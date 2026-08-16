export const TRACKER_PUBLIC_ORIGIN = 'https://tracker.veteranscentralhub.us'

function isLocalOrigin(value: string) {
  try {
    const hostname = new URL(value).hostname
    return hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname.endsWith('.local')
  } catch {
    return false
  }
}

export function resolveTrackerPublicOrigin(configuredSiteUrl?: string | null) {
  const trimmed = configuredSiteUrl?.trim()

  if (trimmed && !isLocalOrigin(trimmed)) {
    return trimmed.replace(/\/$/, '')
  }

  return TRACKER_PUBLIC_ORIGIN
}

export function resolveTrackerAppUrl(configuredSiteUrl?: string | null) {
  return `${resolveTrackerPublicOrigin(configuredSiteUrl)}/`
}

export const reportBranding = {
  organizationName: 'Veterans Central Hub',
  reportTitle: 'Veteran Symptom History Report',
  reportSubtitle: 'Personal evidence organizer for medical visits, claims, and your records',
  logoPath: '/brand/vch-symptom-tracker-logo.png'
}

export const CP_PREP_DISCLAIMER_TITLE = 'Not for VA submission'

export const CP_PREP_DISCLAIMER_BODY =
  'For your own review before medical visits. Do not upload this sheet as VA evidence. Use your own words; only describe what is still true for you.'

export const MARKETING_EXAM_HOOK =
  'Stop trying to remember six months of symptoms during a 30-minute exam.'

let cachedLogoDataUrl: string | null | undefined

export async function loadReportLogoDataUrl() {
  if (!import.meta.client) {
    return null
  }

  if (cachedLogoDataUrl !== undefined) {
    return cachedLogoDataUrl
  }

  try {
    const response = await fetch(reportBranding.logoPath)
    if (!response.ok) {
      cachedLogoDataUrl = null
      return null
    }

    const blob = await response.blob()
    if (!blob.type.startsWith('image/') || blob.type.includes('svg')) {
      cachedLogoDataUrl = null
      return null
    }

    cachedLogoDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })

    return cachedLogoDataUrl
  } catch {
    cachedLogoDataUrl = null
    return null
  }
}

export function getLogoFormat(dataUrl: string | null) {
  if (!dataUrl) {
    return 'PNG'
  }

  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'JPEG'
  }

  return 'PNG'
}
