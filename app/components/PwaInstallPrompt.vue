<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  PWA_PROMOTION_DELAY_MS,
  browserIsStandalone,
  shouldOfferPwaPromotion
} from '../utils/pwaInstall'

const DISMISSED_AT_KEY = 'symptom-tracker-install-dismissed-at'

const route = useRoute()
const user = useSupabaseUser()
const onboardingComplete = useState('tracker-app-welcome-completed', () => false)
const {
  installPrompt,
  installed,
  platform,
  promptInstall
} = usePwaInstall()

const dismissedAt = ref<string | null>(null)
const delayElapsed = ref(false)
const interacted = ref(false)
const visible = ref(false)
const installing = ref(false)
let engagementTimer: ReturnType<typeof setTimeout> | undefined

const isIosGuide = computed(() => platform.value === 'ios-safari' && !installPrompt.value)
const eligible = computed(() => shouldOfferPwaPromotion({
  signedIn: Boolean(user.value),
  inApp: route.path === '/',
  onboardingComplete: onboardingComplete.value,
  engaged: delayElapsed.value && interacted.value,
  installPromptAvailable: Boolean(installPrompt.value),
  platform: platform.value,
  standalone: installed.value || browserIsStandalone(),
  dismissedAt: dismissedAt.value
}))

watch(eligible, (canShow) => {
  visible.value = canShow
}, { immediate: true })

function recordInteraction() {
  interacted.value = true
}

function rememberDismissal() {
  const value = String(Date.now())
  dismissedAt.value = value
  visible.value = false
  try {
    window.localStorage.setItem(DISMISSED_AT_KEY, value)
  } catch {
    // Private modes can deny storage; keeping it hidden for this session is enough.
  }
}

async function installApp() {
  if (!installPrompt.value || installing.value) return

  installing.value = true
  try {
    const choice = await promptInstall()
    visible.value = false
    if (choice?.outcome === 'dismissed') rememberDismissal()
  } finally {
    installing.value = false
  }
}

onMounted(() => {
  try {
    dismissedAt.value = window.localStorage.getItem(DISMISSED_AT_KEY)
  } catch {
    dismissedAt.value = null
  }

  engagementTimer = window.setTimeout(() => {
    delayElapsed.value = true
  }, PWA_PROMOTION_DELAY_MS)

  window.addEventListener('pointerdown', recordInteraction, { once: true, passive: true })
  window.addEventListener('keydown', recordInteraction, { once: true })
  window.addEventListener('touchstart', recordInteraction, { once: true, passive: true })
})

onBeforeUnmount(() => {
  if (engagementTimer) window.clearTimeout(engagementTimer)
  window.removeEventListener('pointerdown', recordInteraction)
  window.removeEventListener('keydown', recordInteraction)
  window.removeEventListener('touchstart', recordInteraction)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-5 opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="translate-y-5 opacity-0"
  >
    <section
      v-if="visible"
      class="fixed inset-x-3 z-[120] mx-auto max-w-md rounded-3xl border border-teal-200 bg-teal-50/95 p-5 text-slate-950 shadow-2xl backdrop-blur dark:border-teal-500/30 dark:bg-slate-900/95 dark:text-white sm:inset-x-auto sm:right-5 sm:w-[24rem]"
      :style="{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }"
      role="dialog"
      aria-labelledby="symptom-install-title"
      aria-describedby="symptom-install-description"
    >
      <div class="flex items-start gap-3">
        <img
          src="/pwa-192.png"
          alt=""
          class="size-12 shrink-0 rounded-2xl ring-1 ring-teal-200 dark:ring-slate-700"
        >
        <div class="min-w-0 flex-1">
          <h2 id="symptom-install-title" class="text-base font-bold">
            Install VCH Symptom Tracker
          </h2>
          <p id="symptom-install-description" class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add the tracker to your home screen for faster symptom logging.
          </p>
        </div>
        <button
          type="button"
          class="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Not now"
          @click="rememberDismissal"
        >
          <UIcon name="i-lucide-x" class="size-5" />
        </button>
      </div>

      <div
        v-if="isIosGuide"
        class="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      >
        In Safari, tap <strong class="text-slate-950 dark:text-white">Share</strong>, then choose
        <strong class="text-slate-950 dark:text-white">Add to Home Screen</strong>.
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
          @click="rememberDismissal"
        >
          Not now
        </button>
        <button
          v-if="installPrompt"
          type="button"
          class="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          :disabled="installing"
          @click="installApp"
        >
          {{ installing ? 'Opening…' : 'Install app' }}
        </button>
        <button
          v-else-if="isIosGuide"
          type="button"
          class="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          @click="rememberDismissal"
        >
          Got it
        </button>
      </div>
    </section>
  </Transition>
</template>
