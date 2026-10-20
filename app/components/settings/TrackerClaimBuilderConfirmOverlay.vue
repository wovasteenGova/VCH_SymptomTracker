<script setup lang="ts">
import TrackerWorkspaceSettingsShell from './TrackerWorkspaceSettingsShell.vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <TrackerWorkspaceSettingsShell
    :open="open"
    title="Open ClaimBuilder?"
    description="This opens ClaimBuilder in a new tab."
    :z-index="120"
    desktop-max-width="lg:max-w-md"
    @close="emit('close')"
  >
    <p class="text-sm leading-6 text-toned">
      Symptom Tracker stays open. You can come back to this tab when you are done.
    </p>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <button
        type="button"
        class="rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented"
        @click="emit('close')"
      >
        Stay here
      </button>
      <button
        type="button"
        class="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
        @click="emit('confirm')"
      >
        Open ClaimBuilder
      </button>
    </div>
  </TrackerWorkspaceSettingsShell>
</template>
