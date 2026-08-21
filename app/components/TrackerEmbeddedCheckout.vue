<template>
  <Teleport :to="teleportTarget">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="inset-0 z-[110] flex flex-col bg-slate-950/95 backdrop-blur-sm"
        :class="positionClass"
      >
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Secure checkout</p>
            <h2 class="mt-1 text-lg font-bold text-white">Symptom Tracker Pro — {{ PRO_ANNUAL_PRICE_LABEL }}</h2>
            <p class="mt-1 text-xs leading-5 text-slate-400">
              {{ PRO_REFUND_POLICY }}
            </p>
          </div>
          <button
            type="button"
            class="grid size-10 place-items-center rounded-full bg-slate-900 text-slate-300 ring-1 ring-slate-800 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close checkout"
            :disabled="isLoading || isCompletingCheckout"
            @click="handleClose"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </header>

        <div class="flex flex-1 flex-col overflow-hidden">
          <div
            v-if="isLoading || isCompletingCheckout"
            class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
          >
            <VchOpeningWorkspaceLoader
              :full-screen="false"
              :show-brand="false"
              :label="loadingMessage"
            />
          </div>

          <div
            v-else-if="errorMessage"
            class="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
          >
            <div class="rounded-3xl border border-red-900/60 bg-red-950/30 px-5 py-4">
              <p class="text-sm leading-6 text-red-200">{{ errorMessage }}</p>
            </div>
            <button
              type="button"
              class="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950"
              @click="initializeCheckout"
            >
              Try again
            </button>
            <button
              type="button"
              class="rounded-2xl bg-amber-400/15 px-5 py-3 text-sm font-bold text-amber-100 ring-1 ring-amber-400/40"
              @click="emitFallback"
            >
              Continue in Stripe checkout
            </button>
          </div>

          <div
            ref="checkoutMountElement"
            class="min-h-0 flex-1 overflow-y-auto bg-white"
            :class="{ hidden: isLoading || isCompletingCheckout || errorMessage }"
          />
        </div>

        <p class="shrink-0 border-t border-slate-800 px-4 py-3 text-center text-[0.68rem] leading-5 text-slate-500 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          Payments processed by Stripe. {{ PRO_CHECKOUT_SUBMIT_MESSAGE }}
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onUnmounted, ref, watch } from 'vue'
import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js'
import { useEntitlements } from '../composables/useEntitlements'
import { TRACKER_EMBED_KEY } from '../composables/useTrackerLayout'
import { PRO_ANNUAL_PRICE_LABEL, PRO_CHECKOUT_SUBMIT_MESSAGE, PRO_REFUND_POLICY } from '../utils/subscription'

const CHECKOUT_SUCCESS_TOAST_KEY = 'symptom-tracker-checkout-success-toast'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  error: [message: string]
  fallback: []
}>()

const isEmbeddedPreview = inject(TRACKER_EMBED_KEY, false)
const teleportTarget = computed(() => (isEmbeddedPreview ? '#tracker-app-shell' : 'body'))
const positionClass = computed(() => (isEmbeddedPreview ? 'absolute' : 'fixed'))

const config = useRuntimeConfig()
const { activateCheckoutSession, createEmbeddedCheckoutSession, loadEntitlements } = useEntitlements()

const checkoutMountElement = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const isCompletingCheckout = ref(false)
const errorMessage = ref('')
const activeSessionId = ref('')
let embeddedCheckout: StripeEmbeddedCheckout | null = null

const loadingMessage = computed(() => (
  isCompletingCheckout.value
    ? 'Payment received — activating Pro...'
    : 'Loading secure payment form...'
))

function destroyCheckout() {
  if (embeddedCheckout) {
    embeddedCheckout.destroy()
    embeddedCheckout = null
  }
}

function handleClose() {
  destroyCheckout()
  emit('close')
}

function emitFallback() {
  destroyCheckout()
  emit('fallback')
}

async function handleCheckoutComplete() {
  const sessionId = activeSessionId.value

  isCompletingCheckout.value = true

  if (sessionId) {
    try {
      await activateCheckoutSession(sessionId)
      await loadEntitlements({ force: true })
      window.sessionStorage.setItem(CHECKOUT_SUCCESS_TOAST_KEY, '1')
    } catch (error) {
      console.error('[checkout] embedded completion activation failed', {
        sessionId,
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }

  destroyCheckout()
  emit('close')

  if (sessionId) {
    window.location.assign(`/upgrade/success?session_id=${encodeURIComponent(sessionId)}`)
    return
  }

  window.location.assign('/upgrade/success')
}

async function initializeCheckout() {
  if (!import.meta.client || !props.open) {
    return
  }

  destroyCheckout()
  isLoading.value = true
  errorMessage.value = ''
  activeSessionId.value = ''

  try {
    const publishableKey = config.public.stripePublishableKey

    if (!publishableKey) {
      throw new Error('Stripe publishable key is not configured.')
    }

    const stripe = await loadStripe(publishableKey)

    if (!stripe) {
      throw new Error('Could not load Stripe.')
    }

    const session = await createEmbeddedCheckoutSession()
    activeSessionId.value = session.sessionId

    const checkout = await stripe.initEmbeddedCheckout({
      clientSecret: session.clientSecret,
      onComplete: handleCheckoutComplete
    })

    isLoading.value = false
    await nextTick()

    if (!checkoutMountElement.value) {
      throw new Error('Checkout container was not ready.')
    }

    checkout.mount(checkoutMountElement.value)
    embeddedCheckout = checkout
  } catch (error) {
    isLoading.value = false
    errorMessage.value = error instanceof Error ? error.message : 'Could not load checkout.'
    emit('error', errorMessage.value)
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await initializeCheckout()
    return
  }

  destroyCheckout()
  errorMessage.value = ''
  isLoading.value = false
  isCompletingCheckout.value = false
  activeSessionId.value = ''
})

onUnmounted(() => {
  destroyCheckout()
})
</script>
