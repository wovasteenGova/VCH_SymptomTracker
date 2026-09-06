import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  buildPreviewSiteNotice,
  compareSiteNotices,
  isSiteNoticeLive,
  persistSiteNoticeDismissal,
  sanitizeSiteNoticeLink,
  selectSiteNotice,
  SITE_NOTICE_DISMISS_PREFIX,
  SITE_NOTICE_TRACKER_SITE,
  siteNoticeDismissKey,
  type SiteNoticeRow
} from '../shared/siteNotice.ts'

function notice(overrides: Partial<SiteNoticeRow> = {}): SiteNoticeRow {
  return {
    id: 'notice-1',
    title: 'Scheduled maintenance',
    message: 'Tracker will be briefly unavailable tonight.',
    link_url: 'https://veteranscentralhub.com/status',
    link_label: 'Status page',
    sites: [SITE_NOTICE_TRACKER_SITE],
    active: true,
    starts_at: null,
    ends_at: null,
    dismissible: true,
    priority: 1,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-02T00:00:00.000Z',
    ...overrides
  }
}

describe('site notice selection', () => {
  it('keeps the tracker site key and dismiss storage prefix', () => {
    expect(SITE_NOTICE_TRACKER_SITE).toBe('tracker')
    expect(SITE_NOTICE_DISMISS_PREFIX).toBe('vch.siteNotice.dismissed.')
    expect(siteNoticeDismissKey('abc')).toBe('vch.siteNotice.dismissed.abc')
  })

  it('shows only active tracker notices inside the optional window', () => {
    const now = new Date('2026-09-06T18:00:00.000Z')

    expect(isSiteNoticeLive(notice(), now)).toBe(true)
    expect(isSiteNoticeLive(notice({ active: false }), now)).toBe(false)
    expect(isSiteNoticeLive(notice({ sites: ['hub'] }), now)).toBe(false)
    expect(isSiteNoticeLive(notice({ starts_at: '2026-09-06T19:00:00.000Z' }), now)).toBe(false)
    expect(isSiteNoticeLive(notice({ ends_at: '2026-09-06T17:00:00.000Z' }), now)).toBe(false)
    expect(isSiteNoticeLive(notice({
      starts_at: '2026-09-06T17:00:00.000Z',
      ends_at: '2026-09-06T19:00:00.000Z'
    }), now)).toBe(true)
  })

  it('picks one notice by priority, then newest updated_at, then created_at', () => {
    const newerUpdated = notice({
      id: 'newer-updated',
      priority: 2,
      updated_at: '2026-09-05T12:00:00.000Z',
      created_at: '2026-09-01T00:00:00.000Z'
    })
    const olderUpdated = notice({
      id: 'older-updated',
      priority: 2,
      updated_at: '2026-09-04T12:00:00.000Z',
      created_at: '2026-09-03T00:00:00.000Z'
    })
    const lowerPriority = notice({
      id: 'low',
      priority: 1,
      updated_at: '2026-09-06T12:00:00.000Z'
    })
    const sameStampNewerCreated = notice({
      id: 'newer-created',
      priority: 2,
      updated_at: '2026-09-05T12:00:00.000Z',
      created_at: '2026-09-02T00:00:00.000Z'
    })

    expect(selectSiteNotice([lowerPriority, olderUpdated, newerUpdated])?.id).toBe('newer-updated')
    expect(compareSiteNotices(sameStampNewerCreated, newerUpdated) < 0).toBe(true)
    expect(selectSiteNotice([newerUpdated, sameStampNewerCreated])?.id).toBe('newer-created')
  })

  it('skips dismissed notices and keeps the next live banner', () => {
    const first = notice({ id: 'first', priority: 5 })
    const second = notice({ id: 'second', priority: 1 })

    expect(selectSiteNotice([first, second], {
      isDismissed: (id) => id === 'first'
    })?.id).toBe('second')
  })

  it('builds a live tracker preview notice', () => {
    const preview = buildPreviewSiteNotice()
    expect(preview.sites).toContain('tracker')
    expect(isSiteNoticeLive(preview, new Date('2026-09-06T18:00:00.000Z'))).toBe(true)
    expect(selectSiteNotice([preview])?.id).toBe('preview-tracker-notice')
  })

  it('writes the shared dismiss key', () => {
    const store = new Map<string, string>()
    persistSiteNoticeDismissal('abc', {
      setItem(key, value) {
        store.set(key, value)
      }
    })
    expect(store.get('vch.siteNotice.dismissed.abc')).toBe('1')
  })

  it('allows http(s) and same-origin paths only', () => {
    expect(sanitizeSiteNoticeLink('https://veteranscentralhub.com/status')).toBe(
      'https://veteranscentralhub.com/status'
    )
    expect(sanitizeSiteNoticeLink('/privacy')).toBe('/privacy')
    expect(sanitizeSiteNoticeLink('javascript:alert(1)')).toBe(null)
    expect(sanitizeSiteNoticeLink('')).toBe(null)
  })
})

describe('tracker site notice wiring', () => {
  it('mounts the muted amber badge banner above chrome and fetches public tracker notices', () => {
    const app = readFileSync('app/app.vue', 'utf8')
    const banner = readFileSync('app/components/VchSiteNoticeBanner.vue', 'utf8')
    const composable = readFileSync('app/composables/useSiteNotice.ts', 'utf8')
    const api = readFileSync('server/api/site-notices.get.ts', 'utf8')
    const css = readFileSync('app/assets/css/main.css', 'utf8')

    expect(app).toContain('<VchSiteNoticeBanner />')
    expect(banner).toContain('vch-site-notice-banner')
    expect(banner).toContain('Dismiss this notice')
    expect(banner).toContain('border border-current')
    expect(banner).not.toContain('#fff7ed')
    expect(composable).toContain("'/api/site-notices'")
    expect(api).toContain(".from('site_notices')")
    expect(api).toContain('SITE_NOTICE_TRACKER_SITE')
    expect(api).toContain("schema: 'public'")
    expect(css).toContain('--site-notice-height')
    expect(css).toContain('.vch-site-notice-banner')
    expect(css).toContain('var(--color-amber-500)')
    expect(css).toContain('var(--color-amber-900)')
    expect(css).toContain('html.dark .vch-site-notice-banner')
    expect(css).not.toContain('#7c2d12')
  })
})

describe('site notice copy', () => {
  it('avoids em dashes in new notice strings', () => {
    const files = [
      'shared/siteNotice.ts',
      'app/composables/useSiteNotice.ts',
      'app/components/VchSiteNoticeBanner.vue',
      'server/api/site-notices.get.ts'
    ]

    for (const file of files) {
      assert.equal(readFileSync(file, 'utf8').includes('—'), false, file)
    }
  })
})
