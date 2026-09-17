<script setup lang="ts">
const authModes = [
  { value: 'login', label: 'Sign in' },
  { value: 'signup', label: 'Create account' }
] as const

const model = defineModel<'login' | 'signup'>({ required: true })

withDefaults(defineProps<{
  tone?: 'light' | 'dark' | 'theme'
}>(), {
  tone: 'light'
})
</script>

<template>
  <div
    class="rounded-full p-1"
    :class="tone === 'dark'
      ? 'bg-slate-950/70 ring-1 ring-slate-800'
      : tone === 'theme'
        ? 'bg-muted/60 ring-1 ring-default/70'
        : 'bg-slate-100 dark:bg-slate-800/80'"
    role="tablist"
    aria-label="Account access"
  >
    <div class="auth-mode-tab-grid grid gap-1">
      <button
        v-for="mode in authModes"
        :key="mode.value"
        type="button"
        role="tab"
        class="auth-mode-tab rounded-full font-semibold transition"
        :class="model === mode.value
          ? tone === 'dark'
            ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600/70'
            : tone === 'theme'
              ? 'bg-elevated text-highlighted shadow-sm ring-1 ring-default/80'
              : 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white'
          : tone === 'dark'
            ? 'text-slate-400 hover:text-slate-200'
            : tone === 'theme'
              ? 'text-muted hover:text-highlighted'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
        :aria-selected="model === mode.value"
        @click="model = mode.value"
      >
        {{ mode.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.auth-mode-tab-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

.auth-mode-tab {
  min-width: 0;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.25rem;
}

@media (min-width: 640px) {
  .auth-mode-tab {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
