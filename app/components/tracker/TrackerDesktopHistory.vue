<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { td } from '../../utils/trackerDesktopTheme'

type HistoryEntry = {
  id: string
  title: string
  condition: string
  conditionKey: string
  source: string
  month: string
  day: string
  time: string
  severity: number
  summary: string
  listTitle: string
  listSummary: string
  wasEdited?: boolean
  editedLabel?: string
}

type HistoryTab = 'Entries' | 'Calendar' | 'Export'

const props = defineProps<{
  entries: HistoryEntry[]
  showAllEntries: boolean
  entriesFiltered: boolean
  conditionFilterLabel: string
  isLoading: boolean
  error: string
  loadingMessage: string
  signedIn: boolean
  authLoading: boolean
  isDemoMode: boolean
  activeTab: HistoryTab
  highlightedEntryId?: string | null
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: HistoryTab]
  signIn: []
  showAll: []
  retry: []
  viewCharts: [conditionKey: string]
  openEntry: [id: string]
  editEntry: [id: string]
  deleteEntry: [id: string]
  openExport: []
}>()

const historyTabs: HistoryTab[] = ['Entries', 'Calendar', 'Export']

const panelTitle = computed(() => {
  if (props.activeTab === 'Calendar') return 'Calendar'
  if (props.activeTab === 'Export') return 'Export'
  return 'Entries'
})

function selectTab(tab: HistoryTab) {
  if (tab === 'Export') {
    emit('openExport')
    return
  }

  emit('update:activeTab', tab)
}

const scrollEl = ref<HTMLElement | null>(null)

async function scrollEntryIntoView(entryId: string) {
  await nextTick()

  if (!import.meta.client) {
    return
  }

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

  const container = scrollEl.value
  const entryElement = container?.querySelector(`[data-entry-id="${entryId}"]`) as HTMLElement | null

  if (!container || !entryElement) {
    return
  }

  const scrollTarget = entryElement.getBoundingClientRect().top
    - container.getBoundingClientRect().top
    + container.scrollTop

  container.scrollTo({
    top: Math.max(0, scrollTarget - 4),
    behavior: 'smooth'
  })
}

defineExpose({
  scrollEntryIntoView
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div :class="td.panelHeader">
      <div class="flex items-start justify-between gap-3">
        <h2 :class="td.titleLg">
          {{ panelTitle }}
        </h2>
        <div class="flex shrink-0 items-center gap-2">
          <button
            v-if="activeTab === 'Entries' && signedIn"
            type="button"
            :class="showAllEntries ? td.chipActive : td.chipInactive"
            @click="$emit('showAll')"
          >
            All
          </button>
          <button
            v-if="!signedIn && !authLoading && !isDemoMode"
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-toned ring-1 ring-default transition hover:bg-accented"
            @click="$emit('signIn')"
          >
            <UIcon name="i-lucide-log-in" class="size-3.5" />
            Sign in
          </button>
        </div>
      </div>

      <div
        :class="['mt-3', td.tabRail]"
        role="tablist"
        aria-label="History sections"
      >
        <div class="grid grid-cols-3 gap-1">
          <button
            v-for="tab in historyTabs"
            :key="tab"
            type="button"
            role="tab"
            :class="activeTab === tab ? td.tabActive : td.tabInactive"
            :aria-selected="activeTab === tab"
            @click="selectTab(tab)"
          >
            {{ tab }}
          </button>
        </div>
      </div>
    </div>

    <div
      ref="scrollEl"
      class="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-2"
    >
      <template v-if="activeTab === 'Entries'">
        <div v-if="error && signedIn" class="py-4 text-center text-sm text-error">
          <p role="alert">{{ error }}</p>
          <button
            type="button"
            :class="['mt-3 inline-flex items-center gap-2', td.secondaryBtn]"
            @click="$emit('retry')"
          >
            <UIcon name="i-lucide-refresh-cw" class="size-4" />
            Try again
          </button>
        </div>

        <div v-if="!signedIn && !authLoading && !isDemoMode" class="py-10 text-center">
          <p class="font-bold text-highlighted">Sign in to save entries</p>
          <p :class="['mt-1 text-sm', td.meta]">
            Your logs sync once you sign in.
          </p>
          <button
            type="button"
            :class="['mt-4', td.primaryBtn]"
            @click="$emit('signIn')"
          >
            Sign in
          </button>
        </div>

        <div v-else-if="isLoading" :class="['py-10 text-center text-sm', td.meta]">
          {{ loadingMessage }}
        </div>

        <div v-else-if="!entries.length && !error" class="py-10 text-center">
          <p class="font-bold text-highlighted">
            {{ entriesFiltered ? `No entries for ${conditionFilterLabel} yet` : 'No entries yet' }}
          </p>
          <p :class="['mt-1 text-sm', td.meta]">
            {{ entriesFiltered ? 'Log this condition or tap All to see every entry.' : 'Pick a condition and log your first symptom.' }}
          </p>
        </div>

        <article
          v-for="entry in entries"
          v-else
          :key="entry.id"
          :data-entry-id="entry.id"
          :class="[
            'group relative cursor-pointer rounded-2xl px-2 py-3 transition duration-500',
            td.rowHover,
            highlightedEntryId === entry.id
              ? 'submission-flash bg-primary/10 ring-2 ring-primary/35 shadow-lg shadow-black/10 dark:bg-primary/15 dark:ring-primary/50 dark:shadow-black/20'
              : ''
          ]"
          role="button"
          tabindex="0"
          @click="$emit('openEntry', entry.id)"
          @keydown.enter.prevent="$emit('openEntry', entry.id)"
          @keydown.space.prevent="$emit('openEntry', entry.id)"
        >
          <div class="flex items-start gap-3">
            <div :class="td.dateBadge">
              <p :class="['text-xs font-bold uppercase tracking-[0.12em]', td.meta]">
                {{ entry.month }}
              </p>
              <p class="text-lg font-bold leading-none text-highlighted">
                {{ entry.day }}
              </p>
            </div>

            <div class="min-w-0 flex-1 text-left">
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-if="entry.conditionKey"
                  type="button"
                  class="inline-flex max-w-full items-center rounded-md bg-muted px-2.5 py-1 text-sm font-semibold text-toned transition hover:bg-accented"
                  :aria-label="`View ${entry.condition} charts`"
                  @click.stop="$emit('viewCharts', entry.conditionKey)"
                >
                  <span class="truncate">{{ entry.condition }}</span>
                </button>
                <UBadge v-else color="neutral" variant="soft" size="md">{{ entry.condition }}</UBadge>
                <UBadge :color="entry.source === 'Family' ? 'secondary' : 'primary'" variant="soft" size="md">
                  {{ entry.source }}
                </UBadge>
                <UBadge v-if="entry.source === 'Family'" color="neutral" variant="soft" size="md">
                  Read-only
                </UBadge>
                <UBadge v-if="entry.wasEdited" color="warning" variant="soft" size="md">
                  Edited
                </UBadge>
              </div>
              <h3 class="mt-1.5 text-base font-bold leading-snug text-highlighted">
                {{ entry.listTitle }}
              </h3>
              <p :class="['mt-0.5 leading-snug', td.meta]">
                {{ entry.time }} · Severity {{ entry.severity }}/10 · {{ entry.listSummary }}
              </p>
              <p v-if="entry.editedLabel" :class="['mt-1 text-xs', td.meta]">
                {{ entry.editedLabel }}
              </p>
            </div>
          </div>

          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 rounded-r-2xl bg-gradient-to-l from-default from-45% via-default/95 to-transparent px-2 pl-10 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          >
            <button
              v-if="entry.conditionKey"
              type="button"
              :class="['grid size-8 place-items-center rounded-full bg-elevated/90 shadow-sm ring-1 ring-default/70 hover:bg-accented hover:text-highlighted', td.iconMuted]"
              :aria-label="`View ${entry.condition} charts`"
              @click.stop="$emit('viewCharts', entry.conditionKey)"
            >
              <UIcon name="i-lucide-chart-line" class="size-3.5" />
            </button>
            <button
              v-if="entry.source !== 'Family'"
              type="button"
              :class="['grid size-8 place-items-center rounded-full bg-elevated/90 shadow-sm ring-1 ring-default/70 hover:bg-accented hover:text-highlighted', td.iconMuted]"
              :aria-label="`Edit ${entry.title}`"
              @click.stop="$emit('editEntry', entry.id)"
            >
              <UIcon name="i-lucide-pencil" class="size-3.5" />
            </button>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-full bg-elevated/90 text-muted shadow-sm ring-1 ring-default/70 hover:bg-error/10 hover:text-error"
              :aria-label="`Delete ${entry.title}`"
              @click.stop="$emit('deleteEntry', entry.id)"
            >
              <UIcon name="i-lucide-trash-2" class="size-3.5" />
            </button>
          </div>
        </article>
      </template>

      <div v-else-if="activeTab === 'Calendar'" class="py-1">
        <slot name="calendar" />
      </div>

      <div v-else class="py-8 text-center">
        <UIcon name="i-lucide-download" :class="['mx-auto size-8', td.iconMuted]" />
        <p :class="['mt-3 font-bold', td.titleBase]">Export your logs</p>
        <p :class="['mt-1 text-sm', td.meta]">
          Download PDF reports with your symptom history and weekly counts.
        </p>
        <button
          type="button"
          :class="['mt-4', td.primaryBtn]"
          @click="$emit('openExport')"
        >
          Open export
        </button>
      </div>
    </div>
  </div>
</template>
