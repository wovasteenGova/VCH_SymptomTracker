<template>
  <ClientOnly>
    <Transition name="app-splash-fade">
      <div
        v-if="showVueSplash"
        class="app-splash-overlay bg-default"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div class="app-splash-stack">
          <div class="app-splash-brand">
            <img
              src="/brand/vch-symptom-tracker-logo.png"
              alt="VCH Symptom Tracker"
              class="app-splash-logo ring-1 ring-default shadow-sm"
              decoding="async"
            >
            <span class="app-splash-wordmark text-default">VCH</span>
          </div>
          <img
            src="/vch-tank-loader.svg"
            alt=""
            class="app-splash-art"
            decoding="async"
          >
        </div>
      </div>
    </Transition>
  </ClientOnly>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <SubmissionToast />
    <PwaInstallPrompt />
    <VchCookieConsentBanner />
  </UApp>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { isIosWebKitBrowser, resolveMobileViewport } from './utils/mobileViewport'
import {
  dismissTrackerStaticSplash,
  isTrackerStaticSplashPresent,
  shouldShowVueAppSplash
} from './utils/trackerSplash'

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
const { homeWorkspaceReady, splashDismissed } = useHomeWorkspaceReady()

const waitsForHomeBootstrap = computed(() => route.path === '/')
const nonHomeSplashVisible = ref(true)
const staticSplashPresent = computed(() => isTrackerStaticSplashPresent())

const showVueSplash = computed(() => shouldShowVueAppSplash({
  isClient: import.meta.client,
  staticSplashPresent: staticSplashPresent.value,
  splashDismissed: splashDismissed.value,
  isHomeRoute: waitsForHomeBootstrap.value,
  homeWorkspaceReady: homeWorkspaceReady.value,
  nonHomeSplashVisible: nonHomeSplashVisible.value
}))

function dismissBootSplash() {
  splashDismissed.value = true
  nonHomeSplashVisible.value = false
  dismissTrackerStaticSplash()
}

watch(homeWorkspaceReady, (ready) => {
  if (ready) {
    dismissBootSplash()
  }
})

watch(splashDismissed, (dismissed) => {
  if (dismissed) {
    dismissTrackerStaticSplash()
  }
}, { immediate: true })

const CHECKOUT_SUCCESS_TOAST_KEY = 'symptom-tracker-checkout-success-toast'
let visualBaselineHeight = 0

function editableFocused() {
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false

  return active.matches('input:not([type="hidden"]), textarea, select, [contenteditable="true"]')
}

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
  if (!waitsForHomeBootstrap.value) {
    dismissBootSplash()
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
.app-splash-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.app-splash-stack {
  display: flex;
  width: min(28rem, 92vw);
  max-width: 32rem;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.app-splash-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.app-splash-logo {
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  border-radius: 9999px;
  object-fit: cover;
  object-position: center;
}

.app-splash-wordmark {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.12em;
}

.app-splash-art {
  width: 100%;
  height: auto;
  user-select: none;
}

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
