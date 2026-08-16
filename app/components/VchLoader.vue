<template>
  <div class="vch-loader" role="status" :aria-label="label || 'Loading'">
    <div
      v-if="showBrand"
      class="vch-loader-brand"
    >
      <img
        :src="reportBranding.logoPath"
        alt="VCH Symptom Tracker"
        class="vch-loader-logo"
        decoding="async"
      >
      <span class="vch-loader-wordmark text-slate-950 dark:text-white">VCH</span>
    </div>
    <img
      src="/vch-tank-loader.svg?v=4"
      class="vch-loader-img"
      :style="{ width: `${width}px` }"
      alt=""
      aria-hidden="true"
    >
    <p v-if="label" class="vch-loader-label">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
import { reportBranding } from '../utils/reportBranding'

withDefaults(defineProps<{
  label?: string
  width?: number
  /** Logo + VCH above the animated logo loader — use for main/workspace loaders, not auth. */
  showBrand?: boolean
}>(), {
  label: '',
  width: 720,
  showBrand: false
})
</script>

<style scoped>
.vch-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.vch-loader-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.vch-loader-logo {
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  border-radius: 9999px;
  object-fit: cover;
  object-position: center;
  border: 1px solid rgb(51 65 85);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
}

.vch-loader-wordmark {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.12em;
}

.vch-loader-img {
  height: auto;
  max-width: 100%;
}

.vch-loader-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #94a3b8;
  animation: vch-loader-pulse 1.6s ease-in-out infinite;
}

@keyframes vch-loader-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
</style>
