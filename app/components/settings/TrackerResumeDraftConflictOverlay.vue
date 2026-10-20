<script setup lang="ts">
import TrackerWorkspaceSettingsShell from './TrackerWorkspaceSettingsShell.vue'

withDefaults(defineProps<{
  open: boolean
  variant?: 'resume' | 'limit'
  currentEntryTitle: string
  pendingDraftTitle: string
  isSavingEntry: boolean
}>(), {
  variant: 'resume'
})

const emit = defineEmits<{
  close: []
  saveThenOpen: []
  draftThenOpen: []
  discardThenOpen: []
}>()
</script>

<template>
  <TrackerWorkspaceSettingsShell
    :open="open"
    title="Three drafts is the limit"
    :description="variant === 'limit'
      ? 'Submit or delete a saved draft before starting another.'
      : 'Submissions already has 3 saved drafts. Choose what to do with your current entry before opening the draft.'"
    :z-index="130"
    desktop-max-width="lg:max-w-md"
    desktop-max-height="lg:max-h-[min(85dvh,44rem)]"
    @close="emit('close')"
  >
    <p v-if="variant === 'limit'" class="text-[0.875rem] leading-6 text-toned">
      Submissions already has 3 drafts. Keep working on
      <span class="font-semibold text-highlighted">{{ currentEntryTitle || 'this log' }}</span>
      to submit it, or discard this entry.
    </p>
    <p v-else class="text-[0.875rem] leading-6 text-toned">
      You are working on
      <span class="font-semibold text-highlighted">{{ currentEntryTitle || 'a symptom log' }}</span>,
      and Submissions already has 3 drafts. Choose how to handle your current entry before opening
      <span class="font-semibold text-highlighted">{{ pendingDraftTitle || 'your saved draft' }}</span>.
    </p>

    <div v-if="variant === 'limit'" class="mt-5 space-y-2">
      <button
        type="button"
        class="w-full rounded-2xl bg-primary px-4 py-3 text-[0.875rem] font-bold text-white transition hover:opacity-90"
        @click="emit('close')"
      >
        Keep current entry
      </button>
      <button
        type="button"
        class="w-full rounded-2xl bg-red-600 px-4 py-3 text-[0.875rem] font-bold text-white transition hover:bg-red-700"
        @click="emit('discardThenOpen')"
      >
        Discard current entry
      </button>
    </div>

    <div v-else class="mt-5 space-y-2">
      <button
        type="button"
        class="w-full rounded-2xl bg-muted px-4 py-3 text-[0.875rem] font-bold text-highlighted transition hover:bg-accented"
        @click="emit('close')"
      >
        Keep current entry
      </button>
      <button
        type="button"
        class="w-full rounded-2xl bg-primary px-4 py-3 text-[0.875rem] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        :disabled="isSavingEntry"
        @click="emit('saveThenOpen')"
      >
        {{ isSavingEntry ? 'Saving…' : 'Save current log, then open draft' }}
      </button>
    </div>

    <div v-if="variant !== 'limit'" class="mt-5 border-t border-default pt-4">
      <button
        type="button"
        class="w-full rounded-2xl bg-red-600 px-4 py-3 text-[0.875rem] font-bold text-white transition hover:bg-red-700"
        @click="emit('discardThenOpen')"
      >
        Discard current entry and open draft
      </button>
    </div>
  </TrackerWorkspaceSettingsShell>
</template>
