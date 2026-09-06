import type { jsPDF } from 'jspdf'
import { normalizeConditionLabel } from './conditionCatalog'
import type { ConditionWeeklyFrequencyGroup, LoggingActivityMetrics } from './loggingActivityReport'

type ChartEntry = {
  condition_label: string
  source?: string | null
  severity?: number | null
  occurred_at?: string | null
  created_at?: string | null
  impact?: string | null
}

const slate900 = [15, 23, 42] as const
const slate500 = [100, 116, 139] as const
const slate200 = [226, 232, 240] as const
const emerald500 = [16, 185, 129] as const
const amber500 = [245, 158, 11] as const
const orange500 = [249, 115, 22] as const
const sky500 = [14, 165, 233] as const
const violet500 = [139, 92, 246] as const

function getEntryDate(entry: ChartEntry) {
  return new Date(entry.occurred_at || entry.created_at || 0)
}

function setFill(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}

function setStroke(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function setText(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
}

export function buildReportMetrics(entries: ChartEntry[]) {
  const sorted = [...entries].sort((left, right) => getEntryDate(left).getTime() - getEntryDate(right).getTime())
  const severities = entries.map((entry) => entry.severity ?? 0)
  const averageSeverity = severities.reduce((sum, value) => sum + value, 0) / Math.max(severities.length, 1)
  const peakSeverity = Math.max(...severities, 0)

  const byCondition = new Map<string, number>()
  const severitySumByCondition = new Map<string, number>()
  const bySource = new Map<string, number>()
  const severityBands = { mild: 0, moderate: 0, severe: 0 }
  const byMonth = new Map<string, number>()
  const flareDays = new Set<string>()
  const impactCounts = new Map<string, number>()

  entries.forEach((entry) => {
    const conditionLabel = normalizeConditionLabel(entry.condition_label)
    byCondition.set(conditionLabel, (byCondition.get(conditionLabel) || 0) + 1)
    severitySumByCondition.set(
      conditionLabel,
      (severitySumByCondition.get(conditionLabel) || 0) + (entry.severity ?? 0)
    )

    const sourceLabel = entry.source === 'family' ? 'Family/friends/other' : 'Veteran'
    bySource.set(sourceLabel, (bySource.get(sourceLabel) || 0) + 1)

    const severity = entry.severity ?? 0
    if (severity >= 7) {
      severityBands.severe += 1
      flareDays.add(getEntryDate(entry).toDateString())
    } else if (severity >= 4) {
      severityBands.moderate += 1
    } else {
      severityBands.mild += 1
    }

    const monthKey = getEntryDate(entry).toLocaleString('en-US', { month: 'short', year: '2-digit' })
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1)

    String(entry.impact || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const label = item.charAt(0).toUpperCase() + item.slice(1)
        impactCounts.set(label, (impactCounts.get(label) || 0) + 1)
      })
  })

  const impactBreakdown = [...impactCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }))

  const avgSeverityByCondition = [...severitySumByCondition.entries()]
    .map(([label, sum]) => ({
      label,
      value: Math.round((sum / Math.max(byCondition.get(label) || 1, 1)) * 10) / 10
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8)

  const firstEntry = sorted[0]
  const lastEntry = sorted[sorted.length - 1]
  let trackingSpanLabel = 'N/A'
  let trackingDays = 0

  if (firstEntry && lastEntry) {
    const firstDate = getEntryDate(firstEntry)
    const lastDate = getEntryDate(lastEntry)
    trackingDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / 86_400_000) + 1)
    const sameYear = firstDate.getFullYear() === lastDate.getFullYear()
    const firstLabel = firstDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(sameYear ? {} : { year: 'numeric' })
    })
    const lastLabel = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    trackingSpanLabel = `${firstLabel} – ${lastLabel}`
  }

  const trend = sorted.slice(-14).map((entry) => ({
    label: getEntryDate(entry).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
    value: entry.severity ?? 0
  }))

  const monthActivity = [...byMonth.entries()]
    .slice(-6)
    .map(([label, value]) => ({ label, value }))

  const conditionBreakdown = [...byCondition.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }))

  const extendedConditionBreakdown = [...byCondition.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(6)
    .map(([label, value]) => ({ label, value }))

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const dailyCounts = Array.from({ length: monthDays }, (_, index) => {
    const day = index + 1
    return entries.filter((entry) => {
      const entryDate = getEntryDate(entry)
      return entryDate.getFullYear() === today.getFullYear()
        && entryDate.getMonth() === today.getMonth()
        && entryDate.getDate() === day
    }).length
  })

  return {
    totalEntries: entries.length,
    averageSeverity,
    peakSeverity,
    conditionCount: byCondition.size,
    flareDayCount: flareDays.size,
    trackingSpanLabel,
    trackingDays,
    impactBreakdown,
    avgSeverityByCondition,
    trend,
    monthActivity,
    conditionBreakdown,
    extendedConditionBreakdown,
    severityBands,
    sourceBreakdown: [...bySource.entries()].map(([label, value]) => ({ label, value })),
    dailyCounts,
    monthLabel: today.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  }
}

export function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, slate900)
  doc.text(title, x, y)
}

export function drawStatCards(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  stats: Array<{ label: string, value: string, accent?: readonly [number, number, number] }>,
  perRow = 4
) {
  const gap = 10
  const cardHeight = 58
  const rows: Array<typeof stats> = []

  for (let index = 0; index < stats.length; index += perRow) {
    rows.push(stats.slice(index, index + perRow))
  }

  let rowY = y

  rows.forEach((row) => {
    const cardWidth = (width - gap * (row.length - 1)) / row.length

    row.forEach((stat, index) => {
      const cardX = x + index * (cardWidth + gap)
      setStroke(doc, slate200)
      setFill(doc, [255, 255, 255])
      doc.roundedRect(cardX, rowY, cardWidth, cardHeight, 10, 10, 'FD')

      setFill(doc, stat.accent || sky500)
      doc.roundedRect(cardX + 12, rowY + 11, 18, 3, 1.5, 1.5, 'F')

      doc.setFont('helvetica', 'bold')
      let valueFontSize = 16
      doc.setFontSize(valueFontSize)
      const maxValueWidth = cardWidth - 24
      while (valueFontSize > 9 && doc.getTextWidth(stat.value) > maxValueWidth) {
        valueFontSize -= 1
        doc.setFontSize(valueFontSize)
      }
      setText(doc, slate900)
      doc.text(stat.value, cardX + 12, rowY + 34)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      setText(doc, slate500)
      doc.text(stat.label.toUpperCase(), cardX + 12, rowY + 47)
    })

    rowY += cardHeight + gap
  })

  return rowY - gap
}

export function drawLineChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  points: Array<{ label: string, value: number }>
) {
  setStroke(doc, slate200)
  setFill(doc, [255, 255, 255])
  doc.roundedRect(x, y, width, height, 10, 10, 'FD')

  const chartX = x + 36
  const chartY = y + 18
  const chartWidth = width - 52
  const chartHeight = height - 36

  for (let tick = 0; tick <= 10; tick += 2) {
    const lineY = chartY + chartHeight - (tick / 10) * chartHeight
    setStroke(doc, slate200)
    doc.line(chartX, lineY, chartX + chartWidth, lineY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setText(doc, slate500)
    doc.text(String(tick), x + 10, lineY + 2)
  }

  if (!points.length) {
    return y + height
  }

  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0
  const coords = points.map((point, index) => ({
    x: chartX + stepX * index,
    y: chartY + chartHeight - (Math.max(0, Math.min(10, point.value)) / 10) * chartHeight
  }))

  setStroke(doc, sky500)
  doc.setLineWidth(1.5)
  coords.forEach((point, index) => {
    if (index === 0) {
      return
    }

    doc.line(coords[index - 1].x, coords[index - 1].y, point.x, point.y)
  })

  coords.forEach((point) => {
    setFill(doc, sky500)
    doc.circle(point.x, point.y, 2.5, 'F')
  })

  doc.setFontSize(7)
  setText(doc, slate500)
  points.forEach((point, index) => {
    if (index % 2 !== 0 && points.length > 8) {
      return
    }

    doc.text(point.label, chartX + stepX * index - 6, y + height - 6)
  })

  doc.setLineWidth(0.5)
  return y + height
}

type HorizontalBarChartLayout = {
  labelWidth?: number
  valueWidth?: number
  maxValue?: number
  valueDenominator?: number
}

export function drawHorizontalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  items: Array<{ label: string, value: number }>,
  colors: readonly (readonly [number, number, number])[],
  layout: HorizontalBarChartLayout = {}
) {
  setStroke(doc, slate200)
  setFill(doc, [255, 255, 255])
  doc.roundedRect(x, y, width, height, 10, 10, 'FD')

  const leftPad = 12
  const rightPad = 12
  const barGap = 10
  const labelWidth = layout.labelWidth ?? 96
  const valueWidth = layout.valueWidth ?? 34
  const barStart = x + leftPad + labelWidth
  const barMaxWidth = Math.max(
    24,
    width - leftPad - labelWidth - barGap - valueWidth - rightPad
  )
  const valueX = x + width - rightPad
  const maxValue = layout.maxValue ?? Math.max(...items.map((item) => item.value), 1)
  const rowHeight = Math.min(24, (height - 28) / Math.max(items.length, 1))
  let rowY = y + 18

  items.forEach((item, index) => {
    const barWidth = Math.min((item.value / maxValue) * barMaxWidth, barMaxWidth)
    const color = colors[index % colors.length]

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    const maxLabelPx = labelWidth - 8
    let label = item.label
    if (doc.getTextWidth(label) > maxLabelPx) {
      while (label.length > 1 && doc.getTextWidth(`${label}…`) > maxLabelPx) {
        label = label.slice(0, -1)
      }
      label = `${label.trimEnd()}…`
    }

    setText(doc, slate900)
    doc.text(label, x + leftPad, rowY + 8)

    setFill(doc, [241, 245, 249])
    doc.roundedRect(barStart, rowY, barMaxWidth, 12, 4, 4, 'F')

    if (item.value > 0) {
      setFill(doc, color)
      doc.roundedRect(barStart, rowY, Math.max(barWidth, 6), 12, 4, 4, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)

    const denominator = layout.valueDenominator
    const valueLabel = String(item.value)

    if (denominator) {
      const suffix = `/${denominator}`
      const suffixWidth = doc.getTextWidth(suffix)
      setText(doc, slate900)
      doc.text(valueLabel, valueX - suffixWidth, rowY + 8, { align: 'right' })
      setText(doc, slate500)
      doc.text(suffix, valueX, rowY + 8, { align: 'right' })
    } else {
      setText(doc, slate900)
      doc.text(valueLabel, valueX, rowY + 8, { align: 'right' })
    }

    rowY += rowHeight
  })

  return y + height
}

export function drawVerticalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  items: Array<{ label: string, value: number }>,
  colors: readonly (readonly [number, number, number])[]
) {
  setStroke(doc, slate200)
  setFill(doc, [255, 255, 255])
  doc.roundedRect(x, y, width, height, 10, 10, 'FD')

  const chartX = x + 24
  const chartY = y + 16
  const chartWidth = width - 36
  const chartHeight = height - 34
  const maxValue = Math.max(...items.map((item) => item.value), 1)
  const barWidth = chartWidth / Math.max(items.length, 1) - 8

  items.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight
    const barX = chartX + index * (barWidth + 8)
    const barY = chartY + chartHeight - barHeight
    const color = colors[index % colors.length]

    setFill(doc, color)
    doc.roundedRect(barX, barY, barWidth, Math.max(barHeight, 4), 4, 4, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    setText(doc, slate900)
    doc.text(String(item.value), barX + barWidth / 2, barY - 4, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setText(doc, slate500)
    doc.text(item.label, barX + barWidth / 2, y + height - 8, { align: 'center' })
  })

  return y + height
}

export function computeHeatmapChartHeight(dailyCounts: number[], mondayOffset: number) {
  const rows = Math.ceil((mondayOffset + dailyCounts.length) / 7)
  return 38 + rows * 22 + 28
}

function ensureChartPageSpace(
  doc: jsPDF,
  y: number,
  neededHeight: number,
  pageHeight: number,
  margin: number
) {
  if (y + neededHeight > pageHeight - margin - 36) {
    doc.addPage()
    return margin
  }

  return y
}

export function drawHeatmapCalendar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  monthLabel: string,
  dailyCounts: number[],
  mondayOffset = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() === 0
    ? 6
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() - 1
) {
  const resolvedMondayOffset = mondayOffset
  const resolvedHeight = Math.max(height, computeHeatmapChartHeight(dailyCounts, resolvedMondayOffset))

  setStroke(doc, slate200)
  setFill(doc, [255, 255, 255])
  doc.roundedRect(x, y, width, resolvedHeight, 10, 10, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, slate500)
  ;['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((label, index) => {
    doc.text(label, x + 18 + index * 24, y + 18, { align: 'center' })
  })

  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const heatmapMondayOffset = mondayOffset ?? (firstDay === 0 ? 6 : firstDay - 1)
  const maxCount = Math.max(...dailyCounts, 1)
  const cellSize = 18
  const gridX = x + 12
  const gridY = y + 26

  dailyCounts.forEach((count, index) => {
    const cellIndex = heatmapMondayOffset + index
    const row = Math.floor(cellIndex / 7)
    const col = cellIndex % 7
    const cellX = gridX + col * 24
    const cellY = gridY + row * 22
    const intensity = count / maxCount

    if (count === 0) {
      setFill(doc, [241, 245, 249])
    } else if (intensity >= 0.66) {
      setFill(doc, orange500)
    } else if (intensity >= 0.33) {
      setFill(doc, amber500)
    } else {
      setFill(doc, emerald500)
    }

    doc.roundedRect(cellX, cellY, cellSize, cellSize, 4, 4, 'F')

    doc.setFont('helvetica', count > 1 ? 'bold' : 'normal')
    doc.setFontSize(count > 1 ? 7 : 6)
    setText(doc, count > 0 ? slate900 : slate500)
    doc.text(count > 1 ? String(count) : String(index + 1), cellX + cellSize / 2, cellY + 11, { align: 'center' })
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, slate500)
  doc.text(monthLabel, x + width - 12, y + 14, { align: 'right' })

  return y + resolvedHeight
}

type LoggingChartSections = {
  week?: boolean
  condition?: boolean
  heatmap?: boolean
  skipHeader?: boolean
  consistencyRangeLabel?: string
}

type AggregateLoggingMetrics = {
  rangeLabel: string
  totalLogs: number
  conditionCount: number
  conditionBreakdown: Array<{ label: string, count: number }>
  monthCount: number
}

const CHART_SECTION_GAP = 28

export function drawAggregateLoggingSection(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  pageHeight: number,
  margin: number,
  metrics: AggregateLoggingMetrics,
  summaryText: string,
  options: { showConditionChart?: boolean } = {}
) {
  const showCondition = options.showConditionChart === true

  drawSectionTitle(doc, `Logging activity: ${metrics.rangeLabel}`, x, y)
  y += 14

  if (summaryText) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setText(doc, slate500)
    doc.text(summaryText, x, y)
    y += 22
  } else {
    y += 8
  }

  if (showCondition && metrics.conditionBreakdown.length) {
    const conditionItems = metrics.conditionBreakdown.map((c) => ({
      label: c.label,
      value: c.count
    }))
    const conditionChartHeight = Math.max(96, conditionItems.length * 28 + 28)
    y = ensureChartPageSpace(doc, y, conditionChartHeight + 64, pageHeight, margin)
    drawSectionTitle(doc, `Total logs per condition: ${metrics.rangeLabel}`, x, y)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, slate500)
    doc.text('Saved entries in this date range only · each save counts', x, y)
    y += 14
    y = drawHorizontalBarChart(
      doc,
      x,
      y,
      width,
      conditionChartHeight,
      conditionItems,
      [[16, 185, 129]],
      { labelWidth: 128 }
    ) + CHART_SECTION_GAP
  }

  return y
}

function truncateLabelToWidth(doc: jsPDF, label: string, maxWidth: number) {
  let truncated = label
  if (doc.getTextWidth(truncated) <= maxWidth) {
    return truncated
  }

  while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }

  return `${truncated.trimEnd()}…`
}

export function drawConditionWeeklyFrequencyGrid(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  groups: ConditionWeeklyFrequencyGroup[],
  pageHeight: number,
  margin: number
): number {
  if (!groups.length) {
    return y
  }

  const maxWeeks = 5
  const padX = 14
  const padBottom = 10
  const groupGap = 14
  const conditionHeaderHeight = 28
  const tableHeaderHeight = 18
  const dividerGap = 4
  const rowHeight = 24
  const monthColWidth = 68
  const totalColWidth = 40
  const avgColWidth = 44
  const weekAreaWidth = width - padX * 2 - monthColWidth - totalColWidth - avgColWidth
  const weekColWidth = weekAreaWidth / maxWeeks

  const globalMax = Math.max(
    ...groups.flatMap((group) => group.rows.flatMap((row) => row.weeklyBreakdown.map((week) => week.count))),
    1
  )

  for (const group of groups) {
    const groupHeight = conditionHeaderHeight
      + tableHeaderHeight
      + dividerGap
      + group.rows.length * rowHeight
      + padBottom

    y = ensureChartPageSpace(doc, y, groupHeight + 24, pageHeight, margin)

    setStroke(doc, slate200)
    setFill(doc, [255, 255, 255])
    doc.roundedRect(x, y, width, groupHeight, 10, 10, 'FD')

    setFill(doc, [241, 245, 249])
    doc.roundedRect(x + 1, y + 1, width - 2, conditionHeaderHeight - 1, 9, 9, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setText(doc, slate900)
    doc.text(
      truncateLabelToWidth(doc, group.conditionLabel, width - padX * 2),
      x + padX,
      y + 18
    )

    let dy = y + conditionHeaderHeight
    const lx = x + padX

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setText(doc, slate500)
    doc.text('MONTH', lx, dy + 11)

    for (let weekIndex = 0; weekIndex < maxWeeks; weekIndex += 1) {
      const cx = lx + monthColWidth + weekIndex * weekColWidth + weekColWidth / 2
      doc.text(`WK ${weekIndex + 1}`, cx, dy + 11, { align: 'center' })
    }

    const totalCx = lx + monthColWidth + maxWeeks * weekColWidth + totalColWidth / 2
    doc.text('TOTAL', totalCx, dy + 11, { align: 'center' })

    const avgCx = lx + monthColWidth + maxWeeks * weekColWidth + totalColWidth + avgColWidth / 2
    doc.text('AVG/WK', avgCx, dy + 11, { align: 'center' })

    dy += tableHeaderHeight

    setStroke(doc, slate200)
    doc.line(lx, dy, lx + width - padX * 2, dy)
    dy += dividerGap

    group.rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        setFill(doc, [248, 250, 252])
        doc.roundedRect(x + 3, dy, width - 6, rowHeight, 4, 4, 'F')
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setText(doc, slate900)
      const shortMonth = new Date(row.year, row.month, 1).toLocaleString('en-US', {
        month: 'short',
        year: 'numeric'
      })
      doc.text(shortMonth, lx + 2, dy + 15)

      const weeklyAvg = row.totalLogs / Math.max(row.weeklyBreakdown.length, 1)

      for (let weekIndex = 0; weekIndex < maxWeeks; weekIndex += 1) {
        const cx = lx + monthColWidth + weekIndex * weekColWidth + weekColWidth / 2
        const count = row.weeklyBreakdown[weekIndex]?.count

        if (count === undefined) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
          setText(doc, [203, 213, 225])
          doc.text('N/A', cx, dy + 15, { align: 'center' })
          continue
        }

        if (count > 0) {
          const intensity = count / globalMax
          let pillColor: readonly [number, number, number]
          if (intensity >= 0.6) {
            pillColor = emerald500
          } else if (intensity >= 0.3) {
            pillColor = sky500
          } else {
            pillColor = [148, 163, 184] as const
          }

          const pillW = weekColWidth - 10
          setFill(doc, pillColor)
          doc.roundedRect(cx - pillW / 2, dy + 4, pillW, 16, 4, 4, 'F')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          setText(doc, [255, 255, 255])
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          setText(doc, slate500)
        }

        doc.text(String(count), cx, dy + 15, { align: 'center' })
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      setText(doc, slate900)
      doc.text(String(row.totalLogs), totalCx, dy + 15, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      setText(doc, sky500)
      doc.text(weeklyAvg.toFixed(1), avgCx, dy + 15, { align: 'center' })

      dy += rowHeight
    })

    y += groupHeight + groupGap
  }

  return y - groupGap
}

export function drawCompactHeatmapGrid(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  allMonthMetrics: LoggingActivityMetrics[],
  pageHeight: number,
  margin: number,
  perRow = 3
): number {
  if (!allMonthMetrics.length) {
    return y
  }

  const hGap = 12
  const heatmapWidth = (width - hGap * (perRow - 1)) / perRow
  const colSpacing = Math.floor((heatmapWidth - 16) / 7)
  const cellSize = colSpacing - 4
  const rowSpacing = cellSize + 4

  for (let startIdx = 0; startIdx < allMonthMetrics.length; startIdx += perRow) {
    const rowMetrics = allMonthMetrics.slice(startIdx, startIdx + perRow)

    let maxCalendarRows = 0
    for (const m of rowMetrics) {
      const rows = Math.ceil((m.mondayOffset + m.dailyCounts.length) / 7)
      if (rows > maxCalendarRows) {
        maxCalendarRows = rows
      }
    }

    const cardHeight = 18 + 14 + maxCalendarRows * rowSpacing + 10

    y = ensureChartPageSpace(doc, y, cardHeight + 20, pageHeight, margin)

    rowMetrics.forEach((month, idx) => {
      const mx = x + idx * (heatmapWidth + hGap)

      setStroke(doc, slate200)
      setFill(doc, [255, 255, 255])
      doc.roundedRect(mx, y, heatmapWidth, cardHeight, 8, 8, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      setText(doc, slate500)
      const shortLabel = new Date(month.year, month.month, 1).toLocaleString('en-US', {
        month: 'short',
        year: 'numeric'
      })
      doc.text(shortLabel.toUpperCase(), mx + 8, y + 12)

      const gridX = mx + 8
      const headerY = y + 24
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      setText(doc, slate500)
      const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      dayLabels.forEach((label, i) => {
        doc.text(label, gridX + i * colSpacing + cellSize / 2, headerY, { align: 'center' })
      })

      const cellsY = headerY + 8
      const maxCount = Math.max(...month.dailyCounts, 1)

      month.dailyCounts.forEach((count, dayIdx) => {
        const cellIndex = month.mondayOffset + dayIdx
        const row = Math.floor(cellIndex / 7)
        const col = cellIndex % 7
        const cx = gridX + col * colSpacing
        const cy = cellsY + row * rowSpacing
        const intensity = count / maxCount

        if (count === 0) {
          setFill(doc, [241, 245, 249])
        } else if (intensity >= 0.66) {
          setFill(doc, orange500)
        } else if (intensity >= 0.33) {
          setFill(doc, amber500)
        } else {
          setFill(doc, emerald500)
        }

        doc.roundedRect(cx, cy, cellSize, cellSize, 3, 3, 'F')

        if (cellSize >= 12) {
          doc.setFont('helvetica', count > 1 ? 'bold' : 'normal')
          doc.setFontSize(count > 1 ? 6 : 5)
          setText(doc, count > 0 ? slate900 : slate500)
          doc.text(
            count > 1 ? String(count) : String(dayIdx + 1),
            cx + cellSize / 2,
            cy + cellSize / 2 + 2,
            { align: 'center' }
          )
        }
      })
    })

    y += cardHeight + 12
  }

  return y
}

export function drawLoggingActivitySection(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  pageHeight: number,
  margin: number,
  metrics: LoggingActivityMetrics,
  summaryText: string,
  sections: LoggingChartSections = { week: true, condition: true, heatmap: true }
) {
  const showWeek = sections.week !== false
  const showCondition = sections.condition === true
  const showHeatmap = sections.heatmap === true
  const skipHeader = sections.skipHeader === true
  const heatmapOnly = showHeatmap && !showWeek && !showCondition

  if (!heatmapOnly && !skipHeader) {
    drawSectionTitle(doc, `Logging activity: ${metrics.monthLabel}`, x, y)
    y += 14

    if (summaryText) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setText(doc, slate500)
      doc.text(summaryText, x, y)
      y += 22
    } else {
      y += 8
    }
  }

  const weeklyItems = metrics.weeklyBreakdown.map((week, index) => ({
    label: week.label || `Week ${index + 1}`,
    value: week.count
  }))
  const conditionItems = metrics.conditionBreakdown.map((condition) => ({
    label: condition.label,
    value: condition.count
  }))
  const weeklyChartHeight = Math.max(96, weeklyItems.length * 28 + 28)

  if (showWeek) {
    y = ensureChartPageSpace(doc, y, weeklyChartHeight + 52, pageHeight, margin)
    drawSectionTitle(doc, 'Symptoms logged by week', x, y)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, slate500)
    doc.text(`${metrics.monthLabel} only`, x, y)
    y += 14
    y = drawHorizontalBarChart(
      doc,
      x,
      y,
      width,
      weeklyChartHeight,
      weeklyItems.length ? weeklyItems : [{ label: 'No logs', value: 0 }],
      [[14, 165, 233]],
      { labelWidth: 108 }
    ) + CHART_SECTION_GAP
  }

  if (showCondition) {
    const conditionChartHeight = Math.max(96, conditionItems.length * 28 + 28)
    y = ensureChartPageSpace(doc, y, conditionChartHeight + 52, pageHeight, margin)
    drawSectionTitle(doc, `Logs per condition: ${metrics.monthLabel}`, x, y)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, slate500)
    doc.text('Saved entries this month only (same-day logs each count)', x, y)
    y += 14
    y = drawHorizontalBarChart(
      doc,
      x,
      y,
      width,
      conditionChartHeight,
      conditionItems.length ? conditionItems : [{ label: 'No logs', value: 0 }],
      [[16, 185, 129]],
      { labelWidth: 128 }
    ) + CHART_SECTION_GAP
  }

  if (showHeatmap) {
    const heatmapHeight = computeHeatmapChartHeight(metrics.dailyCounts, metrics.mondayOffset)
    y = ensureChartPageSpace(doc, y, heatmapHeight + 52, pageHeight, margin)
    const heatmapTitle = heatmapOnly
      ? `Daily logging consistency: ${metrics.monthLabel}`
      : (sections.consistencyRangeLabel
        ? `Daily logging consistency: ${sections.consistencyRangeLabel}`
        : `Daily logging consistency: ${metrics.monthLabel}`)
    drawSectionTitle(doc, heatmapTitle, x, y)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, slate500)
    doc.text('Days with at least one saved log: consistency over time', x, y)
    y += 14
    y = drawHeatmapCalendar(
      doc,
      x,
      y,
      width,
      heatmapHeight,
      metrics.monthLabel,
      metrics.dailyCounts,
      metrics.mondayOffset
    ) + CHART_SECTION_GAP
  }

  return y
}
