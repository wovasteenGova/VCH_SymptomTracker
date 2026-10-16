import { inject } from 'vue'
import { TRACKER_PDF_EXPORT_UI_KEY, type TrackerPdfExportUiContext } from '../utils/trackerPdfExportUiKey'

export function useTrackerPdfExportUi(): TrackerPdfExportUiContext {
  const context = inject(TRACKER_PDF_EXPORT_UI_KEY)

  if (!context) {
    throw new Error('useTrackerPdfExportUi() requires provide on the app home page')
  }

  return context
}
