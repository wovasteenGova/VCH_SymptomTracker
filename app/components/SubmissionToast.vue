<template>
  <Teleport to="body" :disabled="embedded">
  <div
    class="submission-toast-root pointer-events-none flex justify-center px-4"
    :class="embedded ? 'submission-toast-root--embedded' : 'submission-toast-root--global'"
    data-submission-toast
    aria-live="polite"
    aria-atomic="true"
  >
    <Transition name="submission-toast" mode="out-in">
      <div
        v-if="activeToast"
        :key="toastKey"
        class="submission-toast-panel pointer-events-auto flex w-full max-w-sm shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-emerald-950/10 backdrop-blur-sm md:w-sm"
        :class="activeToast.tone === 'error'
          ? 'border-red-300/80 bg-red-50/95 text-red-950 dark:border-red-800/70 dark:bg-red-950/90 dark:text-red-100'
          : 'border-emerald-300/80 bg-emerald-50/95 text-emerald-950 dark:border-emerald-700/70 dark:bg-emerald-950/90 dark:text-emerald-100'"
      >
        <span
          v-if="compactHighlight"
          class="submission-toast-highlight shrink-0 text-2xl font-bold leading-none"
          :class="activeToast.tone === 'error' ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'"
        >
          {{ compactHighlight }}
        </span>
        <span
          v-else
          class="grid size-9 shrink-0 place-items-center rounded-full"
          :class="activeToast.tone === 'error'
            ? 'bg-red-500/15 text-red-600 dark:text-red-300'
            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'"
        >
          <UIcon
            :name="activeToast.tone === 'error' ? 'i-lucide-alert-circle' : 'i-lucide-check-circle-2'"
            class="size-5"
          />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-[0.9375rem] font-semibold leading-5">
            {{ activeToast.message }}
          </p>
          <a
            v-if="activeToast.action"
            :href="activeToast.action.href"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 inline-block text-sm font-semibold underline underline-offset-2"
          >
            {{ activeToast.action.label }}
          </a>
        </div>
        <button
          type="button"
          class="grid size-8 shrink-0 place-items-center rounded-full text-current/60 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
          aria-label="Dismiss notification"
          @click="clearSubmissionToast()"
        >
          <UIcon name="i-lucide-x" class="size-4" />
        </button>
      </div>
    </Transition>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

withDefaults(defineProps<{
  embedded?: boolean
}>(), {
  embedded: false
})

const { activeToast, toastKey, clearSubmissionToast } = useSubmissionToast()

const compactHighlight = computed(() => {
  const highlight = activeToast.value?.highlight?.trim()

  if (!highlight || highlight.length > 8) {
    return ''
  }

  return highlight
})
</script>

<style scoped>
.submission-toast-root--global {
  position: fixed;
  inset-inline: 0;
  /* Above settings overlay (90), FAQ (120), and settings sheets (130). */
  z-index: 240;
  top: calc(env(safe-area-inset-top, 0px) + 5.75rem);
  bottom: auto;
}

@media (min-width: 768px) {
  .submission-toast-root--global {
    top: calc(env(safe-area-inset-top, 0px) + 1rem);
    bottom: auto;
    justify-content: flex-end;
    padding-right: 1.5rem;
  }
}

.submission-toast-root--embedded {
  position: absolute;
  inset-inline: 0;
  z-index: 240;
  top: calc(env(safe-area-inset-top, 0px) + 5.75rem);
  bottom: auto;
}

.submission-toast-panel {
  transform-origin: top center;
}

@media (min-width: 768px) {
  .submission-toast-panel {
    transform-origin: top right;
  }

  .submission-toast-root--embedded .submission-toast-panel {
    transform-origin: top center;
  }
}

.submission-toast-enter-active,
.submission-toast-leave-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.submission-toast-enter-from {
  opacity: 0;
  transform: translateY(-0.75rem) scale(0.96);
}

.submission-toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.98);
}

.submission-toast-highlight {
  animation: submission-toast-highlight 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes submission-toast-highlight {
  0% {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.85);
  }

  55% {
    opacity: 1;
    transform: translateY(-0.15rem) scale(1.08);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
