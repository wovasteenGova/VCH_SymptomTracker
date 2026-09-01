<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-4 sm:max-w-lg">
      <header class="sticky top-0 z-40 -mx-4 flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4 pb-4 pt-4 backdrop-blur-md">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payment center</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-white">{{ pageTitle }}</h1>
        </div>

        <NuxtLink
          to="/"
          class="grid size-10 place-items-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-slate-800 transition hover:bg-slate-800"
          aria-label="Back to tracker"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
        </NuxtLink>
      </header>

      <div class="mt-6 flex-1 space-y-5 overflow-y-auto no-scrollbar pb-28">
        <section
          v-if="showCanceledNotice"
          class="rounded-3xl border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm leading-6 text-amber-100"
        >
          Checkout was canceled. You can try again whenever you're ready.
        </section>

        <section v-if="!isPro" class="rounded-4xl border border-sky-900/50 bg-sky-950/20 p-5">
          <div class="flex items-start gap-3">
            <div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/30">
              <UIcon name="i-lucide-heart-handshake" class="size-5" />
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Why we charge</p>
              <p class="mt-2 text-sm leading-6 text-sky-50">
                {{ WHY_WE_CHARGE_COPY }}
              </p>
              <a
                :href="claimMakerUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-100 ring-1 ring-sky-500/30 underline-offset-2 hover:underline"
              >
                Visit upcoming Claim Maker on VCH
                <UIcon name="i-lucide-arrow-up-right" class="size-3.5" />
              </a>
            </div>
          </div>
        </section>

        <section v-if="user && isPro" class="rounded-4xl border border-amber-500/40 bg-amber-500/10 p-5">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-crown" class="size-5 text-amber-300" />
            <h2 class="text-xl font-bold text-white">You're on Pro</h2>
          </div>
          <p class="mt-2 text-sm leading-6 text-amber-50/90">
            <span v-if="isClaimBuilderPro">
              Pro is included with your VCH Claim Maker subscription.
              <span v-if="claimBuilderFoundingProUntil"> Access until {{ claimBuilderFoundingProUntil }}.</span>
            </span>
            <span v-else-if="isComped">Your access was granted at no cost. Thank you for using the tracker.</span>
            <span v-else>
              Unlimited entries, family reporting, and PDF exports are unlocked
              <span v-if="renewalLabel"> until {{ renewalLabel }}</span>.
            </span>
          </p>
          <button
            v-if="canManageBilling"
            type="button"
            class="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white ring-1 ring-slate-700"
            :disabled="isPortalLoading"
            @click="handleManageBilling"
          >
            {{ isPortalLoading ? 'Opening billing...' : 'Manage billing' }}
          </button>
          <div
            v-else-if="isPro"
            class="mt-4 rounded-2xl border border-slate-700/80 bg-slate-900/60 px-4 py-3"
          >
            <p class="text-sm leading-6 text-slate-200">
              {{ billingPortalNotice }}
            </p>
            <a
              :href="supportEmailHref"
              class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 underline-offset-2 hover:underline"
            >
              Contact us
              <UIcon name="i-lucide-mail" class="size-4" />
            </a>
          </div>
        </section>

        <section v-if="user && !isPro" class="rounded-3xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Your usage</p>
          <p class="mt-1 text-sm text-slate-200">
            Free: 1 condition · unlimited entries · Entries only
          </p>
        </section>

        <div v-if="!isPro" class="grid gap-4">
          <article class="rounded-4xl border border-slate-800 bg-slate-900 p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Free</p>
                <h2 class="mt-1 text-2xl font-bold text-white">$0</h2>
                <p class="mt-1 text-xs text-slate-400">Try the tracker, no card required</p>
              </div>
              <span
                v-if="user && !isPro"
                class="rounded-full bg-sky-950 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-sky-200 ring-1 ring-sky-700/70"
              >
                Current
              </span>
            </div>

            <ul class="mt-5 space-y-3">
              <li
                v-for="feature in FREE_TIER_FEATURES"
                :key="feature"
                class="flex items-start gap-2 text-sm text-slate-300"
              >
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-slate-500" />
                <span>{{ feature }}</span>
              </li>
            </ul>
          </article>

          <article class="relative overflow-hidden rounded-4xl border border-amber-500/50 bg-gradient-to-b from-amber-500/15 to-slate-900 p-5 shadow-lg shadow-amber-500/10">
            <div class="absolute right-4 top-4 rounded-full bg-amber-400 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-950">
              Recommended
            </div>

            <div class="flex items-start justify-between gap-3 pr-24">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Pro</p>
                <h2 class="mt-1 text-2xl font-bold text-white">{{ PRO_ANNUAL_PRICE_LABEL }}</h2>
                <p class="mt-1 text-xs text-amber-100/80">{{ PRO_ANNUAL_PRICE_DETAIL }} · renews monthly</p>
                <p class="mt-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-50">
                  {{ PRO_REFUND_POLICY }}
                </p>
                <p class="mt-2 text-xs leading-5 text-amber-100/90">
                  Remember months of symptoms before your next exam — not during it.
                </p>
              </div>
            </div>

            <ul class="mt-5 space-y-3">
              <li
                v-for="feature in PRO_TIER_FEATURES"
                :key="feature"
                class="flex items-start gap-2 text-sm text-amber-50"
              >
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-amber-300" />
                <span>{{ feature }}</span>
              </li>
            </ul>

            <p class="mt-5 text-center">
              <button
                type="button"
                class="text-xs font-semibold text-emerald-300 underline-offset-2 transition hover:text-emerald-200 hover:underline"
                @click="scrollToCantPaySection"
              >
                Can't pay right now?
              </button>
            </p>
          </article>
        </div>

        <section v-if="!isPro" class="rounded-4xl border border-slate-800 bg-slate-900 p-5">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">How payment works</p>
          <ol class="mt-4 space-y-4">
            <li
              v-for="(step, index) in paymentSteps"
              :key="step.title"
              class="flex gap-3"
            >
              <span class="grid size-8 shrink-0 place-items-center rounded-full bg-slate-800 text-xs font-bold text-white ring-1 ring-slate-700">
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-semibold text-white">{{ step.title }}</p>
                <p class="mt-1 text-sm leading-6 text-slate-400">{{ step.body }}</p>
              </div>
            </li>
          </ol>
        </section>

        <section
          v-if="!isPro"
          id="cant-pay-section"
          class="scroll-mt-24 rounded-4xl border border-emerald-900/50 bg-emerald-950/20 p-5"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-hand-heart" class="mt-0.5 size-5 shrink-0 text-emerald-300" />
            <div>
              <h2 class="text-lg font-bold text-white">Can't pay right now?</h2>
              <p class="mt-2 text-sm leading-6 text-emerald-50/90">
                We built this for veterans first. If cost is a barrier, reach out and we'll unlock Pro for you — no shame, no proof required.
              </p>
              <div class="mt-4 flex flex-wrap gap-3">
                <a
                  :href="supportEmailHref"
                  class="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  <UIcon name="i-lucide-mail" class="size-4" />
                  Email for free access
                </a>
                <a
                  :href="contactUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white ring-1 ring-slate-700"
                >
                  Contact form
                  <UIcon name="i-lucide-arrow-up-right" class="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <div
          v-if="pageError"
          class="rounded-3xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-center text-sm leading-6 text-red-100"
        >
          <p>{{ pageError }}</p>
          <a
            :href="supportEmailHref"
            class="mt-2 inline-flex items-center gap-1.5 font-semibold text-red-50 underline-offset-2 hover:underline"
          >
            Contact us if you think something is wrong
          </a>
        </div>
      </div>

      <TrackerEmbeddedCheckout
        :open="isCheckoutOpen"
        @close="closeCheckout"
        @error="handleCheckoutError"
        @fallback="handleCheckoutFallback"
      />

      <StickyActionBar tone="dark">
        <p v-if="!isPro" class="mb-2 text-center text-[0.68rem] font-medium text-slate-500">
          Secure payments by
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            class="font-bold text-slate-400 no-underline transition hover:text-slate-300"
          >Stripe</a>
        </p>

        <button
          v-if="!user"
          type="button"
          class="w-full rounded-2xl bg-white px-5 py-4 text-base font-bold text-slate-950 shadow-lg transition hover:bg-slate-200"
          @click="router.push('/profile')"
        >
          Sign in to upgrade
        </button>

        <button
          v-else-if="!isPro"
          type="button"
          class="w-full rounded-2xl bg-amber-400 px-5 py-4 text-base font-bold text-slate-950 shadow-lg transition hover:bg-amber-300 disabled:opacity-60"
          :disabled="isCheckoutLoading"
          @click="handleUpgrade"
        >
          {{ isCheckoutLoading ? 'Loading checkout...' : `Upgrade to Pro — ${PRO_ANNUAL_PRICE_LABEL}` }}
        </button>

        <NuxtLink
          v-else
          to="/"
          class="block w-full rounded-2xl bg-white px-5 py-4 text-center text-base font-bold text-slate-950 shadow-lg transition hover:bg-slate-200"
        >
          Back to tracker
        </NuxtLink>

        <p v-if="!isPro" class="mt-3 text-center text-[0.68rem] leading-5 text-slate-500">
          {{ PRO_REFUND_POLICY_SHORT }} — cancel renewal anytime from billing settings.
        </p>
      </StickyActionBar>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseAuth } from '../composables/useSupabaseAuth'
import { readPendingCheckoutSession, useEntitlements } from '../composables/useEntitlements'
import {
  FREE_CONDITION_LIMIT,
  FREE_TIER_FEATURES,
  PRO_ANNUAL_PRICE_DETAIL,
  PRO_ANNUAL_PRICE_LABEL,
  PRO_REFUND_POLICY,
  PRO_REFUND_POLICY_SHORT,
  PRO_TIER_FEATURES,
  WHY_WE_CHARGE_COPY,
  buildSupportEmailHref
} from '../utils/subscription'
import { useVchPublicUrls } from '../composables/useVchPublicUrls'

const { claimMakerUrl, contactUrl } = useVchPublicUrls()

const route = useRoute()
const router = useRouter()
const { user, isAuthLoading } = useSupabaseAuth()
const {
  entitlement,
  isPro,
  isClaimBuilderPro,
  isComped,
  canManageBilling,
  claimBuilderFoundingPro,
  renewalLabel,
  loadEntitlements,
  openBillingPortal,
  startCheckout
} = useEntitlements()

const supportEmailHref = buildSupportEmailHref('Symptom Tracker — billing question')

const billingPortalNotice = computed(() => {
  if (isComped.value) {
    return 'Your Pro access was granted at no cost, so there is no Stripe subscription to manage here.'
  }

  if (isClaimBuilderPro.value) {
    return 'Pro is included with VCH Claim Maker, so billing is managed through Claim Maker — not here.'
  }

  return 'There is no active paid subscription linked to this account to manage here.'
})

const claimBuilderFoundingProUntil = computed(() => {
  const until = claimBuilderFoundingPro.value?.until

  if (!until) {
    return ''
  }

  const parsed = new Date(until)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const isCheckoutLoading = ref(false)
const isCheckoutOpen = ref(false)
const isPortalLoading = ref(false)
const pageError = ref('')

const showCanceledNotice = computed(() => route.query.canceled === '1')
const pageTitle = computed(() => isPro.value ? 'Your Pro plan' : 'Choose your plan')

const paymentSteps = [
  {
    title: 'Choose Pro',
    body: 'Tap upgrade — secure Stripe checkout opens in the app (card, Cash App, Google Pay when available).'
  },
  {
    title: 'Pay monthly',
    body: `${PRO_ANNUAL_PRICE_LABEL} (${PRO_ANNUAL_PRICE_DETAIL}). ${PRO_REFUND_POLICY} Renews automatically each month unless you cancel from billing settings.`
  },
  {
    title: 'Unlock instantly',
    body: 'Pro turns on right after payment: unlimited entries, family reporting links, and signed PDF exports.'
  },
  {
    title: 'Help finish Claim Maker',
    body: 'Your payment supports a self-funded build of the upcoming VCH Claim Maker — not live yet — so veterans can organize claims with more clarity when it ships.'
  }
]

function redirectPaidCheckoutToSuccess() {
  const querySessionId = typeof route.query.session_id === 'string' ? route.query.session_id : ''
  const sessionId = querySessionId || readPendingCheckoutSession()

  if (!sessionId) {
    return
  }

  void router.replace({
    path: '/upgrade/success',
    query: { session_id: sessionId }
  })
}

onMounted(async () => {
  redirectPaidCheckoutToSuccess()

  if (user.value) {
    await loadEntitlements()
  }

  if (route.query.checkout === '1' && user.value && !isPro.value) {
    openCheckout()
  }
})

watch(() => route.query.session_id, redirectPaidCheckoutToSuccess)

watch(user, async (currentUser) => {
  if (currentUser) {
    await loadEntitlements()

    if (route.query.checkout === '1' && !isPro.value && !isCheckoutOpen.value) {
      openCheckout()
    }
  }
})

watch(isAuthLoading, async (loading) => {
  if (!loading && user.value) {
    await loadEntitlements()

    if (route.query.checkout === '1' && !isPro.value && !isCheckoutOpen.value) {
      openCheckout()
    }
  }
})

async function openCheckout() {
  pageError.value = ''

  if (!user.value) {
    await router.push('/profile')
    return
  }

  isCheckoutOpen.value = true
}

watch(() => route.query.checkout, (value) => {
  if (value === '1' && user.value && !isPro.value) {
    openCheckout()
  }
})

function closeCheckout() {
  isCheckoutOpen.value = false
  isCheckoutLoading.value = false

  if (route.query.checkout === '1') {
    router.replace({ path: '/upgrade', query: {} })
  }
}

function handleCheckoutError(message: string) {
  pageError.value = message
}

async function handleCheckoutFallback() {
  isCheckoutOpen.value = false
  pageError.value = ''
  isCheckoutLoading.value = true

  try {
    await startCheckout()
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Could not start checkout.'
  } finally {
    isCheckoutLoading.value = false
  }
}

async function handleUpgrade() {
  pageError.value = ''
  isCheckoutLoading.value = true

  try {
    await openCheckout()
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Could not start checkout.'
  } finally {
    isCheckoutLoading.value = false
  }
}

async function handleManageBilling() {
  pageError.value = ''
  isPortalLoading.value = true

  try {
    await openBillingPortal()
  } catch (error) {
    pageError.value = error instanceof Error ? error.message : 'Could not open billing portal.'
  } finally {
    isPortalLoading.value = false
  }
}

function scrollToCantPaySection() {
  if (!import.meta.client) {
    return
  }

  document.getElementById('cant-pay-section')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}
</script>
