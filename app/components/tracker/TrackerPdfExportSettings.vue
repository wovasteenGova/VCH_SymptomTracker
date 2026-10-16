<script setup lang="ts">
import { PDF_EXPORT_ACKNOWLEDGMENT_LABEL } from '../../utils/pdfExportCertification'
import { useTrackerPdfExportUi } from '../../composables/useTrackerPdfExportUi'

const props = withDefaults(defineProps<{
  variant?: 'overlay' | 'inline'
  /** When false, parent pins actions outside the scroll area (mobile History Export tab). */
  showActionFooter?: boolean
}>(), {
  variant: 'inline',
  showActionFooter: true
})

const {
  user,
  isAuthLoading,
  exportableConditions,
  pdfExportType,
  pdfExportContentMode,
  pdfExportSeparateFamily,
  pdfExportPeriodPreset,
  pdfExportCustomStartDate,
  pdfExportCustomEndDate,
  pdfExportVaCutoffDate,
  pdfExportMarkVaSubmission,
  pdfExportAcknowledged,
  vaExportCutoffDate,
  exportTodayDateString,
  selectedExportConditionKeys,
  exportError,
  exportNotice,
  pdfExportDownloadStarted,
  pdfExportDescription,
  exportPeriodPreviewLabel,
  exportPeriodHelpText,
  formatStoredVaCutoffLabel,
  exportPeriodEntryPreview,
  exportPeriodValidationMessage,
  pdfExportContentDescription,
  exportSelectedFamilyEntryCount,
  allExportConditionsSelected,
  canConfirmPdfExport,
  exportButtonLabel,
  toggleAllExportConditions,
  toggleExportCondition,
  isExportConditionSelected,
  exportConditionEntryLabel,
  runPdfExport,
  signInForExport
} = useTrackerPdfExportUi()
</script>

<template>
  <div
    data-history-interactive
    :class="props.variant === 'overlay'
      ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
      : 'flex flex-col'"
  >
    <div
      :class="props.variant === 'overlay'
        ? 'no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4'
        : 'pb-4'"
    >
      <div v-if="!user && !isAuthLoading" class="py-8 text-center">
        <p class="font-bold text-highlighted">Sign in to export</p>
        <p class="mt-1 text-sm text-toned">
          Your symptom logs need to be saved to your account before you can download a PDF.
        </p>
      </div>

      <div v-else-if="!exportableConditions.length" class="py-8 text-center">
        <p class="font-bold text-highlighted">Nothing to export yet</p>
        <p class="mt-1 text-sm text-toned">
          Log at least one symptom entry, then come back here to build your PDF.
        </p>
      </div>

      <template v-else>
        <div class="rounded-full bg-muted p-1">
          <div class="grid grid-cols-2 gap-1">
            <button
              type="button"
              class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
              :class="pdfExportType === 'full'
                ? 'bg-elevated text-highlighted shadow-sm'
                : 'text-muted'"
              @click="pdfExportType = 'full'"
            >
              Full report
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
              :class="pdfExportType === 'cp-exam'
                ? 'bg-elevated text-highlighted shadow-sm'
                : 'text-muted'"
              @click="pdfExportType = 'cp-exam'"
            >
              Personal review
            </button>
          </div>
        </div>

        <p class="mt-3 text-xs leading-5 text-muted">
          {{ pdfExportDescription }}
        </p>

        <div class="mt-5 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Reporting period
            </p>
            <p
              v-if="exportPeriodPreviewLabel"
              class="text-right text-[0.6875rem] font-semibold text-primary"
            >
              {{ exportPeriodPreviewLabel }}
            </p>
          </div>

          <div class="rounded-full bg-muted p-1">
            <div class="grid grid-cols-3 gap-1">
              <button
                type="button"
                class="rounded-full px-2 py-2.5 text-[0.6875rem] font-semibold transition"
                :class="pdfExportPeriodPreset === 'full'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="pdfExportPeriodPreset = 'full'"
              >
                Full history
              </button>
              <button
                type="button"
                class="rounded-full px-2 py-2.5 text-[0.6875rem] font-semibold transition"
                :class="pdfExportPeriodPreset === 'since-last-va'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="pdfExportPeriodPreset = 'since-last-va'"
              >
                New evidence
              </button>
              <button
                type="button"
                class="rounded-full px-2 py-2.5 text-[0.6875rem] font-semibold transition"
                :class="pdfExportPeriodPreset === 'custom'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="pdfExportPeriodPreset = 'custom'"
              >
                Custom dates
              </button>
            </div>
          </div>

          <p class="text-xs leading-5 text-muted">
            {{ exportPeriodHelpText }}
          </p>

          <div
            v-if="pdfExportPeriodPreset === 'since-last-va' && !vaExportCutoffDate"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/30"
          >
            <p class="text-xs font-semibold text-amber-950 dark:text-amber-100">
              When did you last submit symptom logs to the VA?
            </p>
            <p class="mt-1 text-xs leading-5 text-amber-900/90 dark:text-amber-100/90">
              Pick the last day included in that submission. Your next export will start the day after.
            </p>
            <input
              v-model="pdfExportVaCutoffDate"
              type="date"
              :max="exportTodayDateString"
              class="mt-3 w-full rounded-xl border border-default bg-default px-3 py-2.5 text-xs text-highlighted"
            >
          </div>

          <div
            v-else-if="pdfExportPeriodPreset === 'since-last-va' && vaExportCutoffDate"
            class="rounded-2xl border border-default bg-muted/40 px-4 py-3 text-xs leading-5 text-toned"
          >
            Last VA submission remembered through
            <span class="font-semibold text-highlighted">{{ formatStoredVaCutoffLabel }}</span>.
            This export includes logs after that date only.
          </div>

          <div
            v-if="pdfExportPeriodPreset === 'custom'"
            class="grid grid-cols-2 gap-3"
          >
            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-muted">From</span>
              <input
                v-model="pdfExportCustomStartDate"
                type="date"
                :max="pdfExportCustomEndDate || exportTodayDateString"
                class="w-full rounded-xl border border-default bg-default px-3 py-2.5 text-xs text-highlighted"
              >
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-muted">Through</span>
              <input
                v-model="pdfExportCustomEndDate"
                type="date"
                :min="pdfExportCustomStartDate || undefined"
                :max="exportTodayDateString"
                class="w-full rounded-xl border border-default bg-default px-3 py-2.5 text-xs text-highlighted"
              >
            </label>
          </div>

          <p
            v-if="exportPeriodEntryPreview"
            class="rounded-2xl border border-default bg-muted/30 px-4 py-3 text-xs leading-5 text-toned"
          >
            {{ exportPeriodEntryPreview }}
          </p>

          <p
            v-if="exportPeriodValidationMessage"
            class="text-xs font-medium text-amber-700 dark:text-amber-200"
          >
            {{ exportPeriodValidationMessage }}
          </p>
        </div>

        <div v-if="pdfExportType === 'full'" class="mt-4 space-y-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Report content
            </p>
            <div class="mt-2 rounded-full bg-muted p-1">
              <div class="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                  :class="pdfExportContentMode === 'charts'
                    ? 'bg-elevated text-highlighted shadow-sm'
                    : 'text-muted'"
                  @click="pdfExportContentMode = 'charts'"
                >
                  Charts + entries
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                  :class="pdfExportContentMode === 'entries-only'
                    ? 'bg-elevated text-highlighted shadow-sm'
                    : 'text-muted'"
                  @click="pdfExportContentMode = 'entries-only'"
                >
                  Entries only
                </button>
              </div>
            </div>
            <p class="mt-2 text-xs leading-5 text-muted">
              {{ pdfExportContentDescription }}
            </p>
          </div>

          <label
            v-if="exportSelectedFamilyEntryCount"
            class="flex items-start gap-3 rounded-2xl border border-default bg-muted/40 px-4 py-4"
          >
            <input
              v-model="pdfExportSeparateFamily"
              type="checkbox"
              class="mt-0.5 size-4 rounded border-default text-highlighted focus:ring-primary"
            >
            <span class="text-xs leading-5 text-toned">
              <span class="font-semibold text-highlighted">Download family and friend reports separately</span>
              <span class="mt-1 block">
                Family and friend observations can be powerful evidence. Submitting them in a separate PDF makes it harder for raters to miss them.
                You will get two files: your logs and a family observations report.
              </span>
            </span>
          </label>
        </div>

        <div class="mt-5 flex items-center justify-between gap-3">
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Conditions
          </p>
          <button
            type="button"
            class="text-xs font-semibold text-primary transition hover:opacity-90"
            @click="toggleAllExportConditions()"
          >
            {{ allExportConditionsSelected ? 'Clear all' : 'Select all' }}
          </button>
        </div>

        <div class="mt-2 space-y-2">
          <label
            v-for="condition in exportableConditions"
            :key="condition.key"
            class="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition"
            :class="isExportConditionSelected(condition.key)
              ? 'bg-muted/80'
              : 'bg-transparent'"
          >
            <input
              type="checkbox"
              class="size-4 shrink-0 rounded border-default text-highlighted focus:ring-primary"
              :checked="isExportConditionSelected(condition.key)"
              @change="toggleExportCondition(condition.key)"
            >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-highlighted">{{ condition.label }}</span>
              <span class="mt-0.5 block text-xs text-muted">
                {{ exportConditionEntryLabel(condition.key, condition.entryCount) }}
              </span>
            </span>
          </label>
        </div>

        <p
          v-if="!selectedExportConditionKeys.length"
          class="mt-3 text-xs font-medium text-amber-700 dark:text-amber-200"
        >
          Select at least one condition to include in the PDF.
        </p>

        <label
          v-if="pdfExportType === 'full'"
          class="mt-4 flex items-start gap-3 rounded-2xl border border-default bg-muted/30 px-4 py-4"
        >
          <input
            v-model="pdfExportMarkVaSubmission"
            type="checkbox"
            class="mt-0.5 size-4 rounded border-default text-highlighted focus:ring-primary"
          >
          <span class="text-xs leading-5 text-toned">
            <span class="font-semibold text-highlighted">Remember this as submitted to the VA</span>
            <span class="mt-1 block">
              Next time you choose New evidence, the export will start after this reporting period so you do not resubmit older logs.
            </span>
          </span>
        </label>

        <label
          v-if="pdfExportType === 'full'"
          class="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/30"
        >
          <input
            v-model="pdfExportAcknowledged"
            type="checkbox"
            class="mt-0.5 size-4 rounded border-default text-highlighted focus:ring-primary"
          >
          <span class="text-xs leading-5 text-amber-950 dark:text-amber-100">
            {{ PDF_EXPORT_ACKNOWLEDGMENT_LABEL }}
          </span>
        </label>

        <p v-if="exportError" class="mt-4 text-sm font-medium text-red-600 dark:text-red-300" aria-live="assertive">
          {{ exportError }}
        </p>

        <p
          v-if="pdfExportDownloadStarted && exportNotice"
          class="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
          aria-live="polite"
        >
          <UIcon name="i-lucide-circle-check" class="mt-0.5 size-4 shrink-0" />
          <span>{{ exportNotice }}</span>
        </p>
      </template>
    </div>

    <div
      v-if="props.showActionFooter"
      :class="props.variant === 'overlay'
        ? 'border-t border-default px-5 py-4'
        : 'border-t border-default bg-elevated pt-4'"
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
  </div>
</template>
