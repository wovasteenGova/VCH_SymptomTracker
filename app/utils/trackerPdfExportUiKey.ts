import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { ExportPeriodPreset } from './exportDateRange'

export type ExportableConditionOption = {
  key: string
  label: string
  entryCount: number
}

export type TrackerPdfExportUiContext = {
  user: Ref<{ id: string } | null | undefined>
  isAuthLoading: Ref<boolean>
  exportableConditions: ComputedRef<ExportableConditionOption[]>
  pdfExportType: Ref<'full' | 'cp-exam'>
  pdfExportContentMode: Ref<'charts' | 'entries-only'>
  pdfExportSeparateFamily: Ref<boolean>
  pdfExportPeriodPreset: Ref<ExportPeriodPreset>
  pdfExportCustomStartDate: Ref<string>
  pdfExportCustomEndDate: Ref<string>
  pdfExportVaCutoffDate: Ref<string>
  pdfExportMarkVaSubmission: Ref<boolean>
  pdfExportAcknowledged: Ref<boolean>
  vaExportCutoffDate: Ref<string | null>
  exportTodayDateString: string
  selectedExportConditionKeys: Ref<string[]>
  exportError: Ref<string>
  exportNotice: Ref<string>
  pdfExportDownloadStarted: Ref<boolean>
  pdfExportDescription: ComputedRef<string>
  exportPeriodPreviewLabel: ComputedRef<string>
  exportPeriodHelpText: ComputedRef<string>
  formatStoredVaCutoffLabel: ComputedRef<string>
  exportPeriodEntryPreview: ComputedRef<string>
  exportPeriodValidationMessage: ComputedRef<string>
  pdfExportContentDescription: ComputedRef<string>
  exportSelectedFamilyEntryCount: ComputedRef<number>
  allExportConditionsSelected: ComputedRef<boolean>
  canConfirmPdfExport: ComputedRef<boolean>
  exportButtonLabel: ComputedRef<string>
  toggleAllExportConditions: () => void
  toggleExportCondition: (conditionKey: string) => void
  isExportConditionSelected: (conditionKey: string) => boolean
  exportConditionEntryLabel: (conditionKey: string, totalCount: number) => string
  runPdfExport: () => void | Promise<void>
  signInForExport: () => void
}

export const TRACKER_PDF_EXPORT_UI_KEY: InjectionKey<TrackerPdfExportUiContext> = Symbol('trackerPdfExportUi')
