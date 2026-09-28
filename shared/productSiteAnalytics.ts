/** Shared site-analytics helpers for ClaimBuilder / Claim Tracker page traffic. */

export const PRODUCT_ANALYTICS_SOURCES = [
  'hub',
  'claimbuilder',
  'claim_tracker',
  'symptom_tracker'
] as const

export type ProductAnalyticsSource = typeof PRODUCT_ANALYTICS_SOURCES[number]

export const DEFAULT_ANALYTICS_EXCLUDED_EMAILS = [
  'philippeashelton@gmail.com',
  'wovasteen@gmail.com',
  'veteranscentral1818@gmail.com'
] as const

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const INET_RE = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i

export function normalizeAnalyticsEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function analyticsExcludedEmails(extraEmails: unknown = ''): string[] {
  const extras = Array.isArray(extraEmails)
    ? extraEmails
    : String(extraEmails || '').split(/[;,\n]/)
  return [...DEFAULT_ANALYTICS_EXCLUDED_EMAILS, ...extras]
    .map(normalizeAnalyticsEmail)
    .filter(Boolean)
}

export function isAnalyticsExcludedEmail(email: unknown, extraEmails: unknown = ''): boolean {
  const normalized = normalizeAnalyticsEmail(email)
  return Boolean(normalized) && analyticsExcludedEmails(extraEmails).includes(normalized)
}

export function isAnalyticsExcludedUser(user: unknown, extraEmails: unknown = ''): boolean {
  const email = user && typeof user === 'object'
    ? (user as { email?: unknown }).email
    : null
  return isAnalyticsExcludedEmail(email, extraEmails)
}

export function isUuid(value: unknown): boolean {
  return UUID_RE.test(String(value || '').trim())
}

export function isValidInet(value: unknown): boolean {
  const ip = String(value || '').trim()
  if (!ip || ip === 'unknown') return false
  if (ip === '127.0.0.1' || ip === '::1') return true
  return INET_RE.test(ip)
}

export function shouldSkipPagePath(path: unknown): boolean {
  const value = String(path || '').split('?')[0]
  if (!value || value === '/analytics' || value.startsWith('/api') || value.startsWith('/_nuxt') || value.startsWith('/__nuxt')) {
    return true
  }
  return /\.[a-z0-9]+$/i.test(value)
}

export const KNOWN_ANALYTICS_BOT_TOKENS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'discordbot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'bytespider',
  'headlesschrome',
  'puppeteer',
  'playwright',
  'chrome-lighthouse',
  'uptimerobot',
  'vercel-screenshot',
  'vercelbot'
] as const

export type AnalyticsVisitorSignals = {
  userAgent?: string | null
  from?: string | null
  purpose?: string | null
}

export function detectKnownAnalyticsBot(signals: AnalyticsVisitorSignals = {}): { isBot: boolean, reason: string | null } {
  const userAgent = String(signals.userAgent || '').trim()
  if (!userAgent) return { isBot: true, reason: 'empty-ua' }

  const purpose = String(signals.purpose || '').trim().toLowerCase()
  if (purpose === 'preview') return { isBot: true, reason: 'purpose:preview' }

  const haystack = userAgent.toLowerCase()
  const token = KNOWN_ANALYTICS_BOT_TOKENS.find(entry => haystack.includes(entry))
  if (token) return { isBot: true, reason: token }
  return { isBot: false, reason: null }
}

export function shouldSkipAnalyticsWrite(signals: AnalyticsVisitorSignals = {}): boolean {
  return detectKnownAnalyticsBot(signals).isBot
}

export function normalizeProductAnalyticsSource(value: unknown): ProductAnalyticsSource | null {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'hub' || raw === 'vch' || raw === 'route') return 'hub'
  if (raw === 'claimbuilder' || raw === 'claim_builder') return 'claimbuilder'
  if (raw === 'claim_tracker' || raw === 'tracker' || raw === 'track_claims') return 'claim_tracker'
  if (raw === 'symptom_tracker' || raw === 'symptoms') return 'symptom_tracker'
  return null
}

/** ClaimBuilder routes: Claim Tracker lives under /track-claims. */
export function resolveClaimBuilderProductSource(path: unknown): ProductAnalyticsSource {
  const value = String(path || '').split('?')[0] || '/'
  if (value === '/track-claims' || value.startsWith('/track-claims/')) return 'claim_tracker'
  return 'claimbuilder'
}

export function productAnalyticsLabel(source: ProductAnalyticsSource): string {
  if (source === 'hub') return 'Hub'
  if (source === 'claimbuilder') return 'ClaimBuilder'
  if (source === 'claim_tracker') return 'Claim Tracker'
  return 'Symptom Tracker'
}

export type ProductPageAnalyticsInsert = {
  user_id: null
  entity_type: 'page'
  entity_id: null
  event_type: 'view'
  visitor_ip?: string | null
  visitor_user_agent?: string | null
  referrer?: string | null
  metadata: Record<string, unknown>
}

export function buildProductPageViewRow(input: {
  path?: unknown
  title?: unknown
  product?: unknown
  referrer?: unknown
  viewerId?: unknown
  metadata?: Record<string, unknown> | null
} = {}): ProductPageAnalyticsInsert | null {
  const path = String(input.path || '').split('?')[0].trim() || '/'
  if (shouldSkipPagePath(path)) return null

  const product = normalizeProductAnalyticsSource(input.product) || 'claimbuilder'
  const title = String(input.title || '').trim()
  const extra = input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {}
  const viewerId = isUuid(input.viewerId) ? String(input.viewerId).trim() : null

  const metadata: Record<string, unknown> = {
    ...extra,
    entityKey: `page:${path}`,
    path,
    title: title || null,
    product,
    source: product
  }
  if (viewerId) metadata.viewer_id = viewerId

  return {
    user_id: null,
    entity_type: 'page',
    entity_id: null,
    event_type: 'view',
    metadata
  }
}
