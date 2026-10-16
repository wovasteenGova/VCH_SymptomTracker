<script setup lang="ts">
import { useTrackerPdfExportUi } from '../../composables/useTrackerPdfExportUi'

const {
  user,
  isAuthLoading,
  exportableConditions,
  pdfExportDownloadStarted,
  canConfirmPdfExport,
  exportButtonLabel,
  runPdfExport,
  signInForExport
} = useTrackerPdfExportUi()
</script>

<template>
  <div
    data-history-interactive
    class="shrink-0 border-t border-default bg-elevated pt-4"
    :class="$attrs.class"
  >
    <button
      v-if="!user && !isAuthLoading"
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold text-white transition hover:opacity-90"
      @click="signInForExport()"
    >
      Sign in to export
    </button>
    <button
      v-else-if="exportableConditions.length"
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition disabled:opacity-40"
      :class="pdfExportDownloadStarted
        ? 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400'
        : 'bg-primary text-white hover:opacity-90'"
      :disabled="!canConfirmPdfExport"
      @click="runPdfExport()"
    >
      <UIcon
        :name="pdfExportDownloadStarted ? 'i-lucide-folder-down' : 'i-lucide-download'"
        class="size-4"
      />
      {{ exportButtonLabel }}
    </button>
  </div>
</template>
