<script setup lang="ts">
import { inject } from 'vue'
import { PDF_EXPORT_ACKNOWLEDGMENT_LABEL } from '../../utils/pdfExportCertification'
import { TRACKER_PDF_EXPORT_UI_KEY } from '../../utils/trackerPdfExportUiKey'

defineProps<{
  variant?: 'overlay' | 'inline'
}>()

const ui = inject(TRACKER_PDF_EXPORT_UI_KEY)

if (!ui) {
  throw new Error('TrackerPdfExportSettings requires TRACKER_PDF_EXPORT_UI_KEY')
}
</script>

<template>
  <div
    data-history-interactive
    :class="variant === 'overlay'
      ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
      : 'flex flex-col'"
  >
    <div
      :class="variant === 'overlay'
        ? 'no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4'
        : 'pb-4'"
    >
      <div v-if="!ui.user && !ui.isAuthLoading" class="py-8 text-center">
        <p class="font-bold text-highlighted">Sign in to export</p>
        <p class="mt-1 text-sm text-toned">
          Your symptom logs need to be saved to your account before you can download a PDF.
        </p>
      </div>

      <div v-else-if="!ui.exportableConditions.length" class="py-8 text-center">
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
              :class="ui.pdfExportType === 'full'
                ? 'bg-elevated text-highlighted shadow-sm'
                : 'text-muted'"
              @click="ui.pdfExportType = 'full'"
            >
              Full report
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
              :class="ui.pdfExportType === 'cp-exam'
                ? 'bg-elevated text-highlighted shadow-sm'
                : 'text-muted'"
              @click="ui.pdfExportType = 'cp-exam'"
            >
              Personal review
            </button>
          </div>
        </div>

        <p class="mt-3 text-xs leading-5 text-muted">
          {{ ui.pdfExportDescription }}
        </p>

        <div class="mt-5 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Reporting period
            </p>
            <p
              v-if="ui.exportPeriodPreviewLabel"
              class="text-right text-[0.6875rem] font-semibold text-primary"
            >
              {{ ui.exportPeriodPreviewLabel }}
            </p>
          </div>

          <div class="rounded-full bg-muted p-1">
            <div class="grid grid-cols-3 gap-1">
              <button
                type="button"
                class="rounded-full px-2 py-2.5 text-[0.6875rem] font-semibold transition"
                :class="ui.pdfExportPeriodPreset === 'full'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="ui.pdfExportPeriodPreset = 'full'"
              >
                Full history
              </button>
              <button
                type="button"
                class="rounded-full px-2 py-2.5 text-[0.6875rem] font-semibold transition"
                :class="ui.pdfExportPeriodPreset === 'since-last-va'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="ui.pdfExportPeriodPreset = 'since-last-va'"
              >
                New evidence
              </button>
              <button
                type="button"
                class="rounded-full px-2 py-2.5 text-[0.6875rem] font-semibold transition"
                :class="ui.pdfExportPeriodPreset === 'custom'
                  ? 'bg-elevated text-highlighted shadow-sm'
                  : 'text-muted'"
                @click="ui.pdfExportPeriodPreset = 'custom'"
              >
                Custom dates
              </button>
            </div>
          </div>

          <p class="text-xs leading-5 text-muted">
            {{ ui.exportPeriodHelpText }}
          </p>

          <div
            v-if="ui.pdfExportPeriodPreset === 'since-last-va' && !ui.vaExportCutoffDate"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/30"
          >
            <p class="text-xs font-semibold text-amber-950 dark:text-amber-100">
              When did you last submit symptom logs to the VA?
            </p>
            <p class="mt-1 text-xs leading-5 text-amber-900/90 dark:text-amber-100/90">
              Pick the last day included in that submission. Your next export will start the day after.
            </p>
            <input
              v-model="ui.pdfExportVaCutoffDate"
              type="date"
              :max="ui.exportTodayDateString"
              class="mt-3 w-full rounded-xl border border-default bg-default px-3 py-2.5 text-xs text-highlighted"
            >
          </div>

          <div
            v-else-if="ui.pdfExportPeriodPreset === 'since-last-va' && ui.vaExportCutoffDate"
            class="rounded-2xl border border-default bg-muted/40 px-4 py-3 text-xs leading-5 text-toned"
          >
            Last VA submission remembered through
            <span class="font-semibold text-highlighted">{{ ui.formatStoredVaCutoffLabel }}</span>.
            This export includes logs after that date only.
          </div>

          <div
            v-if="ui.pdfExportPeriodPreset === 'custom'"
            class="grid grid-cols-2 gap-3"
          >
            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-muted">From</span>
              <input
                v-model="ui.pdfExportCustomStartDate"
                type="date"
                :max="ui.pdfExportCustomEndDate || ui.exportTodayDateString"
                class="w-full rounded-xl border border-default bg-default px-3 py-2.5 text-xs text-highlighted"
              >
            </label>
            <label class="block">
              <span class="mb-1.5 block text-xs font-semibold text-muted">Through</span>
              <input
                v-model="ui.pdfExportCustomEndDate"
                type="date"
                :min="ui.pdfExportCustomStartDate || undefined"
                :max="ui.exportTodayDateString"
                class="w-full rounded-xl border border-default bg-default px-3 py-2.5 text-xs text-highlighted"
              >
            </label>
          </div>

          <p
            v-if="ui.exportPeriodEntryPreview"
            class="rounded-2xl border border-default bg-muted/30 px-4 py-3 text-xs leading-5 text-toned"
          >
            {{ ui.exportPeriodEntryPreview }}
          </p>

          <p
            v-if="ui.exportPeriodValidationMessage"
            class="text-xs font-medium text-amber-700 dark:text-amber-200"
          >
            {{ ui.exportPeriodValidationMessage }}
          </p>
        </div>

        <div v-if="ui.pdfExportType === 'full'" class="mt-4 space-y-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Report content
            </p>
            <div class="mt-2 rounded-full bg-muted p-1">
              <div class="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                  :class="ui.pdfExportContentMode === 'charts'
                    ? 'bg-elevated text-highlighted shadow-sm'
                    : 'text-muted'"
                  @click="ui.pdfExportContentMode = 'charts'"
                >
                  Charts + entries
                </button>
                <button
                  type="button"
                  class="rounded-full px-3 py-2.5 text-xs font-semibold transition"
                  :class="ui.pdfExportContentMode === 'entries-only'
                    ? 'bg-elevated text-highlighted shadow-sm'
                    : 'text-muted'"
                  @click="ui.pdfExportContentMode = 'entries-only'"
                >
                  Entries only
                </button>
              </div>
            </div>
            <p class="mt-2 text-xs leading-5 text-muted">
              {{ ui.pdfExportContentDescription }}
            </p>
          </div>

          <label
            v-if="ui.exportSelectedFamilyEntryCount"
            class="flex items-start gap-3 rounded-2xl border border-default bg-muted/40 px-4 py-4"
          >
            <input
              v-model="ui.pdfExportSeparateFamily"
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
            @click="ui.toggleAllExportConditions()"
          >
            {{ ui.allExportConditionsSelected ? 'Clear all' : 'Select all' }}
          </button>
        </div>

        <div class="mt-2 space-y-2">
          <label
            v-for="condition in ui.exportableConditions"
            :key="condition.key"
            class="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition"
            :class="ui.isExportConditionSelected(condition.key)
              ? 'bg-muted/80'
              : 'bg-transparent'"
          >
            <input
              type="checkbox"
              class="size-4 shrink-0 rounded border-default text-highlighted focus:ring-primary"
              :checked="ui.isExportConditionSelected(condition.key)"
              @change="ui.toggleExportCondition(condition.key)"
            >
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-highlighted">{{ condition.label }}</span>
              <span class="mt-0.5 block text-xs text-muted">
                {{ ui.exportConditionEntryLabel(condition.key, condition.entryCount) }}
              </span>
            </span>
          </label>
        </div>

        <p
          v-if="!ui.selectedExportConditionKeys.length"
          class="mt-3 text-xs font-medium text-amber-700 dark:text-amber-200"
        >
          Select at least one condition to include in the PDF.
        </p>

        <label
          v-if="ui.pdfExportType === 'full'"
          class="mt-4 flex items-start gap-3 rounded-2xl border border-default bg-muted/30 px-4 py-4"
        >
          <input
            v-model="ui.pdfExportMarkVaSubmission"
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
          v-if="ui.pdfExportType === 'full'"
          class="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900/60 dark:bg-amber-950/30"
        >
          <input
            v-model="ui.pdfExportAcknowledged"
            type="checkbox"
            class="mt-0.5 size-4 rounded border-default text-highlighted focus:ring-primary"
          >
          <span class="text-xs leading-5 text-amber-950 dark:text-amber-100">
            {{ PDF_EXPORT_ACKNOWLEDGMENT_LABEL }}
          </span>
        </label>

        <p v-if="ui.exportError" class="mt-4 text-sm font-medium text-red-600 dark:text-red-300" aria-live="assertive">
          {{ ui.exportError }}
        </p>

        <p
          v-if="ui.pdfExportDownloadStarted && ui.exportNotice"
          class="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
          aria-live="polite"
        >
          <UIcon name="i-lucide-circle-check" class="mt-0.5 size-4 shrink-0" />
          <span>{{ ui.exportNotice }}</span>
        </p>
      </template>
    </div>

    <div
      :class="variant === 'overlay'
        ? 'border-t border-default px-5 py-4'
        : 'sticky bottom-0 border-t border-default bg-elevated pt-4'"
    >
      <button
        v-if="!ui.user && !ui.isAuthLoading"
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold text-white transition hover:opacity-90"
        @click="ui.signInForExport()"
      >
        Sign in to export
      </button>
      <button
        v-else-if="ui.exportableConditions.length"
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition disabled:opacity-40"
        :class="ui.pdfExportDownloadStarted
          ? 'bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400'
          : 'bg-primary text-white hover:opacity-90'"
        :disabled="!ui.canConfirmPdfExport"
        @click="ui.runPdfExport()"
      >
        <UIcon
          :name="ui.pdfExportDownloadStarted ? 'i-lucide-folder-down' : 'i-lucide-download'"
          class="size-4"
        />
        {{ ui.exportButtonLabel }}
      </button>
    </div>
  </div>
</template>
