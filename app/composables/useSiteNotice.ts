import { computed, useAsyncData, useRoute, useState } from '#imports'
import {
  buildPreviewSiteNotice,
  isSiteNoticeDismissed,
  persistSiteNoticeDismissal,
  selectSiteNotice,
  type SiteNoticeRow
} from '#shared/siteNotice'

type SiteNoticeResponse = {
  notices?: SiteNoticeRow[]
}

async function fetchSiteNotices() {
  try {
    return await $fetch<SiteNoticeResponse>('/api/site-notices')
  } catch {
    return { notices: [] as SiteNoticeRow[] }
  }
}

export function useSiteNotice() {
  const route = useRoute()
  const dismissedIds = useState<string[]>('vch-site-notice-dismissed-ids', () => [])
  const { data, status, refresh } = useAsyncData('vch-site-notices', fetchSiteNotices)

  const notices = computed(() => {
    if (import.meta.dev && String(route.query.siteNoticePreview || '') === '1') {
      return [buildPreviewSiteNotice()]
    }

    return Array.isArray(data.value?.notices) ? data.value.notices : []
  })
  const notice = computed(() => selectSiteNotice(notices.value, {
    isDismissed: (id) => dismissedIds.value.includes(id)
      || (import.meta.client && isSiteNoticeDismissed(id))
  }))
  const loaded = computed(() => status.value !== 'pending')

  function dismissNotice() {
    const current = notice.value
    if (!current?.dismissible) {
      return
    }

    persistSiteNoticeDismissal(current.id)
    if (!dismissedIds.value.includes(current.id)) {
      dismissedIds.value = [...dismissedIds.value, current.id]
    }
  }

  return {
    notice,
    loaded,
    refreshSiteNotices: refresh,
    dismissNotice
  }
}
