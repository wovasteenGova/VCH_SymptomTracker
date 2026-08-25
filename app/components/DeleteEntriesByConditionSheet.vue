<script setup lang="ts">
import type { DeletableConditionGroup } from '../utils/deletableConditionGroups'
import { totalDeletableEntryCount } from '../utils/deletableConditionGroups'

defineProps<{
  conditions: DeletableConditionGroup[]
  selectedKeys: string[]
  loading?: boolean
  deleting?: boolean
  error?: string
}>()

const emit = defineEmits<{
  dismiss: []
  toggle: [key: string]
  confirm: []
}>()

function isSelected(selectedKeys: string[], key: string) {
  return selectedKeys.includes(key)
}

function entryCountLabel(group: DeletableConditionGroup) {
  const total = totalDeletableEntryCount(group)

  if (group.activeEntryCount > 0 && group.deletedEntryCount > 0) {
    return `${group.activeEntryCount} active · ${group.deletedEntryCount} in Recovery`
  }

  if (group.deletedEntryCount > 0) {
    return `${group.deletedEntryCount} in Recovery`
  }

  return `${total} ${total === 1 ? 'entry' : 'entries'}`
}
</script>

<template>
  <AppOverlayShell
    :z-index="120"
    @dismiss="emit('dismiss')"
  >
    <div
      class="app-overlay-panel app-overlay-panel--stack app-overlay-panel--lg w-full overflow-hidden rounded-[1.75rem] border border-default bg-elevated shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-entries-by-condition-title"
    >
      <div class="flex items-start justify-between gap-4 border-b border-default px-5 py-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-red-300/80">
            Delete entries
          </p>
          <h3 id="delete-entries-by-condition-title" class="mt-2 text-xl font-bold text-highlighted">
            Remove logs by condition
          </h3>
          <p class="mt-1 text-sm leading-6 text-toned">
            Select the conditions you want to clear. Active logs move to Recovery; logs already in Recovery are removed permanently.
          </p>
        </div>
        <button
          type="button"
          class="grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-accented/40 hover:text-highlighted"
          aria-label="Close delete entries"
          @click="emit('dismiss')"
        >
          <UIcon name="i-lucide-x" class="size-5" />
        </button>
      </div>

      <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div
          v-if="loading"
          class="rounded-2xl px-4 py-10 text-center text-sm text-muted"
        >
          Loading your conditions...
        </div>

        <div
          v-else-if="!conditions.length"
          class="rounded-2xl px-4 py-8 text-center"
        >
          <p class="font-bold text-highlighted">No logs to delete</p>
          <p class="mt-2 text-sm leading-6 text-toned">
            You do not have any saved entries yet.
          </p>
        </div>

        <div
          v-else
          class="space-y-2"
        >
          <label
            v-for="condition in conditions"
            :key="condition.key"
            class="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 ring-1 transition"
            :class="isSelected(selectedKeys, condition.key)
              ? 'bg-muted/80 ring-primary/35'
              : 'bg-muted/40 ring-default/70'"
          >
            <input
              type="checkbox"
              class="size-4 shrink-0 rounded border-default text-highlighted focus:ring-primary"
              :checked="isSelected(selectedKeys, condition.key)"
              :disabled="deleting"
              @change="emit('toggle', condition.key)"
            >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-base font-bold text-highlighted">
                {{ condition.label }}
              </span>
              <span class="mt-0.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {{ entryCountLabel(condition) }}
              </span>
            </span>
          </label>
        </div>
      </div>

      <div class="border-t border-default px-5 py-4">
        <p
          v-if="!loading && conditions.length && !selectedKeys.length"
          class="mb-3 text-xs font-medium text-amber-700 dark:text-amber-200"
        >
          Select at least one condition to continue.
        </p>
        <p v-if="error" class="mb-3 text-sm font-medium text-red-300">{{ error }}</p>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented disabled:opacity-50"
            :disabled="deleting"
            @click="emit('dismiss')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            :disabled="loading || deleting || !selectedKeys.length"
            @click="emit('confirm')"
          >
            {{ deleting ? 'Deleting...' : 'Delete selected' }}
          </button>
        </div>
      </div>
    </div>
  </AppOverlayShell>
</template>
