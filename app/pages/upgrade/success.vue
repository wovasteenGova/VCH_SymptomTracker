<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:max-w-lg">
      <div class="rounded-4xl border border-slate-800 bg-slate-900 p-6 text-center">
        <div
          class="mx-auto grid size-16 place-items-center rounded-full"
          :class="iconShellClass"
        >
          <UIcon :name="iconName" :class="iconClass" />
        </div>

        <h1 class="mt-5 text-2xl font-bold text-white">
          {{ headline }}
        </h1>

        <p class="mt-3 text-sm leading-6 text-slate-300">
          {{ bodyCopy }}
        </p>

        <p v-if="statusMessage" class="mt-4 text-xs leading-5 text-slate-400">{{ statusMessage }}</p>
        <p v-if="pageError" class="mt-4 text-sm font-medium text-red-300">{{ pageError }}</p>

        <div class="mt-6 space-y-3">
          <NuxtLink
            to="/"
            class="block w-full rounded-2xl bg-white px-5 py-4 text-base font-bold text-slate-950 transition hover:bg-slate-200"
          >
            {{ isPro ? 'Start tracking' : 'Back to app' }}
          </NuxtLink>
          <button
            v-if="!isPro && checkoutSessionId && user"
            type="button"
            class="block w-full rounded-2xl bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-100 ring-1 ring-amber-400/40 transition hover:bg-amber-500/25"
            :disabled="isSyncing"
            @click="retrySync"
          >
            {{ isSyncing ? 'Activating Pro...' : 'Activate Pro now' }}
          </button>
          <NuxtLink
            v-else-if="!user && !isAuthLoading && checkoutSessionId"
            to="/?login=1"
            class="block w-full rounded-2xl bg-amber-500/15 px-4 py-3 text-sm font-bold text-amber-100 ring-1 ring-amber-400/40 transition hover:bg-amber-500/25"
          >
            Sign in to activate Pro
          </NuxtLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCheckoutCompletion } from '../../composables/useCheckoutCompletion'
import { useSupabaseAuth } from '../../composables/useSupabaseAuth'
import { useEntitlements } from '../../composables/useEntitlements'
import { PRO_ANNUAL_PRICE_LABEL } from '../../utils/subscription'

const route = useRoute()
const { user, isAuthLoading } = useSupabaseAuth()
const { isPro } = useEntitlements()
const { showSubmissionToast } = useSubmissionToast()
const hasShownProToast = ref(false)

const {
  checkoutSessionId,
  pageError,
  isSyncing,
  syncAttempts,
  paymentReceived,
  maxSyncAttempts,
  syncProAccess,
  runCheckoutCompletionLoop
} = useCheckoutCompletion()

const showThankYou = computed(() => paymentReceived.value || isPro.value)

const iconShellClass = computed(() => {
  if (isPro.value || showThankYou.value) {
    return 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
  }

  if (pageError.value && syncAttempts.value >= maxSyncAttempts) {
    return 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40'
  }

  return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
})

const iconName = computed(() => {
  if (isPro.value || showThankYou.value) {
    return 'i-lucide-check-circle'
  }

  if (pageError.value && syncAttempts.value >= maxSyncAttempts) {
    return 'i-lucide-alert-circle'
  }

  return 'i-lucide-loader-circle'
})

const iconClass = computed(() => {
  return iconName.value === 'i-lucide-loader-circle' ? 'size-8 animate-spin' : 'size-8'
})

const headline = computed(() => {
  if (isPro.value) {
    return 'Welcome to Pro'
  }

  if (showThankYou.value) {
    return 'Thank you: payment received'
  }

  if (!checkoutSessionId.value) {
    return 'Checkout session missing'
  }

  return 'Confirming payment...'
})

const bodyCopy = computed(() => {
  if (isPro.value) {
    return 'Your subscription is active. Unlimited entries, family reporting, and PDF exports are ready.'
  }

  if (showThankYou.value) {
    return `We received your ${PRO_ANNUAL_PRICE_LABEL} payment. Pro activates in a few seconds.`
  }

  if (!checkoutSessionId.value) {
    return 'If you paid, contact us with your receipt and we will activate Pro manually.'
  }

  if (!user.value && !isAuthLoading.value) {
    return 'Sign in with the same account you used at checkout.'
  }

  return 'Please wait while we confirm your subscription.'
})

const statusMessage = computed(() => {
  if (isPro.value) {
    return 'Thank you for helping fund the Claim Maker build.'
  }

  if (showThankYou.value && syncAttempts.value >= maxSyncAttempts && !isPro.value) {
    return 'Pro is still syncing. Tap Activate Pro now or contact support with your receipt.'
  }

  if (showThankYou.value && !isPro.value) {
    return 'Activating Pro on your account...'
  }

  return ''
})

async function startCompletion() {
  if (!checkoutSessionId.value) {
    return
  }

  await runCheckoutCompletionLoop()
}

async function retrySync() {
  pageError.value = ''
  syncAttempts.value = 0
  await syncProAccess()
}

onMounted(async () => {
  await startCompletion()
})

watch([user, isAuthLoading, () => route.query.session_id], async ([currentUser, loading]) => {
  if (!loading && currentUser && checkoutSessionId.value) {
    await startCompletion()
  }
})

watch(isPro, (active) => {
  if (active) {
    paymentReceived.value = true

    if (!hasShownProToast.value) {
      hasShownProToast.value = true
      showSubmissionToast({
        message: "Payment successful. You're now on Pro.",
        durationMs: 3200
      })
    }
  }
})
</script>
