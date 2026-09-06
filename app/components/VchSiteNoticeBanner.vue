<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { sanitizeSiteNoticeLink } from '#shared/siteNotice'

const { notice, dismissNotice } = useSiteNotice()

const bannerEl = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const linkHref = computed(() => sanitizeSiteNoticeLink(notice.value?.link_url))
const linkLabel = computed(() => {
  const label = String(notice.value?.link_label || '').trim()
  return label || 'Learn more'
})

function syncSiteNoticeHeight() {
  if (typeof document === 'undefined') {
    return
  }

  const height = notice.value ? bannerEl.value?.offsetHeight ?? 0 : 0
  document.documentElement.style.setProperty('--site-notice-height', `${height}px`)
}

function dismiss() {
  dismissNotice()
  void nextTick(syncSiteNoticeHeight)
}

onMounted(() => {
  syncSiteNoticeHeight()

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      syncSiteNoticeHeight()
    })
    if (bannerEl.value) {
      resizeObserver.observe(bannerEl.value)
    }
  }

  window.addEventListener('resize', syncSiteNoticeHeight)
})

watch(notice, async () => {
  await nextTick()
  if (bannerEl.value && resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver.observe(bannerEl.value)
  }
  syncSiteNoticeHeight()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', syncSiteNoticeHeight)
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--site-notice-height', '0px')
  }
})
</script>

<template>
  <div
    v-if="notice"
    ref="bannerEl"
    class="vch-site-notice-banner sticky top-0 z-[85] w-full shrink-0 pt-[env(safe-area-inset-top,0px)]"
    role="status"
    aria-live="polite"
  >
    <div class="mx-auto flex max-w-5xl items-start justify-between gap-3 px-3 py-2.5 sm:items-center sm:px-4">
      <p class="min-w-0 flex-1 text-[0.8125rem] leading-5 text-[#fff7ed] sm:text-center sm:text-sm sm:leading-6">
        <strong v-if="notice.title" class="font-bold">{{ notice.title }}</strong>
        <span v-if="notice.title && notice.message">
          {{ ' ' }}
        </span>
        <span v-if="notice.message">{{ notice.message }}</span>
        <a
          v-if="linkHref"
          :href="linkHref"
          class="ml-2 inline underline decoration-[#fff7ed] decoration-1 underline-offset-2 hover:decoration-2"
          target="_blank"
          rel="noopener noreferrer"
        >{{ linkLabel }}</a>
      </p>
      <button
        v-if="notice.dismissible"
        type="button"
        class="grid size-8 shrink-0 place-items-center rounded-full text-[#fff7ed] transition hover:bg-white/10"
        aria-label="Dismiss this notice"
        @click="dismiss"
      >
        <UIcon name="i-lucide-x" class="size-4" />
      </button>
    </div>
  </div>
</template>
