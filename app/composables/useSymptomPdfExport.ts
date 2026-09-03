import { jsPDF } from 'jspdf'
import {
  buildReportMetrics,
  drawAggregateLoggingSection,
  drawCompactHeatmapGrid,
  drawConditionWeeklyFrequencyGrid,
  drawHorizontalBarChart,
  drawLineChart,
  drawLoggingActivitySection,
  drawSectionTitle,
  drawStatCards,
  drawVerticalBarChart,
} from '../utils/symptomReportCharts'
import { drawEntryLogSection } from '../utils/symptomReportEntryLog'
import type { EntryRevisionRecord } from '../utils/entryEditHistory'
import { getLogoFormat, loadReportLogoDataUrl, reportBranding } from '../utils/reportBranding'
import type { LoggingCadence } from '../utils/loggingCadence'
import { PDF_EXPORT_CERTIFICATION_TEXT } from '../utils/pdfExportCertification'
import {
  buildAllMonthMetrics,
  buildAggregateLoggingMetrics,
  buildConditionWeeklyFrequencyGroups,
  formatAggregateLoggingSummary
} from '../utils/loggingActivityReport'
import { buildCpExamReportTitle, buildCpExamSummaries } from '../utils/cpExamReport'
import { buildPersonalReviewPdfFilename, buildSymptomReportPdfFilename } from '../utils/pdfDownloadFilenames'
import { drawCpExamReportPdf } from '../utils/cpExamReportPdf'
import { collectMedicationsFromEntries } from '../utils/entryMedications'

type SymptomEntryRecord = {
  id: string
  condition_label: string
  condition_key?: string | null
  source?: string | null
  severity?: number | null
  occurred_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  edit_count?: number | null
  summary?: string | null
  impact?: string | null
  details?: Record<string, unknown> | null
}

type VeteranSignatureInfo = {
  veteranName?: string | null
  veteranEmail?: string | null
}

type PdfExportOptions = VeteranSignatureInfo & {
  includeLoggingCharts?: boolean
  includeAdvancedCharts?: boolean
  /** @deprecated Use includeAdvancedCharts */
  includeCharts?: boolean
  conditionLabel?: string | null
  loggingCadence?: LoggingCadence
  weeklyLogDay?: number
  reportVariant?: 'veteran' | 'family'
  entryRevisionsByEntryId?: Record<string, EntryRevisionRecord[]>
  reportingPeriodLabel?: string | null
  reportingPeriodSlug?: string | null
}

function resolveTypedSignatureName(signatureInfo: VeteranSignatureInfo) {
  return signatureInfo.veteranName?.trim() || null
}

const chartColors = [
  [14, 165, 233],
  [139, 92, 246],
  [16, 185, 129],
  [245, 158, 11],
  [249, 115, 22],
  [236, 72, 153]
] as const

function drawPageFooter(doc: jsPDF, pageNumber: number, totalPages: number, margin: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(reportBranding.organizationName, margin, pageHeight - 24)
  doc.text('Personal health record — veteran-reported symptom log', pageWidth / 2, pageHeight - 24, { align: 'center' })
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 24, { align: 'right' })
}

function measureWrappedLines(
  doc: jsPDF,
  lines: string[],
  lineHeight: number
) {
  return Math.max(lines.length, 1) * lineHeight
}

function drawVeteranElectronicSignatureSection(
  doc: jsPDF,
  y: number,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  signatureInfo: VeteranSignatureInfo = {}
) {
  const signedName = resolveTypedSignatureName(signatureInfo)
  if (!signedName) {
    throw new Error('Add your full name in Account Settings before exporting a signed PDF.')
  }

  const contactEmail = signatureInfo.veteranEmail?.trim() || null
  const innerPadX = 18
  const innerPadY = 20
  const innerWidth = contentWidth - innerPadX * 2
  const sectionTitleGap = 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const certificationLines = doc.splitTextToSize(
    PDF_EXPORT_CERTIFICATION_TEXT,
    innerWidth
  ) as string[]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const signatureLines = doc.splitTextToSize(
    `Electronic signature: /s/ ${signedName}`,
    innerWidth
  ) as string[]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const signedAtLines = doc.splitTextToSize(
    `Electronically signed on: ${new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}`,
    innerWidth
  ) as string[]
  const methodLines = doc.splitTextToSize(
    'Signature method: typed full legal name (not an image or email address).',
    innerWidth
  ) as string[]
  const emailLines = contactEmail
    ? doc.splitTextToSize(`Account email on file: ${contactEmail}`, innerWidth) as string[]
    : []

  const boxContentHeight = innerPadY
    + measureWrappedLines(doc, certificationLines, 13)
    + 14
    + measureWrappedLines(doc, signatureLines, 14)
    + 8
    + measureWrappedLines(doc, signedAtLines, 12)
    + 6
    + measureWrappedLines(doc, methodLines, 12)
    + (emailLines.length ? 6 + measureWrappedLines(doc, emailLines, 12) : 0)
    + innerPadY

  const totalSectionHeight = sectionTitleGap + boxContentHeight

  if (y + totalSectionHeight > pageHeight - 56) {
    doc.addPage()
    y = margin
  }

  drawSectionTitle(doc, 'Veteran electronic signature', margin, y)
  y += sectionTitleGap

  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, y, contentWidth, boxContentHeight, 12, 12, 'FD')

  const innerX = margin + innerPadX
  let textY = y + innerPadY

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  certificationLines.forEach((line) => {
    doc.text(line, innerX, textY)
    textY += 13
  })

  textY += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  signatureLines.forEach((line) => {
    doc.text(line, innerX, textY)
    textY += 14
  })

  textY += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  signedAtLines.forEach((line) => {
    doc.text(line, innerX, textY)
    textY += 12
  })

  textY += 4

  methodLines.forEach((line) => {
    doc.text(line, innerX, textY)
    textY += 12
  })

  if (emailLines.length) {
    textY += 4
    emailLines.forEach((line) => {
      doc.text(line, innerX, textY)
      textY += 12
    })
  }

  return y + boxContentHeight + 12
}

const PDF_SECTION_GAP = 28
const PDF_LOGGING_TO_WEEKLY_GAP = 36

function drawMedicationListSection(
  doc: jsPDF,
  y: number,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  medications: string[]
) {
  if (!medications.length) {
    return y
  }

  const lineHeight = 12
  const bulletLines = medications.flatMap((medication) =>
    doc.splitTextToSize(`• ${medication}`, contentWidth - 8) as string[]
  )
  const boxHeight = 18 + bulletLines.length * lineHeight + 10

  y = ensurePageSpace(doc, y, boxHeight + 24, margin, pageHeight)
  drawSectionTitle(doc, 'Medications (veteran-reported)', margin, y)
  y += 12

  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, y, contentWidth, boxHeight, 10, 10, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)

  let textY = y + 16
  bulletLines.forEach((line) => {
    doc.text(line, margin + 10, textY)
    textY += lineHeight
  })

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Pulled from medication input fields.', margin + 10, y + boxHeight - 8)

  return y + boxHeight + PDF_SECTION_GAP
}

function appendConditionWeeklyFrequencySection(
  doc: jsPDF,
  y: number,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  groups: ReturnType<typeof buildConditionWeeklyFrequencyGroups>
) {
  if (!groups.length) {
    return y
  }

  const estimatedHeight = groups.reduce((total, group) => {
    return total + 66 + group.rows.length * 24
  }, 0)

  y = ensurePageSpace(doc, y, Math.min(estimatedHeight, 220), margin, pageHeight)
  drawSectionTitle(doc, 'Weekly logs per condition', margin, y)
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Each row is one calendar month · week columns show log count', margin, y)
  y += 14

  return drawConditionWeeklyFrequencyGrid(
    doc,
    margin,
    y,
    contentWidth,
    groups,
    pageHeight,
    margin
  ) + PDF_SECTION_GAP
}

function ensurePageSpace(
  doc: jsPDF,
  y: number,
  neededHeight: number,
  margin: number,
  pageHeight: number
) {
  if (y + neededHeight > pageHeight - margin - 36) {
    doc.addPage()
    return margin
  }

  return y
}

export function useSymptomPdfExport() {
  async function downloadEntriesPdf(
    entries: SymptomEntryRecord[],
    options: PdfExportOptions = {}
  ) {
    const {
      includeLoggingCharts = true,
      includeAdvancedCharts = false,
      includeCharts,
      veteranName = null,
      veteranEmail = null,
      conditionLabel = null,
      loggingCadence = 'weekly',
      weeklyLogDay = 0,
      reportVariant,
      entryRevisionsByEntryId,
      reportingPeriodLabel = null,
      reportingPeriodSlug = null
    } = options
    const showAdvancedCharts = includeCharts ?? includeAdvancedCharts
    const signatureInfo = { veteranName, veteranEmail }

    if (!entries.length) {
      throw new Error('Add at least one symptom entry before exporting.')
    }

    if (!resolveTypedSignatureName(signatureInfo)) {
      throw new Error('Add your full name in Account Settings before exporting a signed PDF.')
    }

    const metrics = buildReportMetrics(entries)
    const allMonthMetrics = buildAllMonthMetrics(entries)
    const aggregateMetrics = buildAggregateLoggingMetrics(entries)
    const conditionWeeklyGroups = buildConditionWeeklyFrequencyGroups(entries)
    const hasLogs = aggregateMetrics.totalLogs > 0
    const logoDataUrl = await loadReportLogoDataUrl()

    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter'
    })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 42
    const contentWidth = pageWidth - margin * 2
    let y = margin

    const logoIsRenderable = Boolean(
      logoDataUrl
      && logoDataUrl.startsWith('data:image/')
      && !logoDataUrl.startsWith('data:image/svg')
    )

    // Modern dark header band with accent rule.
    const headerBandHeight = 92
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageWidth, headerBandHeight, 'F')
    doc.setFillColor(14, 165, 233)
    doc.rect(0, headerBandHeight, pageWidth, 3, 'F')

    if (logoIsRenderable) {
      try {
        doc.addImage(
          logoDataUrl!,
          getLogoFormat(logoDataUrl),
          margin,
          18,
          56,
          56
        )
      } catch {
        // Continue with text-only header if logo fails to render.
      }
    }

    const headerX = logoIsRenderable ? margin + 68 : margin

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text(reportBranding.organizationName, headerX, 38)

    doc.setFontSize(11)
    doc.setTextColor(125, 211, 252)
    doc.text(reportBranding.reportTitle, headerX, 56)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    const reportSubtitle = reportVariant === 'family'
      ? 'Family and friend observations'
      : reportVariant === 'veteran'
        ? (conditionLabel ? `${conditionLabel} veteran logs` : 'Veteran symptom logs')
        : (conditionLabel ? `${conditionLabel} symptom log` : reportBranding.reportSubtitle)
    doc.text(
      reportSubtitle,
      headerX,
      72
    )

    if (reportingPeriodLabel) {
      doc.setFontSize(8)
      doc.setTextColor(186, 230, 253)
      doc.text(`Reporting period: ${reportingPeriodLabel}`, headerX, 86)
    }

    doc.setFontSize(9)
    doc.setTextColor(203, 213, 225)
    doc.text(
      `Generated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      pageWidth - margin,
      38,
      { align: 'right' }
    )
    if (veteranName) {
      doc.text(`Prepared by ${veteranName}`, pageWidth - margin, 54, { align: 'right' })
    }

    y = headerBandHeight + 27

    y = drawStatCards(doc, margin, y, contentWidth, [
      { label: 'Total entries', value: String(metrics.totalEntries), accent: [14, 165, 233] },
      { label: 'Tracking period', value: metrics.trackingSpanLabel, accent: [139, 92, 246] },
      { label: 'Conditions', value: String(metrics.conditionCount), accent: [16, 185, 129] },
      { label: 'Avg severity', value: `${metrics.averageSeverity.toFixed(1)}/10`, accent: [245, 158, 11] },
      { label: 'Peak severity', value: `${metrics.peakSeverity}/10`, accent: [249, 115, 22] },
      { label: 'Severe days (7+)', value: String(metrics.flareDayCount), accent: [236, 72, 153] }
    ], 3) + PDF_SECTION_GAP

    const medicationList = collectMedicationsFromEntries(entries)
    y = drawMedicationListSection(doc, y, margin, contentWidth, pageHeight, medicationList)

    if (showAdvancedCharts) {
      y = ensurePageSpace(doc, y, 176, margin, pageHeight)
      drawSectionTitle(doc, 'Severity trend', margin, y)
      y += 14
      y = drawLineChart(doc, margin, y, contentWidth, 148, metrics.trend) + PDF_SECTION_GAP
    }

    if (includeLoggingCharts && hasLogs) {
      if (allMonthMetrics.length === 1) {
        y = drawLoggingActivitySection(
          doc,
          margin,
          y,
          contentWidth,
          pageHeight,
          margin,
          allMonthMetrics[0],
          formatAggregateLoggingSummary(aggregateMetrics),
          { week: false, condition: false, heatmap: false }
        )

        y += PDF_LOGGING_TO_WEEKLY_GAP

        y = appendConditionWeeklyFrequencySection(
          doc,
          y,
          margin,
          contentWidth,
          pageHeight,
          conditionWeeklyGroups
        )

        y = drawLoggingActivitySection(
          doc,
          margin,
          y,
          contentWidth,
          pageHeight,
          margin,
          allMonthMetrics[0],
          '',
          { week: false, condition: showAdvancedCharts, heatmap: true, skipHeader: true }
        )
      } else {
        y = drawAggregateLoggingSection(
          doc,
          margin,
          y,
          contentWidth,
          pageHeight,
          margin,
          aggregateMetrics,
          formatAggregateLoggingSummary(aggregateMetrics),
          { showConditionChart: showAdvancedCharts }
        )

        y += PDF_LOGGING_TO_WEEKLY_GAP

        y = appendConditionWeeklyFrequencySection(
          doc,
          y,
          margin,
          contentWidth,
          pageHeight,
          conditionWeeklyGroups
        )

        y = ensurePageSpace(doc, y, 160, margin, pageHeight)
        drawSectionTitle(doc, `Daily logging consistency — ${aggregateMetrics.rangeLabel}`, margin, y)
        y += 10
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('How consistently you logged across each month in this report', margin, y)
        y += 14
        y = drawCompactHeatmapGrid(
          doc,
          margin,
          y,
          contentWidth,
          allMonthMetrics,
          pageHeight,
          margin
        ) + PDF_SECTION_GAP
      }
    }

    if (showAdvancedCharts) {
      if (metrics.impactBreakdown.length) {
        const impactChartHeight = Math.max(96, metrics.impactBreakdown.length * 28 + 28)
        y = ensurePageSpace(doc, y, impactChartHeight + 40, margin, pageHeight)
        drawSectionTitle(doc, 'Reported functional impacts', margin, y)
        y += 14
        y = drawHorizontalBarChart(
          doc,
          margin,
          y,
          contentWidth,
          impactChartHeight,
          metrics.impactBreakdown,
          [[236, 72, 153]],
          { labelWidth: 180 }
        ) + PDF_SECTION_GAP
      }

      if (metrics.avgSeverityByCondition.length > 1) {
        const avgChartHeight = Math.max(96, metrics.avgSeverityByCondition.length * 28 + 28)
        y = ensurePageSpace(doc, y, avgChartHeight + 40, margin, pageHeight)
        drawSectionTitle(doc, 'Average severity by condition (0–10)', margin, y)
        y += 14
        y = drawHorizontalBarChart(
          doc,
          margin,
          y,
          contentWidth,
          avgChartHeight,
          metrics.avgSeverityByCondition,
          [[245, 158, 11]],
          { labelWidth: 150, maxValue: 10 }
        ) + PDF_SECTION_GAP
      }

      y = ensurePageSpace(doc, y, 176, margin, pageHeight)

      const columnGap = 14
      const columnWidth = (contentWidth - columnGap) / 2

      drawSectionTitle(doc, 'Total entries per condition', margin, y)
      drawSectionTitle(doc, 'Severity bands', margin + columnWidth + columnGap, y)
      y += 10
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text('Full export range · each saved entry counts once', margin, y)
      y += 14

      drawHorizontalBarChart(
        doc,
        margin,
        y,
        columnWidth,
        148,
        metrics.conditionBreakdown,
        chartColors
      )

      drawVerticalBarChart(
        doc,
        margin + columnWidth + columnGap,
        y,
        columnWidth,
        148,
        [
          { label: 'Mild', value: metrics.severityBands.mild },
          { label: 'Mod', value: metrics.severityBands.moderate },
          { label: 'Severe', value: metrics.severityBands.severe }
        ],
        [[16, 185, 129], [245, 158, 11], [249, 115, 22]]
      )

      y += 148 + PDF_SECTION_GAP
      y = ensurePageSpace(doc, y, 176, margin, pageHeight)

      drawSectionTitle(doc, 'Monthly activity', margin, y)
      y += 14
      y = drawVerticalBarChart(doc, margin, y, contentWidth, 156, metrics.monthActivity, chartColors) + PDF_SECTION_GAP

      if (metrics.extendedConditionBreakdown.length) {
        const extendedChartHeight = Math.max(160, metrics.extendedConditionBreakdown.length * 28 + 36)
        y = ensurePageSpace(doc, y, extendedChartHeight + 40, margin, pageHeight)
        drawSectionTitle(doc, 'Additional conditions tracked', margin, y)
        y += 14
        y = drawHorizontalBarChart(
          doc,
          margin,
          y,
          contentWidth,
          extendedChartHeight,
          metrics.extendedConditionBreakdown,
          chartColors
        ) + PDF_SECTION_GAP
      }

      const sourceChartHeight = Math.max(96, metrics.sourceBreakdown.length * 28 + 28)
      y = ensurePageSpace(doc, y, sourceChartHeight + 40, margin, pageHeight)
      drawSectionTitle(doc, 'Report source mix', margin, y)
      y += 14
      drawHorizontalBarChart(
        doc,
        margin,
        y,
        contentWidth,
        sourceChartHeight,
        metrics.sourceBreakdown,
        [[14, 165, 233], [139, 92, 246]]
      )
      y += sourceChartHeight + PDF_SECTION_GAP
    }

    y = ensurePageSpace(doc, y, 120, margin, pageHeight)
    const entryLogIncludesCharts = includeLoggingCharts || showAdvancedCharts
    y = drawEntryLogSection(
      doc,
      entries,
      margin,
      y,
      contentWidth,
      margin,
      pageHeight,
      {
        loggingCadence,
        weeklyLogDay,
        reportMode: entryLogIncludesCharts ? 'full' : 'entries-only',
        reportVariant,
        includeAdvancedCharts: showAdvancedCharts,
        entryRevisionsByEntryId
      }
    )

    drawVeteranElectronicSignatureSection(
      doc,
      y,
      margin,
      contentWidth,
      pageHeight,
      signatureInfo
    )

    const totalPages = doc.getNumberOfPages()
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      doc.setPage(pageNumber)
      drawPageFooter(doc, pageNumber, totalPages, margin)
    }

    const exportedAt = new Date()

    doc.save(buildSymptomReportPdfFilename({
      conditionLabel,
      reportVariant,
      reportMode: entryLogIncludesCharts ? 'full' : 'entries-only',
      reportingPeriodSlug
    }, exportedAt))
  }

  async function downloadCpExamPdf(
    entries: SymptomEntryRecord[],
    options: Pick<PdfExportOptions, 'veteranName' | 'conditionLabel' | 'reportingPeriodLabel' | 'reportingPeriodSlug'> = {}
  ) {
    const {
      veteranName = null,
      conditionLabel = null,
      reportingPeriodLabel = null,
      reportingPeriodSlug = null
    } = options

    if (!entries.length) {
      throw new Error('Add at least one symptom entry before exporting.')
    }

    const summaries = buildCpExamSummaries(entries)
    if (!summaries.length) {
      throw new Error('No valid symptom entries found for personal review export.')
    }

    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter'
    })

    drawCpExamReportPdf({
      doc,
      summaries,
      veteranName,
      reportTitle: buildCpExamReportTitle(conditionLabel),
      conditionLabel,
      reportingPeriodLabel
    })

    doc.save(buildPersonalReviewPdfFilename(conditionLabel, new Date(), reportingPeriodSlug))
  }

  return {
    downloadEntriesPdf,
    downloadCpExamPdf
  }
}
