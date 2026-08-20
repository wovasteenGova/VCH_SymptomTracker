<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <SubmissionToast />
    <PwaInstallPrompt />
    <VchCookieConsentBanner />
  </UApp>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
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
