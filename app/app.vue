<template>
  <UApp>
    <Transition name="app-splash-fade">
      <div
        v-if="showAppSplash"
        class="fixed inset-0 z-[100] grid place-items-center bg-default px-4"
        aria-hidden="true"
      >
        <div class="flex w-full max-w-[min(28rem,92vw)] flex-col items-center gap-4 sm:max-w-[32rem]">
          <div class="flex items-center justify-center gap-3">
            <img
              src="/brand/vch-symptom-tracker-logo.png"
              alt="VCH Symptom Tracker"
              class="size-11 shrink-0 rounded-full object-cover object-center ring-1 ring-default shadow-sm"
              decoding="async"
            >
            <span class="text-[2rem] font-semibold leading-none tracking-[0.12em] text-default">
              VCH
            </span>
          </div>
          <img
            src="/vch-tank-loader.svg"
            alt=""
            class="w-full select-none"
            decoding="async"
          >
        </div>
      </div>
    </Transition>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <SubmissionToast v-if="showGlobalSubmissionToast" />
    <PwaInstallPrompt />
    <VchCookieConsentBanner />
  </UApp>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { isIosWebKitBrowser, resolveMobileViewport } from './utils/mobileViewport'

const { themeId } = useClaimColorTheme()

useHead(() => ({
  htmlAttrs: {
    lang: 'en',
    'data-theme': themeId.value
  }
}))

const { showSubmissionToast } = useSubmissionToast()
const supabase = useSupabaseClient()
const route = useRoute()
const { homeWorkspaceReady } = useHomeWorkspaceReady()
const isDesktopViewport = useMediaQuery('(min-width: 768px)')
const showGlobalSubmissionToast = computed(() => {
  if (route.path === '/' && isDesktopViewport.value) {
    return false
  }

  return true
})

const showAppSplash = ref(true)
const waitsForHomeBootstrap = computed(() => route.path === '/')
// Skip the splash when the page reloads shortly after showing it (e.g. the
// PWA service worker auto-update reload), so users don't see it twice.
const APP_SPLASH_REPLAY_WINDOW_MS = 60_000
const APP_SPLASH_SHOWN_AT_KEY = 'symptom-tracker-splash-shown-at'
const CHECKOUT_SUCCESS_TOAST_KEY = 'symptom-tracker-checkout-success-toast'
let visualBaselineHeight = 0

function editableFocused() {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false

  return active.matches('input:not([type="hidden"]), textarea, select, [contenteditable="true"]')
}

function dismissAppSplash() {
  showAppSplash.value = false
}

onBeforeMount(() => {
  updateAppHeight()

  if (waitsForHomeBootstrap.value && homeWorkspaceReady.value) {
    showAppSplash.value = false
    return
  }

  if (waitsForHomeBootstrap.value) {
    return
  }

  try {
    const shownAt = Number(window.sessionStorage.getItem(APP_SPLASH_SHOWN_AT_KEY) || 0)

    if (shownAt && Date.now() - shownAt < APP_SPLASH_REPLAY_WINDOW_MS) {
      showAppSplash.value = false
      return
    }

    window.sessionStorage.setItem(APP_SPLASH_SHOWN_AT_KEY, String(Date.now()))
  } catch {
    // sessionStorage unavailable (private mode edge cases) — keep default splash.
  }
})

watch(homeWorkspaceReady, (ready) => {
  if (ready && waitsForHomeBootstrap.value) {
    dismissAppSplash()
  }
})

function updateAppHeight() {
  if (typeof window === 'undefined') {
    return
  }

  const viewport = window.visualViewport
  const viewportHeight = viewport?.height ?? window.innerHeight
  const focused = editableFocused()

  if (!focused || visualBaselineHeight === 0 || viewportHeight > visualBaselineHeight) {
    visualBaselineHeight = viewportHeight
  }

  const resolution = resolveMobileViewport({
    layoutHeight: window.innerHeight,
    visualHeight: viewportHeight,
    visualOffsetTop: viewport?.offsetTop ?? 0,
    visualBaselineHeight,
    editableFocused: focused
  })
  const root = document.documentElement
  const iosWebKit = isIosWebKitBrowser({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints
  })

  root.style.setProperty('--app-height', `${resolution.height}px`)
  root.style.setProperty(
    '--app-offset-top',
    `${iosWebKit && resolution.keyboardOpen ? resolution.offsetTop : 0}px`
  )
  root.dataset.iosKeyboard = iosWebKit && resolution.keyboardOpen ? 'open' : 'closed'
}

onMounted(async () => {
  if (!waitsForHomeBootstrap.value || homeWorkspaceReady.value) {
    dismissAppSplash()
  }

  updateAppHeight()
  if (import.meta.client && window.sessionStorage.getItem(CHECKOUT_SUCCESS_TOAST_KEY)) {
    window.sessionStorage.removeItem(CHECKOUT_SUCCESS_TOAST_KEY)
    window.sessionStorage.removeItem('symptom-tracker-auth-success')
    showSubmissionToast({
      message: "Payment successful. You're now on Pro.",
      durationMs: 3200
    })
  } else if (import.meta.client && window.sessionStorage.getItem('symptom-tracker-auth-success')) {
    window.sessionStorage.removeItem('symptom-tracker-auth-success')

    const { data } = await supabase.auth.getSession()

    if (data.session) {
      showSubmissionToast('Signed in.')
    }
  }
  window.addEventListener('resize', updateAppHeight)
  window.addEventListener('orientationchange', updateAppHeight)
  window.addEventListener('focusin', updateAppHeight)
  window.visualViewport?.addEventListener('resize', updateAppHeight)
  window.visualViewport?.addEventListener('scroll', updateAppHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateAppHeight)
  window.removeEventListener('orientationchange', updateAppHeight)
  window.removeEventListener('focusin', updateAppHeight)
  window.visualViewport?.removeEventListener('resize', updateAppHeight)
  window.visualViewport?.removeEventListener('scroll', updateAppHeight)
})
</script>

<style>
.app-splash-fade-leave-active {
  transition: opacity 0.5s ease;
}

.app-splash-fade-leave-to {
  opacity: 0;
}

.tracker-app-shell:not(.tracker-app-shell--ready):not(.app-shell-embed) {
  opacity: 0;
}

.tracker-app-shell--ready {
  opacity: 1;
  transition: opacity 0.45s ease;
}
</style>
