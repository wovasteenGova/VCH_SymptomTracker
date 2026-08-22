<script setup lang="ts">
import { reportBranding } from '../utils/reportBranding'

const props = withDefaults(defineProps<{
  compact?: boolean
  vertical?: boolean
  /** Hide VCH wordmark — logo mark only (ultra-narrow header). */
  logoOnly?: boolean
}>(), {
  compact: false,
  vertical: true,
  logoOnly: false
})

const emit = defineEmits<{
  home: []
}>()

const logoHovered = ref(false)

const subtitleVariant = computed(() => {
  if (!props.compact && props.vertical) return 'hero'
  if (props.compact && !props.vertical) return 'header'
  return 'inline'
})

const showSubtitle = computed(() =>
  !props.logoOnly
  && (
    subtitleVariant.value === 'hero'
    || subtitleVariant.value === 'header'
    || (!props.compact && !props.vertical)
  )
)

function goHome() {
  emit('home')
}
</script>

<template>
  <div
    class="vch-brand inline-flex items-center gap-2.5"
    :class="vertical ? 'flex-col text-center' : 'flex-row items-center'"
  >
    <button
      type="button"
      class="group/logo shrink-0 overflow-hidden rounded-full ring-1 ring-default shadow-sm transition hover:ring-primary/40"
      :class="compact ? 'size-9' : 'size-11'"
      aria-label="Symptom Tracker home"
      @mouseenter="logoHovered = true"
      @mouseleave="logoHovered = false"
      @click="goHome"
    >
      <img
        :src="reportBranding.logoPath"
        :alt="reportBranding.organizationName"
        width="44"
        height="44"
        class="size-full object-cover object-center transition group-hover/logo:opacity-90"
        loading="eager"
        decoding="sync"
        fetchpriority="high"
      >
    </button>

    <button
      v-if="!logoOnly"
      type="button"
      class="min-w-0 text-left transition hover:opacity-90"
      :class="vertical ? 'inline-block' : ''"
      aria-label="Symptom Tracker home"
      @mouseenter="logoHovered = true"
      @mouseleave="logoHovered = false"
      @click="goHome"
    >
      <span
        class="block font-semibold leading-none tracking-[0.12em] text-default"
        :class="compact ? 'text-[2rem]' : 'text-[2.5rem]'"
      >
        VCH
      </span>

      <div
        v-if="showSubtitle"
        class="vch-brand-subtitle mt-0.5"
        :class="[
          subtitleVariant === 'hero' && 'vch-brand-subtitle--hero',
          subtitleVariant === 'header' && 'vch-brand-subtitle--header',
          subtitleVariant === 'inline' && 'vch-brand-subtitle--inline'
        ]"
        aria-live="polite"
      >
        <span
          class="vch-brand-subtitle__text"
          :class="{ 'is-active': !logoHovered }"
          aria-hidden="true"
        >
          Symptom Tracker
        </span>
        <span
          class="vch-brand-subtitle__text"
          :class="{ 'is-active': logoHovered }"
        >
          Home
        </span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.vch-brand :focus-visible {
  outline: 2px solid rgb(196 160 92 / 0.55);
  outline-offset: 4px;
  border-radius: 0.75rem;
}

.vch-brand-subtitle {
  position: relative;
  display: block;
  overflow: hidden;
  width: 6.75rem;
  height: 0.875rem;
}

.vch-brand-subtitle--hero {
  width: 7.25rem;
  height: 0.75rem;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}

.vch-brand-subtitle--header {
  margin-left: 1rem;
  width: 6.75rem;
  height: 0.875rem;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  color: color-mix(in srgb, var(--ui-text) 80%, transparent);
}

.vch-brand-subtitle--inline {
  width: 6.75rem;
  height: 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-text-muted);
}

.vch-brand-subtitle__text {
  position: absolute;
  inset: 0;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(3px);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
  pointer-events: none;
}

.vch-brand-subtitle__text.is-active {
  opacity: 1;
  transform: translateY(0);
}

.vch-brand-subtitle__text:not(.is-active) {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
