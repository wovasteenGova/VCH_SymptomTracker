<script setup lang="ts">
import TrackerWorkspaceSettingsShell from './TrackerWorkspaceSettingsShell.vue'

defineProps<{
  open: boolean
  draftTitle: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <TrackerWorkspaceSettingsShell
    :open="open"
    title="Delete this draft?"
    description="This removes the saved draft from your device. It cannot be undone."
    desktop-max-width="lg:max-w-md"
    @close="emit('close')"
  >
    <p class="text-sm leading-6 text-toned">
      <span class="font-semibold text-highlighted">{{ draftTitle || 'Symptom log' }}</span>
      will be permanently removed.
    </p>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <button
        type="button"
        class="rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
        @click="emit('confirm')"
      >
        Delete draft
      </button>
    </div>
  </TrackerWorkspaceSettingsShell>
</template>
