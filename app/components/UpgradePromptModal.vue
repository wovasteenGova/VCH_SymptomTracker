<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="open"
      @dismiss="emit('close')"
    >
      <div class="app-overlay-panel app-overlay-panel--compact rounded-[1.75rem] border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Pro feature</p>
            <h3 class="mt-2 text-xl font-bold text-white">{{ title }}</h3>
          </div>
          <button
            type="button"
            class="grid size-9 place-items-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700"
            aria-label="Close"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </div>

        <p class="mt-3 text-sm leading-6 text-slate-300">
          {{ description }}
        </p>

        <ul class="mt-4 space-y-2">
          <li
            v-for="feature in PRO_TIER_FEATURES"
            :key="feature"
            class="flex items-start gap-2 text-sm text-slate-200"
          >
            <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <p class="mt-4 rounded-2xl border border-sky-900/60 bg-sky-950/30 px-4 py-3 text-xs leading-5 text-sky-100">
          {{ PRO_ANNUAL_PRICE_LABEL }} helps fund the upcoming VCH Claim Maker build. It is not live yet. Pro subscriptions help cover development until it ships.
        </p>

        <p class="mt-3 text-xs leading-5 text-slate-400">
          {{ PRO_REFUND_POLICY_SHORT }} · {{ PRO_ANNUAL_PRICE_LABEL }}
        </p>

        <div class="mt-5 grid gap-3">
          <p class="text-center text-[0.68rem] font-medium text-slate-500">
            Secure payments by
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              class="font-bold text-slate-400 no-underline transition hover:text-slate-300"
            >Stripe</a>
          </p>
          <button
            type="button"
            class="w-full rounded-2xl bg-amber-400 px-4 py-4 text-base font-bold text-slate-950 transition hover:bg-amber-300"
            :disabled="isCheckoutLoading"
            @click="emit('upgrade')"
          >
            {{ isCheckoutLoading ? 'Continue to checkout...' : `Upgrade: ${PRO_ANNUAL_PRICE_LABEL}` }}
          </button>
          <NuxtLink
            to="/upgrade"
            class="block w-full rounded-2xl bg-slate-800 px-4 py-3 text-center text-sm font-bold text-white ring-1 ring-slate-700"
            @click="emit('close')"
          >
            See full plan details
          </NuxtLink>
          <a
            :href="contactUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="block text-center text-xs font-semibold text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
          >
            Can't pay? Contact us for free access
          </a>
        </div>
      </div>
    </AppOverlayShell>
  </Transition>
</template>

<script setup lang="ts">
import { PRO_ANNUAL_PRICE_LABEL, PRO_REFUND_POLICY_SHORT, PRO_TIER_FEATURES } from '../utils/subscription'
import { useVchPublicUrls } from '../composables/useVchPublicUrls'

defineProps<{
  open: boolean
  title: string
  description: string
  isCheckoutLoading?: boolean
}>()

const emit = defineEmits<{
  close: []
  upgrade: []
}>()

const { contactUrl } = useVchPublicUrls()
</script>
