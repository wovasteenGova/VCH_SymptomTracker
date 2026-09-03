import type { jsPDF } from 'jspdf'
import type { CpExamConditionSummary } from './cpExamReport'
import { buildPersonalReviewPdfFilename } from './pdfDownloadFilenames'
import { CP_PREP_DISCLAIMER_BODY, CP_PREP_DISCLAIMER_TITLE, reportBranding } from './reportBranding'

const slate900 = [15, 23, 42] as const
const slate700 = [51, 65, 85] as const
const slate500 = [100, 116, 139] as const
const slate200 = [226, 232, 240] as const
const sky100 = [224, 242, 254] as const
const sky700 = [3, 105, 161] as const
const amber700 = [180, 83, 9] as const
const amber100 = [254, 243, 199] as const
const amber900 = [120, 53, 15] as const

function setFill(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}

function setStroke(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function setText(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
}

function ensurePageSpace(
  doc: jsPDF,
  y: number,
  neededHeight: number,
  margin: number,
  pageHeight: number
) {
  if (y + neededHeight > pageHeight - margin - 28) {
    doc.addPage()
    return margin
  }

  return y
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  lineHeight: number,
  color: readonly [number, number, number] = slate700
) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  setText(doc, color)
  const lines = doc.splitTextToSize(text, width) as string[]

  lines.forEach((line) => {
    doc.text(line, x, y)
    y += lineHeight
  })

  return y
}

function measureWrappedLinesHeight(
  doc: jsPDF,
  lines: string[],
  lineHeight: number
) {
  return Math.max(lines.length, 1) * lineHeight
}

function wrapNoteLines(doc: jsPDF, note: string, width: number) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  return doc.splitTextToSize(`• ${note}`, width) as string[]
}

function drawPageFooter(doc: jsPDF, pageNumber: number, totalPages: number, margin: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  setStroke(doc, slate200)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setText(doc, slate500)
  doc.text(reportBranding.organizationName, margin, pageHeight - 18)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  setText(doc, amber700)
  doc.text(CP_PREP_DISCLAIMER_TITLE, pageWidth / 2, pageHeight - 18, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  setText(doc, slate500)
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 18, { align: 'right' })
}

function drawConditionCard(
  doc: jsPDF,
  summary: CpExamConditionSummary,
  x: number,
  y: number,
  width: number,
  margin: number,
  pageHeight: number
) {
  const padX = 14
  const innerWidth = width - padX * 2
  const recentWeeksLine = summary.recentWeeklyCounts
    .map((week) => `${week.label}: ${week.count}`)
    .join('   ')

  const impactLines = summary.functionalImpacts.length
    ? summary.functionalImpacts.map((impact) => `• ${impact}`)
    : ['• No functional impact logged yet']

  const noteLineGroups = summary.reportedNotes.map((note) => wrapNoteLines(doc, note, innerWidth))
  const notesHeight = noteLineGroups.reduce((total, lines) => total + measureWrappedLinesHeight(doc, lines, 12), 0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const talkingPointLines = doc.splitTextToSize(summary.talkingPoint, innerWidth) as string[]
  const talkingPointHeight = measureWrappedLinesHeight(doc, talkingPointLines, 12)

  const cardHeight = 34
    + 22
    + talkingPointHeight
    + 16
    + 54
    + 34
    + 34
    + 16
    + impactLines.length * 13
    + (summary.reportedNotes.length ? 18 + notesHeight + 8 : 0)
    + 12

  y = ensurePageSpace(doc, y, cardHeight, margin, pageHeight)

  setStroke(doc, slate200)
  setFill(doc, [255, 255, 255])
  doc.roundedRect(x, y, width, cardHeight, 12, 12, 'FD')

  let textY = y + 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setText(doc, slate900)
  doc.text(summary.conditionLabel, x + padX, textY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, slate500)
  doc.text(`${summary.entryCount} logs · ${summary.trackingSpanLabel}`, x + width - padX, textY, { align: 'right' })

  textY += 22

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setText(doc, sky700)
  doc.text('TOPICS YOU LOGGED FREQUENTLY', x + padX, textY)

  textY += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, slate700)
  talkingPointLines.forEach((line) => {
    doc.text(line, x + padX, textY)
    textY += 12
  })

  textY += 10

  setFill(doc, sky100)
  doc.roundedRect(x + padX, textY, innerWidth, 44, 8, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setText(doc, sky700)
  doc.text('FREQUENCY YOU LOGGED', x + padX + 10, textY + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, slate900)
  doc.text(summary.recentFrequencyLabel, x + padX + 10, textY + 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, slate500)
  doc.text(`Overall average: ${summary.overallFrequencyLabel}`, x + padX + 10, textY + 38)

  textY += 54

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setText(doc, slate500)
  doc.text('SEVERITY YOU LOGGED', x + padX, textY)
  doc.text('LAST 4 WEEKS', x + padX + innerWidth / 2, textY)

  textY += 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setText(doc, slate900)
  doc.text(summary.severityLabel, x + padX, textY + 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, slate700)
  doc.text(recentWeeksLine, x + padX + innerWidth / 2, textY + 2)

  textY += 24

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setText(doc, slate500)
  doc.text('FUNCTIONAL IMPACT YOU LOGGED', x + padX, textY)

  textY += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, slate700)
  impactLines.forEach((line) => {
    doc.text(line, x + padX, textY)
    textY += 13
  })

  if (summary.reportedNotes.length) {
    textY += 8

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setText(doc, slate500)
    doc.text('NOTES FROM YOUR LOGS', x + padX, textY)

    textY += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setText(doc, slate700)
    noteLineGroups.forEach((lines) => {
      lines.forEach((line) => {
        doc.text(line, x + padX, textY)
        textY += 12
      })
    })
  }

  return y + cardHeight + 14
}

export function drawCpExamReportPdf(options: {
  doc: jsPDF
  summaries: CpExamConditionSummary[]
  veteranName?: string | null
  reportTitle: string
  conditionLabel?: string | null
  reportingPeriodLabel?: string | null
}) {
  const { doc, summaries, veteranName, reportTitle, reportingPeriodLabel = null } = options
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  let y = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  setText(doc, slate900)
  doc.text(reportTitle, margin, y)

  y += 22

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, slate500)
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    margin,
    y
  )

  if (veteranName) {
    doc.text(`Prepared for ${veteranName}`, pageWidth - margin, y, { align: 'right' })
  }

  if (reportingPeriodLabel) {
    y += 14
    doc.text(`Reporting period: ${reportingPeriodLabel}`, margin, y)
  }

  y += 18

  setFill(doc, amber100)
  setStroke(doc, amber700)
  doc.setLineWidth(0.75)
  const noticeLines = doc.splitTextToSize(CP_PREP_DISCLAIMER_TITLE, contentWidth - 24) as string[]
  const noticeHeight = noticeLines.length * 13 + 22
  doc.roundedRect(margin, y, contentWidth, noticeHeight, 8, 8, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, amber900)
  let noticeY = y + 16
  noticeLines.forEach((line) => {
    doc.text(line, margin + 12, noticeY)
    noticeY += 13
  })

  y += noticeHeight + 12

  y = drawWrappedText(
    doc,
    `${CP_PREP_DISCLAIMER_BODY} Topics below are generated from your logged frequency, severity, functional impact, and notes — not medical or legal advice.`,
    margin,
    y,
    contentWidth,
    9,
    12,
    slate700
  ) + 10

  for (const summary of summaries) {
    y = drawConditionCard(doc, summary, margin, y, contentWidth, margin, pageHeight)
  }

  const totalPages = doc.getNumberOfPages()
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber)
    drawPageFooter(doc, pageNumber, totalPages, margin)
  }
}

export function buildCpExamPdfFilename(conditionLabel: string | null | undefined) {
  return buildPersonalReviewPdfFilename(conditionLabel)
}
