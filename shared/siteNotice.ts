export const SITE_NOTICE_TRACKER_SITE = 'tracker'
export const SITE_NOTICE_DISMISS_PREFIX = 'vch.siteNotice.dismissed.'

export type SiteNoticeRow = {
  id: string
  title: string | null
  message: string
  link_url: string | null
  link_label: string | null
  sites: string[]
  active: boolean
  starts_at: string | null
  ends_at: string | null
  dismissible: boolean
  priority: number
  created_at: string
  updated_at: string
}

export function siteNoticeDismissKey(id: string) {
  return `${SITE_NOTICE_DISMISS_PREFIX}${id}`
}

export function isSiteNoticeDismissed(
  id: string,
  storage: Pick<Storage, 'getItem'> | null | undefined = globalThis.localStorage
) {
  if (!id || !storage) {
    return false
  }

  try {
    return storage.getItem(siteNoticeDismissKey(id)) === '1'
  } catch {
    return false
  }
}

export function persistSiteNoticeDismissal(
  id: string,
  storage: Pick<Storage, 'setItem'> | null | undefined = globalThis.localStorage
) {
  if (!id || !storage) {
    return
  }

  try {
    storage.setItem(siteNoticeDismissKey(id), '1')
  } catch {
    // Ignore quota or private-mode storage failures.
  }
}

export function buildPreviewSiteNotice(): SiteNoticeRow {
  return {
    id: 'preview-tracker-notice',
    title: 'Tracker notice',
    message: 'This is a preview of the shared VCH site notice banner.',
    link_url: 'https://veteranscentralhub.com',
    link_label: 'Open Hub',
    sites: [SITE_NOTICE_TRACKER_SITE],
    active: true,
    starts_at: null,
    ends_at: null,
    dismissible: true,
    priority: 100,
    created_at: '2026-09-06T00:00:00.000Z',
    updated_at: '2026-09-06T00:00:00.000Z'
  }
}

export function isSiteNoticeLive(notice: SiteNoticeRow, now: Date = new Date()) {
  if (!notice.active) {
    return false
  }

  if (!Array.isArray(notice.sites) || !notice.sites.includes(SITE_NOTICE_TRACKER_SITE)) {
    return false
  }

  const nowMs = now.getTime()

  if (notice.starts_at) {
    const startsAt = Date.parse(notice.starts_at)
    if (Number.isFinite(startsAt) && startsAt > nowMs) {
      return false
    }
  }

  if (notice.ends_at) {
    const endsAt = Date.parse(notice.ends_at)
    if (Number.isFinite(endsAt) && endsAt <= nowMs) {
      return false
    }
  }

  return true
}

export function compareSiteNotices(left: SiteNoticeRow, right: SiteNoticeRow) {
  if (right.priority !== left.priority) {
    return right.priority - left.priority
  }

  const updatedDelta = Date.parse(right.updated_at) - Date.parse(left.updated_at)
  if (updatedDelta !== 0) {
    return updatedDelta
  }

  return Date.parse(right.created_at) - Date.parse(left.created_at)
}

export function selectSiteNotice(
  notices: SiteNoticeRow[],
  options: {
    now?: Date
    isDismissed?: (id: string) => boolean
  } = {}
) {
  const now = options.now ?? new Date()
  const isDismissed = options.isDismissed ?? (() => false)

  return notices
    .filter((notice) => isSiteNoticeLive(notice, now) && !isDismissed(notice.id))
    .sort(compareSiteNotices)[0] ?? null
}

export function sanitizeSiteNoticeLink(url: string | null | undefined) {
  const trimmed = String(url || '').trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href
    }
  } catch {
    return null
  }

  return null
}
