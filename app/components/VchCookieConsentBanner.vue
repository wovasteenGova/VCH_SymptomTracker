<script setup lang="ts">
import { acceptVchCookieConsent, hasVchCookieConsent } from '../utils/vchCookieConsent'
import { useVchPublicUrls } from '../composables/useVchPublicUrls'

const { cookiesUrl } = useVchPublicUrls()
const visible = ref(false)

onMounted(() => {
  visible.value = !hasVchCookieConsent()
})

function acceptCookies() {
  acceptVchCookieConsent()
  visible.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-[120] border-t border-default bg-elevated p-4 shadow-[0_-8px_30px_rgb(0_0_0/0.12)]"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div class="flex items-center gap-4">
          <UIcon name="i-lucide-cookie" class="size-8 shrink-0 text-primary" />
          <p class="text-sm leading-6 text-toned">
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <a
            :href="cookiesUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-toned transition hover:bg-accented"
          >
            Learn more
          </a>
          <button
            type="button"
            class="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            @click="acceptCookies"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
