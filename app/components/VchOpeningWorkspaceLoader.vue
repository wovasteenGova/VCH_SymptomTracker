<script setup lang="ts">
import { reportBranding } from '../utils/reportBranding'

withDefaults(defineProps<{
  label?: string
  /** When false, sits in normal flow (e.g. inside a card). Default centers in the viewport. */
  fullScreen?: boolean
  /**
   * Logo + VCH above the animated logo loader SVG.
   * Use on workspace / main loaders — keep off for login / auth redirects.
   */
  showBrand?: boolean
}>(), {
  label: 'Setting up workspace',
  fullScreen: true,
  showBrand: true
})
</script>

<template>
  <!--
    Fullscreen: Teleport to body + fixed inset-0 so centering is always relative to the
    viewport (not a short flex parent, sticky header stack, or transform containing block).
  -->
  <Teleport
    v-if="fullScreen"
    to="body"
  >
    <div
      class="vch-opening-workspace-loader vch-opening-workspace-loader--fullscreen fixed inset-0 z-[80] flex h-dvh w-screen items-center justify-center bg-default px-4"
      role="status"
      aria-live="polite"
      :aria-label="`${label}…`"
    >
      <div class="flex w-full max-w-[min(100%,22rem)] flex-col items-center justify-center gap-4">
        <div
          v-if="showBrand"
          class="vch-opening-workspace-loader__brand flex items-center justify-center gap-3"
        >
          <img
            :src="reportBranding.logoPath"
            :alt="reportBranding.organizationName"
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
          aria-hidden="true"
          class="vch-opening-workspace-loader__tank mx-auto w-full select-none"
          decoding="async"
        >
        <p class="vch-opening-workspace-loader__label text-center text-sm font-semibold tracking-wide text-muted">
          {{ label }}<span
            class="vch-opening-workspace-loader__dots"
            aria-hidden="true"
          ><span>.</span><span>.</span><span>.</span></span>
        </p>
      </div>
    </div>
  </Teleport>

  <div
    v-else
    class="vch-opening-workspace-loader flex min-h-[12rem] w-full flex-col items-center justify-center gap-4 px-4 py-8"
    role="status"
    aria-live="polite"
    :aria-label="`${label}…`"
  >
    <div
      v-if="showBrand"
      class="vch-opening-workspace-loader__brand flex items-center justify-center gap-3"
    >
      <img
        :src="reportBranding.logoPath"
        :alt="reportBranding.organizationName"
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
      aria-hidden="true"
      class="vch-opening-workspace-loader__tank mx-auto w-full max-w-[min(100%,22rem)] select-none"
      decoding="async"
    >
    <p class="vch-opening-workspace-loader__label text-center text-sm font-semibold tracking-wide text-muted">
      {{ label }}<span
        class="vch-opening-workspace-loader__dots"
        aria-hidden="true"
      ><span>.</span><span>.</span><span>.</span></span>
    </p>
  </div>
</template>

<style scoped>
.vch-opening-workspace-loader__dots span {
  animation: vch-opening-dot 1.2s linear infinite;
  opacity: 0;
}

.vch-opening-workspace-loader__dots span:nth-child(1) {
  animation-delay: 0s;
}

.vch-opening-workspace-loader__dots span:nth-child(2) {
  animation-delay: 0.25s;
}

.vch-opening-workspace-loader__dots span:nth-child(3) {
  animation-delay: 0.5s;
}

@keyframes vch-opening-dot {
  0%, 24% {
    opacity: 0;
  }

  25%, 99% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
