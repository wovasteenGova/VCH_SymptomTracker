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
    :title="variant === 'limit' ? 'Three drafts is the limit' : 'Finish your current entry first?'"
    :description="variant === 'limit'
      ? 'Submit or delete a saved draft before starting another.'
      : 'Choose what to do with your current log before opening the saved draft.'"
    :z-index="130"
    desktop-max-width="lg:max-w-md"
    desktop-max-height="lg:max-h-[min(85dvh,44rem)]"
    @close="emit('close')"
  >
    <p v-if="variant === 'limit'" class="text-sm leading-6 text-toned">
      Submissions already has 3 drafts. Take care of one of them before this log can be saved as a draft.
    </p>
    <p v-else class="text-sm leading-6 text-toned">
      You are working on
      <span class="font-semibold text-highlighted">{{ currentEntryTitle || 'a symptom log' }}</span>.
      The draft you selected is
      <span class="font-semibold text-highlighted">{{ pendingDraftTitle || 'your saved draft' }}</span>.
    </p>

    <div v-if="variant === 'limit'" class="mt-5">
      <button
        type="button"
        class="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
        @click="emit('close')"
      >
        Got it
      </button>
    </div>

    <div v-else class="mt-5 space-y-2">
      <button
        type="button"
        class="w-full rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented"
        @click="emit('close')"
      >
        Keep current entry
      </button>
      <button
        type="button"
        class="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        :disabled="isSavingEntry"
        @click="emit('saveThenOpen')"
      >
        {{ isSavingEntry ? 'Saving…' : 'Save current log, then open draft' }}
      </button>
      <button
        type="button"
        class="w-full rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted ring-1 ring-default transition hover:bg-accented"
        @click="emit('draftThenOpen')"
      >
        Save current as draft, then open draft
      </button>
    </div>

    <div v-if="variant !== 'limit'" class="mt-5 border-t border-default pt-4">
      <button
        type="button"
        class="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
        @click="emit('discardThenOpen')"
      >
        Discard current entry and open draft
      </button>
    </div>
  </TrackerWorkspaceSettingsShell>
</template>
