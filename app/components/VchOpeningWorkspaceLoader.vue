<script setup lang="ts">
import { computed } from 'vue'
import { reportBranding } from '../utils/reportBranding'
import { pickTrackerLoaderSentence } from '../utils/trackerLoaderCopy'

const props = withDefaults(defineProps<{
  label?: string
  /** When false, sits in normal flow (e.g. inside a card). Default centers in the viewport. */
  fullScreen?: boolean
  /**
   * Logo + VCH above the animated tank loader.
   * Default on for homepage and auth loading screens.
   */
  showBrand?: boolean
}>(), {
  label: '',
  fullScreen: true,
  showBrand: true
})

// Pick once per mount so the caption stays stable for this load instance.
const fallbackLabel = pickTrackerLoaderSentence()
const statusLabel = computed(() => props.label.trim() || fallbackLabel)
const stackClass = computed(() =>
  props.fullScreen
    ? 'w-[min(28rem,92vw)] max-w-[32rem]'
    : 'w-full max-w-[15rem]'
)
const tankClass = computed(() =>
  props.fullScreen
    ? 'mx-auto w-full select-none'
    : 'mx-auto w-full max-w-[240px] select-none'
)
</script>

<template>
  <Teleport
    v-if="fullScreen"
    to="body"
  >
    <div
      class="vch-opening-workspace-loader vch-opening-workspace-loader--fullscreen fixed inset-0 z-[80] flex h-dvh w-screen items-center justify-center bg-default px-4"
      role="status"
      aria-live="polite"
      :aria-label="statusLabel"
    >
      <div
        class="flex flex-col items-center justify-center gap-4"
        :class="stackClass"
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
          :class="tankClass"
          decoding="async"
        >
        <p
          class="vch-opening-workspace-loader__label text-center text-sm font-semibold tracking-wide text-muted"
        >
          {{ statusLabel }}
        </p>
      </div>
    </div>
  </Teleport>

  <div
    v-else
    class="vch-opening-workspace-loader flex min-h-[12rem] w-full flex-col items-center justify-center gap-4 px-4 py-8"
    role="status"
    aria-live="polite"
    :aria-label="statusLabel"
  >
    <div
      class="flex flex-col items-center justify-center gap-4"
      :class="stackClass"
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
        :class="tankClass"
        decoding="async"
      >
      <p
        class="vch-opening-workspace-loader__label text-center text-sm font-semibold tracking-wide text-muted"
      >
        {{ statusLabel }}
      </p>
    </div>
  </div>
</template>
