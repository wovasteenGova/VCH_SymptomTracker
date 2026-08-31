<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MONTHLY_BACKUP_REMINDER_COPY } from '../utils/monthlyBackupReminder'

const props = defineProps<{
  open: boolean
  anchorId?: string
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const tipPosition = ref<{ top: number, right: number } | null>(null)

const anchorId = computed(() => props.anchorId || 'monthly-backup-reminder-anchor')

function resolveAnchor() {
  return document.getElementById(anchorId.value)
}

function updateTipPosition() {
  const anchor = resolveAnchor()

  if (!anchor) {
    tipPosition.value = null
    return
  }

  const rect = anchor.getBoundingClientRect()
  tipPosition.value = {
    top: rect.top,
    right: window.innerWidth - rect.right
  }
}

function onViewportChange() {
  if (props.open) {
    updateTipPosition()
  }
}

watch(() => props.open, (open) => {
  if (open) {
    updateTipPosition()
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('orientationchange', onViewportChange)
  window.visualViewport?.addEventListener('resize', onViewportChange)
  window.visualViewport?.addEventListener('scroll', onViewportChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('orientationchange', onViewportChange)
  window.visualViewport?.removeEventListener('resize', onViewportChange)
  window.visualViewport?.removeEventListener('scroll', onViewportChange)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="open && tipPosition"
        class="fixed z-[120] w-[min(16rem,calc(100vw-2rem))]"
        :style="{
          top: `${tipPosition.top}px`,
          right: `${tipPosition.right}px`,
          transform: 'translateY(calc(-100% - 0.65rem))'
        }"
        role="status"
        aria-live="polite"
      >
        <div class="relative rounded-2xl border border-primary/30 bg-primary px-3.5 py-3 text-white shadow-xl shadow-black/20">
          <button
            type="button"
            class="absolute right-2 top-2 grid size-6 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss backup reminder"
            @click="emit('dismiss')"
          >
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>

          <div class="flex items-start gap-2 pr-5">
            <UIcon name="i-lucide-shield-check" class="mt-0.5 size-4 shrink-0 text-white/90" />
            <p class="text-xs leading-5 text-white/95">
              {{ MONTHLY_BACKUP_REMINDER_COPY }}
            </p>
          </div>

          <span
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-1.5 right-7 z-10 size-3 rotate-45 border-b border-r border-primary/30 bg-primary"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
