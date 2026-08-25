<script setup lang="ts">
import type { InactiveCustomCondition } from '../utils/inactiveCustomConditions'

defineProps<{
  items: InactiveCustomCondition[]
  deletingKey?: string | null
}>()

const emit = defineEmits<{
  dismiss: []
  delete: [item: InactiveCustomCondition]
}>()
</script>

<template>
  <AppOverlayShell
    :z-index="120"
    @dismiss="emit('dismiss')"
  >
    <div
      class="app-overlay-panel app-overlay-panel--stack app-overlay-panel--lg flex max-h-[min(80dvh,40rem)] flex-col overflow-hidden rounded-[1.75rem] border border-default bg-elevated shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="removed-custom-conditions-title"
    >
      <div class="flex items-start justify-between gap-4 border-b border-default px-5 py-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Custom conditions
          </p>
          <h3 id="removed-custom-conditions-title" class="mt-2 text-xl font-bold text-highlighted">
            Not on home
          </h3>
          <p class="mt-1 text-sm leading-6 text-toned">
            These custom conditions are off your home screen. Delete their logs here if you no longer need them.
          </p>
        </div>
        <button
          type="button"
          class="grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-accented/40 hover:text-highlighted"
          aria-label="Close removed custom conditions"
          @click="emit('dismiss')"
        >
          <UIcon name="i-lucide-x" class="size-5" />
        </button>
      </div>

      <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div
          v-if="!items.length"
          class="rounded-2xl px-4 py-8 text-center"
        >
          <p class="font-bold text-highlighted">Nothing here</p>
          <p class="mt-2 text-sm leading-6 text-toned">
            Removed custom conditions with saved logs will show up here.
          </p>
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="item in items"
            :key="item.key"
            class="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-3 ring-1 ring-default/70"
          >
            <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <UIcon name="i-lucide-clipboard-list" class="size-5" />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-bold text-highlighted">
                {{ item.label }}
              </p>
              <p class="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {{ item.entryCount === 1 ? '1 log' : `${item.entryCount} logs` }}
              </p>
            </div>

            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              :disabled="Boolean(deletingKey)"
              @click="emit('delete', item)"
            >
              <UIcon
                v-if="deletingKey === item.key"
                name="i-lucide-loader-circle"
                class="size-3.5 animate-spin"
              />
              <UIcon
                v-else
                name="i-lucide-trash-2"
                class="size-3.5"
              />
              {{ deletingKey === item.key ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppOverlayShell>
</template>
