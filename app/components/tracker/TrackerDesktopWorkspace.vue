<script setup lang="ts">
import { td, trackerDesktopPanelClass } from '../../utils/trackerDesktopTheme'

type Condition = {
  key: string
  title: string
  category: string
  image: string
}

defineProps<{
  conditions: Condition[]
  selectedKey: string
  entitlementsLoaded: boolean
  isConditionLocked: (key: string) => boolean
}>()

defineEmits<{
  select: [condition: Condition]
  openBrowser: []
  addCustom: []
}>()

const panelClass = trackerDesktopPanelClass()
</script>

<template>
  <div class="tracker-desktop-workspace flex min-h-0 flex-1 gap-4 overflow-hidden pb-1">
    <aside
      :class="[panelClass, 'w-72 shrink-0']"
      aria-label="Your conditions"
    >
      <div :class="td.panelHeader">
        <div class="flex items-center justify-between gap-2">
          <h2 :class="td.titleBase">
            Your conditions
          </h2>
          <button
            type="button"
            :class="td.chipActive"
            @click="$emit('openBrowser')"
          >
            All
          </button>
        </div>
      </div>

      <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        <p
          v-if="!conditions.length"
          class="px-2 py-6 text-center text-sm text-muted"
        >
          Add conditions to start logging.
        </p>

        <div v-else class="space-y-1">
          <button
            v-for="condition in conditions"
            :key="condition.key"
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition"
            :class="selectedKey === condition.key
              ? td.rowSelected
              : td.rowHover"
            @click="$emit('select', condition)"
          >
            <img
              :src="condition.image"
              :alt="condition.title"
              class="size-14 shrink-0 rounded-xl object-cover"
            >

            <span class="min-w-0 flex-1">
              <span class="block truncate text-base font-bold text-highlighted">
                {{ condition.title }}
              </span>
              <span class="mt-0.5 block truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {{ condition.category }}
              </span>
            </span>

            <UIcon
              v-if="entitlementsLoaded && isConditionLocked(condition.key)"
              name="i-lucide-lock"
              class="size-4 shrink-0 text-warning"
            />
            <UIcon
              v-else
              :name="td.conditionRowGoIcon"
              class="size-5 shrink-0 text-muted"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div class="shrink-0 border-t border-default p-3">
        <button
          type="button"
          class="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/15"
          @click="$emit('addCustom')"
        >
          <UIcon name="i-lucide-plus" class="size-4" />
          Custom condition
        </button>
      </div>
    </aside>

    <div class="relative min-w-0 flex-1 overflow-visible">
      <div
        :class="[panelClass, 'flex min-h-0 flex-1 flex-col overflow-hidden']"
      >
        <slot name="main" />
      </div>
    </div>

    <aside
      :class="[panelClass, 'w-[min(24rem,34%)] shrink-0']"
      aria-label="Symptom history"
    >
      <slot name="history" />
    </aside>
  </div>
</template>
