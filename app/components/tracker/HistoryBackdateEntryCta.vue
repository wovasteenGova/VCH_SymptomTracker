<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    v-if="visible"
    type="button"
    data-history-interactive
    class="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/45 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-500/15 active:scale-[0.99] dark:text-amber-300"
    @click="emit('click')"
  >
    <UIcon name="i-lucide-calendar-clock" class="size-4 shrink-0" aria-hidden="true" />
    Back date entry
  </button>
</template>
