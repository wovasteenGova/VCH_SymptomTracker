import type { jsPDF } from 'jspdf'
import {
  buildFieldEditHistory,
  buildSymptomEntrySavePayloadFromReportEntry,
  type EntryFieldRef,
  type EntryRevisionRecord
} from './entryEditHistory'
import {
  formatReportEntryTimestamp,
  getEntryBackdateNote,
  type BackdateReportContext,
  type EntryBackdateNote
} from './reportBackfillNote'

export type ReportEntryRecord = {
  id?: string
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

const slate900 = [15, 23, 42] as const
const slate800 = [30, 41, 59] as const
const slate700 = [51, 65, 85] as const
const slate500 = [100, 116, 139] as const
const slate200 = [226, 232, 240] as const
const slate100 = [241, 245, 249] as const
const slate50 = [248, 250, 252] as const
const sky600 = [2, 132, 199] as const
const amber200 = [251, 191, 36] as const
const amber50 = [255, 251, 235] as const
const amber900 = [120, 53, 15] as const

const ENTRY_TYPE_BADGE_HEIGHT = 22

const familyBadgeFill = [219, 234, 254] as const
const familyBadgeStroke = [147, 197, 253] as const
const familyBadgeText = [30, 64, 175] as const

export type EntryLogSectionOptions = BackdateReportContext & {
  reportMode?: 'full' | 'entries-only'
  reportVariant?: 'veteran' | 'family'
  includeAdvancedCharts?: boolean
  entryRevisionsByEntryId?: Record<string, EntryRevisionRecord[]>
}

const skippedDetailKeys = new Set([
  'date_and_time',
  'how_bad_was_it',
  'what_happened',
  'daily_impact',
  'pdf_condition_statement',
  'condition_name',
  'medications_for_this_entry',
  'symptoms_managed_by_medication'
])

const detailLabelMap: Record<string, string> = {
  duration: 'Duration',
  episode_duration: 'Episode duration',
  functional_impact: 'Functional impact',
  had_to_stop_activity: 'Functional impact',
  kept_you_from_sleeping: 'Functional impact',
  episode_type: 'Episode type',
  safety_note: 'Safety note',
  movement_limit: 'Movement limit',
  flare_up_trigger: 'Flare-up trigger',
  side_affected: 'Side affected',
  nerve_symptoms: 'Nerve symptoms',
  digestive_symptom: 'Digestive symptom',
  digestive_symptoms: 'Digestive symptoms',
  medication_or_food_trigger: 'Possible Factors (optional)',
  medications_for_this_entry: 'Medications for this entry',
  symptoms_managed_by_medication: 'Symptoms managed by medication',
  night_symptoms: 'Night symptoms',
  hours_slept: 'Hours slept',
  sleep_interruption: 'Sleep interruption'
}

type EntryBlock = {
  label: string
  value: string
  lines: string[]
  priorLines: string[][]
  kind: 'primary' | 'detail'
}

type EntryCardRevisionContext = {
  revisions: EntryRevisionRecord[]
  currentSnapshot: ReturnType<typeof buildSymptomEntrySavePayloadFromReportEntry>
}

type LayoutContext = {
  doc: jsPDF
  x: number
  y: number
  width: number
  margin: number
  pageHeight: number
  bottomLimit: number
  reportVariant?: 'veteran' | 'family'
}

function setText(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
}

function setFill(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}

function setStroke(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function getEntryDate(entry: ReportEntryRecord) {
  return new Date(entry.occurred_at || entry.created_at || 0)
}

function formatReportEntryDate(value: string | null | undefined) {
  return formatReportEntryTimestamp(value)
}

function wasEntryEdited(entry: ReportEntryRecord) {
  if (!entry.updated_at || !entry.created_at) {
    return false
  }

  return new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime() > 60_000
}

function humanizeDetailKey(key: string) {
  if (detailLabelMap[key]) {
    return detailLabelMap[key]
  }

  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeDetailValue(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return String(value)
}

function wrapLines(doc: jsPDF, text: string, maxWidth: number, fontSize: number) {
  doc.setFontSize(fontSize)
  return doc.splitTextToSize(text, maxWidth) as string[]
}

function truncateText(doc: jsPDF, text: string, maxWidth: number) {
  if (doc.getTextWidth(text) <= maxWidth) {
    return text
  }

  let truncated = text

  while (truncated.length > 1 && doc.getTextWidth(`${truncated}…`) > maxWidth) {
    truncated = truncated.slice(0, -1)
  }

  return `${truncated.trimEnd()}…`
}

function buildConditionSourceSummary(entries: ReportEntryRecord[]) {
  let veteranCount = 0
  let familyCount = 0

  for (const entry of entries) {
    if (entry.source === 'family') {
      familyCount += 1
    } else {
      veteranCount += 1
    }
  }

  return { veteranCount, familyCount }
}

function formatConditionSourceSummary(veteranCount: number, familyCount: number) {
  const parts: string[] = []

  if (veteranCount) {
    parts.push(`${veteranCount} veteran ${veteranCount === 1 ? 'log' : 'logs'}`)
  }

  if (familyCount) {
    parts.push(`${familyCount} family ${familyCount === 1 ? 'observation' : 'observations'}`)
  }

  return parts.join(' · ')
}

function measureConditionIntroHeight(
  doc: jsPDF,
  width: number,
  label: string,
  statement: string,
  sourceSummary: string
) {
  const padding = 16
  const accentGap = 10
  const contentWidth = width - padding * 2 - accentGap - 4
  const titleWidth = contentWidth - 72

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  const titleLines = wrapLines(doc, label, titleWidth, 13).length

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const statementLines = statement
    ? wrapLines(doc, statement, contentWidth - 20, 9.5).length
    : 0

  let height = padding + 10 + titleLines * 15 + 8

  if (sourceSummary) {
    height += 12
  }

  height += padding

  if (statementLines) {
    height += 10 + 10 + statementLines * 12 + 12
  }

  return height
}

function buildEntryRevisionContext(
  entry: ReportEntryRecord,
  entryRevisionsByEntryId?: Record<string, EntryRevisionRecord[]>
): EntryCardRevisionContext | null {
  if (!entry.id || !entryRevisionsByEntryId?.[entry.id]?.length) {
    return null
  }

  return {
    revisions: entryRevisionsByEntryId[entry.id],
    currentSnapshot: buildSymptomEntrySavePayloadFromReportEntry(entry)
  }
}

function buildEntryBlocks(
  doc: jsPDF,
  entry: ReportEntryRecord,
  innerWidth: number,
  revisionContext: EntryCardRevisionContext | null = null
) {
  const blocks: EntryBlock[] = []

  const addBlock = (
    label: string,
    field: EntryFieldRef,
    kind: 'primary' | 'detail',
    fallbackValue = ''
  ) => {
    const maxWidth = kind === 'detail' ? (innerWidth - 16) / 2 : innerWidth
    const fontSize = kind === 'primary' ? 11 : 10
    const history = revisionContext
      ? buildFieldEditHistory(revisionContext.revisions, revisionContext.currentSnapshot, field)
      : { priorValues: [], currentValue: fallbackValue }
    const value = history.currentValue || fallbackValue

    if (!value && !history.priorValues.length) {
      return
    }

    blocks.push({
      label,
      value,
      kind,
      priorLines: history.priorValues.map((priorValue) => wrapLines(doc, priorValue, maxWidth, fontSize)),
      lines: value ? wrapLines(doc, value, maxWidth, fontSize) : []
    })
  }

  addBlock('What happened', { kind: 'summary' }, 'primary', entry.summary?.trim() || '')
  addBlock('Daily impact', { kind: 'impact' }, 'primary', entry.impact?.trim() || '')

  const detailKeys = new Set<string>()
  const details = entry.details || {}

  Object.keys(details).forEach((key) => {
    if (!skippedDetailKeys.has(key)) {
      detailKeys.add(key)
    }
  })

  if (revisionContext) {
    revisionContext.revisions.forEach((revision) => {
      Object.keys(revision.snapshot.details || {}).forEach((key) => {
        if (!skippedDetailKeys.has(key)) {
          detailKeys.add(key)
        }
      })
    })
  }

  [...detailKeys].sort().forEach((key) => {
    addBlock(
      humanizeDetailKey(key),
      { kind: 'detail', key },
      'detail',
      normalizeDetailValue(details[key])
    )
  })

  return blocks
}

function measureBlockHeight(block: EntryBlock, lineHeight: number, labelHeight: number, gapAfter: number) {
  let height = labelHeight

  block.priorLines.forEach((priorLines) => {
    height += priorLines.length * lineHeight
  })

  height += block.lines.length * lineHeight + gapAfter

  return height
}

function measureHeaderRevisionHeight(priorValueCount: number) {
  return priorValueCount * 13
}

const backdateNoteHeight = 34

function drawBackdateNote(
  ctx: LayoutContext,
  note: EntryBackdateNote,
  innerX: number,
  innerWidth: number
) {
  const boxTop = ctx.y

  setStroke(ctx.doc, amber200)
  setFill(ctx.doc, amber50)
  ctx.doc.roundedRect(innerX, boxTop, innerWidth, backdateNoteHeight, 8, 8, 'FD')

  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(8.5)
  setText(ctx.doc, amber900)
  ctx.doc.text(note.title, innerX + innerWidth / 2, boxTop + 12, {
    align: 'center'
  })

  ctx.doc.setFont('helvetica', 'normal')
  ctx.doc.setFontSize(8)
  ctx.doc.text(note.enteredAtLabel, innerX + innerWidth / 2, boxTop + 24, {
    align: 'center'
  })

  ctx.y = boxTop + backdateNoteHeight + 8
}

function drawReportTypeHeader(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setText(doc, slate900)
  doc.text(title, x, y)
}

function getReportModeTitle(reportMode: 'full' | 'entries-only') {
  return reportMode === 'full' ? 'Full Report' : 'Entries Only Report'
}

function isFamilyEntry(entry: ReportEntryRecord) {
  return entry.source === 'family'
}

function shouldShowFamilyEntryBadge(ctx: LayoutContext, entry: ReportEntryRecord) {
  return isFamilyEntry(entry) && !ctx.reportVariant
}

function drawFamilyObservationsBanner(ctx: LayoutContext) {
  const bannerHeight = ENTRY_TYPE_BADGE_HEIGHT + 4

  setFill(ctx.doc, familyBadgeFill)
  setStroke(ctx.doc, familyBadgeStroke)
  ctx.doc.setLineWidth(0.75)
  ctx.doc.roundedRect(ctx.x, ctx.y, ctx.width, bannerHeight, 6, 6, 'FD')

  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(10)
  setText(ctx.doc, familyBadgeText)
  ctx.doc.text('Family & friend observations', ctx.x + 10, ctx.y + 15)

  ctx.y += bannerHeight + 16
}

function drawFamilyEntryBadge(
  ctx: LayoutContext,
  innerX: number,
  innerWidth: number
) {
  const badgeY = ctx.y

  setFill(ctx.doc, familyBadgeFill)
  setStroke(ctx.doc, familyBadgeStroke)
  ctx.doc.setLineWidth(0.75)
  ctx.doc.roundedRect(innerX, badgeY, innerWidth, ENTRY_TYPE_BADGE_HEIGHT, 6, 6, 'FD')

  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(9)
  setText(ctx.doc, familyBadgeText)
  ctx.doc.text('Family & friend observation', innerX + 10, badgeY + 14)

  ctx.y = badgeY + ENTRY_TYPE_BADGE_HEIGHT + 10
}

function measureEntryHeight(
  blocks: EntryBlock[],
  options: {
    backdateNote?: EntryBackdateNote | null
    edited?: boolean
    includeFamilyBadge?: boolean
    hideConditionTitle?: boolean
    datePriorCount?: number
    severityPriorCount?: number
  } = {}
) {
  const padding = 18
  const primaryBlocks = blocks.filter((block) => block.kind === 'primary')
  const detailBlocks = blocks.filter((block) => block.kind === 'detail')
  const badgeHeight = options.includeFamilyBadge ? ENTRY_TYPE_BADGE_HEIGHT + 10 : 0
  const headerHeight = options.hideConditionTitle ? 18 : 34
  let height = padding + headerHeight + badgeHeight + 12 + padding

  height += measureHeaderRevisionHeight(options.datePriorCount || 0)
  height += measureHeaderRevisionHeight(options.severityPriorCount || 0)

  if (options.edited) {
    height += 13
  }

  height += 14

  primaryBlocks.forEach((block, index) => {
    height += measureBlockHeight(block, 15, 12, index === primaryBlocks.length - 1 && !detailBlocks.length ? 0 : 10)
  })

  if (primaryBlocks.length && detailBlocks.length) {
    height += 8
  }

  if (detailBlocks.length) {
    height += 12
    for (let index = 0; index < detailBlocks.length; index += 2) {
      const left = detailBlocks[index]
      const right = detailBlocks[index + 1]
      const leftHeight = measureBlockHeight(left, 14, 11, 0)
      const rightHeight = right ? measureBlockHeight(right, 14, 11, 0) : 0
      height += Math.max(leftHeight, rightHeight) + 10
    }
  }

  if (options.backdateNote) {
    height += 10 + backdateNoteHeight
  }

  return Math.max(height, 96)
}

function ensureSpace(ctx: LayoutContext, height: number) {
  if (ctx.y + height <= ctx.bottomLimit) {
    return
  }

  ctx.doc.addPage()
  ctx.y = ctx.margin
}

function drawDivider(ctx: LayoutContext, x: number, width: number) {
  setStroke(ctx.doc, slate200)
  ctx.doc.setLineWidth(0.75)
  ctx.doc.line(x, ctx.y, x + width, ctx.y)
  ctx.doc.setLineWidth(0.5)
  ctx.y += 10
}

function getConditionStatement(entry: ReportEntryRecord) {
  const statement = entry.details?.pdf_condition_statement
  return typeof statement === 'string' ? statement.trim() : ''
}

function groupEntriesByCondition(entries: ReportEntryRecord[]) {
  const groups: Array<{
    label: string
    statement: string
    statementTime: number
    entries: ReportEntryRecord[]
  }> = []
  const groupByLabel = new Map<string, {
    label: string
    statement: string
    statementTime: number
    entries: ReportEntryRecord[]
  }>()

  entries.forEach((entry) => {
    const label = entry.condition_label || 'Condition'
    let group = groupByLabel.get(label)

    if (!group) {
      group = {
        label,
        statement: '',
        statementTime: 0,
        entries: []
      }
      groupByLabel.set(label, group)
      groups.push(group)
    }

    const statement = getConditionStatement(entry)
    const statementTime = new Date(entry.updated_at || entry.created_at || entry.occurred_at || 0).getTime()

    if (statement && statementTime >= group.statementTime) {
      group.statement = statement
      group.statementTime = statementTime
    }

    group.entries.push(entry)
  })

  return groups
}

function drawConditionIntro(
  ctx: LayoutContext,
  label: string,
  statement: string,
  entries: ReportEntryRecord[]
) {
  const padding = 16
  const accentWidth = 4
  const accentGap = 10
  const contentX = ctx.x + padding + accentWidth + accentGap
  const contentWidth = ctx.width - padding * 2 - accentWidth - accentGap
  const entryCount = entries.length
  const { veteranCount, familyCount } = buildConditionSourceSummary(entries)
  const sourceSummary = formatConditionSourceSummary(veteranCount, familyCount)
  const countLabel = `${entryCount} ${entryCount === 1 ? 'log' : 'logs'}`

  ctx.doc.setFont('helvetica', 'normal')
  ctx.doc.setFontSize(9.5)
  const statementLines = statement
    ? wrapLines(ctx.doc, statement, contentWidth - 20, 9.5)
    : []

  const boxHeight = measureConditionIntroHeight(ctx.doc, ctx.width, label, statement, sourceSummary)
  ensureSpace(ctx, boxHeight + 14)

  const boxY = ctx.y
  setStroke(ctx.doc, slate200)
  setFill(ctx.doc, [255, 255, 255])
  ctx.doc.roundedRect(ctx.x, boxY, ctx.width, boxHeight, 12, 12, 'FD')

  setFill(ctx.doc, sky600)
  ctx.doc.roundedRect(ctx.x + 1, boxY + 1, accentWidth, boxHeight - 2, 2, 2, 'F')

  ctx.y = boxY + padding

  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(7.5)
  setText(ctx.doc, slate500)
  ctx.doc.text('CONDITION LOG', contentX, ctx.y)

  const pillPaddingX = 10
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(8.5)
  const pillTextWidth = ctx.doc.getTextWidth(countLabel)
  const pillWidth = pillTextWidth + pillPaddingX * 2
  const pillHeight = 18
  const pillX = ctx.x + ctx.width - padding - pillWidth
  const pillY = ctx.y - 8

  setFill(ctx.doc, slate100)
  setStroke(ctx.doc, slate200)
  ctx.doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 9, 9, 'FD')
  setText(ctx.doc, slate800)
  ctx.doc.text(countLabel, pillX + pillWidth / 2, pillY + 12, { align: 'center' })

  ctx.y += 12
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(13)
  setText(ctx.doc, slate900)
  ctx.doc.text(truncateText(ctx.doc, label, contentWidth - pillWidth - 8), contentX, ctx.y)

  if (sourceSummary) {
    ctx.y += 14
    ctx.doc.setFont('helvetica', 'normal')
    ctx.doc.setFontSize(9)
    setText(ctx.doc, slate500)
    ctx.doc.text(sourceSummary, contentX, ctx.y)
  }

  if (statementLines.length) {
    ctx.y += 16
    const statementBoxX = contentX
    const statementBoxWidth = contentWidth
    const statementBoxHeight = 10 + statementLines.length * 12 + 12
    const statementBoxY = ctx.y

    setFill(ctx.doc, slate50)
    setStroke(ctx.doc, slate200)
    ctx.doc.roundedRect(statementBoxX, statementBoxY, statementBoxWidth, statementBoxHeight, 8, 8, 'FD')

    ctx.y = statementBoxY + 10
    drawBlockLabel(ctx, 'Veteran condition statement', statementBoxX + 12, 7.5)
    ctx.y += 11
    drawBlockLines(ctx, statementLines, statementBoxX + 12, 9.5, 12, slate700)
  }

  ctx.y = boxY + boxHeight + 14
}

function drawBlockLabel(ctx: LayoutContext, label: string, x: number, fontSize: number) {
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(fontSize)
  setText(ctx.doc, slate500)
  ctx.doc.text(label.toUpperCase(), x, ctx.y)
}

function drawBlockLines(
  ctx: LayoutContext,
  lines: string[],
  x: number,
  fontSize: number,
  lineHeight: number,
  color: readonly [number, number, number] = slate700
) {
  ctx.doc.setFont('helvetica', 'normal')
  ctx.doc.setFontSize(fontSize)
  setText(ctx.doc, color)
  lines.forEach((line) => {
    ctx.doc.text(line, x, ctx.y)
    ctx.y += lineHeight
  })
}

function drawStruckLines(
  ctx: LayoutContext,
  lines: string[],
  x: number,
  fontSize: number,
  lineHeight: number
) {
  const doc = ctx.doc

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(fontSize)
  setText(doc, slate500)

  lines.forEach((line) => {
    doc.text(line, x, ctx.y)

    const width = doc.getTextWidth(line)
    const midY = ctx.y - fontSize * 0.35
    setStroke(doc, slate500)
    doc.setLineWidth(0.6)
    doc.line(x, midY, x + width, midY)
    doc.setLineWidth(0.5)

    ctx.y += lineHeight
  })
}

function drawRevisionHeaderValues(
  ctx: LayoutContext,
  x: number,
  priorValues: string[],
  currentValue: string,
  fontSize: number,
  currentColor: readonly [number, number, number] = slate900,
  currentFont: 'normal' | 'bold' = 'bold'
) {
  priorValues.forEach((priorValue) => {
    drawStruckLines(ctx, [priorValue], x, fontSize, 13)
  })

  if (currentValue) {
    ctx.doc.setFont('helvetica', currentFont)
    ctx.doc.setFontSize(fontSize)
    setText(ctx.doc, currentColor)
    ctx.doc.text(currentValue, x, ctx.y)
    ctx.y += 16
  }
}

function drawBlockContent(
  ctx: LayoutContext,
  block: EntryBlock,
  x: number,
  fontSize: number,
  lineHeight: number
) {
  block.priorLines.forEach((priorLines) => {
    drawStruckLines(ctx, priorLines, x, fontSize, lineHeight)
  })

  if (block.lines.length) {
    drawBlockLines(ctx, block.lines, x, fontSize, lineHeight)
  }
}

function drawEntryCard(
  ctx: LayoutContext,
  entry: ReportEntryRecord,
  index: number,
  backdateContext: BackdateReportContext = {},
  options: {
    hideConditionTitle?: boolean
    entryRevisionsByEntryId?: Record<string, EntryRevisionRecord[]>
  } = {}
) {
  const padding = 18
  const innerX = ctx.x + padding
  const innerWidth = ctx.width - padding * 2
  const revisionContext = buildEntryRevisionContext(entry, options.entryRevisionsByEntryId)
  const blocks = buildEntryBlocks(ctx.doc, entry, innerWidth, revisionContext)
  const primaryBlocks = blocks.filter((block) => block.kind === 'primary')
  const detailBlocks = blocks.filter((block) => block.kind === 'detail')
  const backdateNote = getEntryBackdateNote(entry, backdateContext)
  const edited = wasEntryEdited(entry) || Boolean(revisionContext?.revisions.length)
  const includeFamilyBadge = shouldShowFamilyEntryBadge(ctx, entry)
  const dateHistory = revisionContext
    ? buildFieldEditHistory(revisionContext.revisions, revisionContext.currentSnapshot, { kind: 'occurred_at' })
    : { priorValues: [], currentValue: formatReportEntryDate(entry.occurred_at || entry.created_at) }
  const severityHistory = revisionContext
    ? buildFieldEditHistory(revisionContext.revisions, revisionContext.currentSnapshot, { kind: 'severity' })
    : {
        priorValues: [],
        currentValue: typeof entry.severity === 'number' ? `Severity ${entry.severity}/10` : 'Severity not recorded'
      }
  const cardHeight = measureEntryHeight(blocks, {
    backdateNote,
    edited,
    includeFamilyBadge,
    hideConditionTitle: options.hideConditionTitle,
    datePriorCount: dateHistory.priorValues.length,
    severityPriorCount: severityHistory.priorValues.length
  })

  ensureSpace(ctx, cardHeight + 14)

  const cardY = ctx.y
  setStroke(ctx.doc, slate200)
  setFill(ctx.doc, slate50)
  ctx.doc.roundedRect(ctx.x, cardY, ctx.width, cardHeight, 12, 12, 'FD')

  ctx.y = cardY + padding

  const dateLabel = dateHistory.currentValue || formatReportEntryDate(entry.occurred_at || entry.created_at)

  if (options.hideConditionTitle) {
    drawRevisionHeaderValues(ctx, innerX, dateHistory.priorValues, dateLabel, 11, slate900, 'bold')

    ctx.doc.setFont('helvetica', 'normal')
    ctx.doc.setFontSize(9.5)
    setText(ctx.doc, slate500)
    ctx.doc.text(`Entry ${index + 1}`, ctx.x + ctx.width - padding, cardY + padding, { align: 'right' })
  } else {
    ctx.doc.setFont('helvetica', 'bold')
    ctx.doc.setFontSize(12.5)
    setText(ctx.doc, slate900)
    ctx.doc.text(entry.condition_label, innerX, ctx.y)

    ctx.doc.setFont('helvetica', 'normal')
    ctx.doc.setFontSize(10)
    setText(ctx.doc, slate500)
    ctx.doc.text(dateLabel, ctx.x + ctx.width - padding, ctx.y, { align: 'right' })
    ctx.y += 16
  }

  if (includeFamilyBadge) {
    drawFamilyEntryBadge(ctx, innerX, innerWidth)
  }

  const severityLabel = severityHistory.currentValue
    || (typeof entry.severity === 'number' ? `Severity ${entry.severity}/10` : 'Severity not recorded')

  if (options.hideConditionTitle) {
    drawRevisionHeaderValues(ctx, innerX, severityHistory.priorValues, severityLabel, 9.5, slate500, 'normal')
  } else {
    ctx.doc.setFont('helvetica', 'normal')
    ctx.doc.setFontSize(9.5)
    setText(ctx.doc, slate500)
    ctx.doc.text(`${severityLabel} · Entry ${index + 1}`, innerX, ctx.y)
    ctx.y += 16
  }

  if (edited) {
    ctx.y += 13
    ctx.doc.setFont('helvetica', 'italic')
    ctx.doc.setFontSize(9)
    setText(ctx.doc, slate500)
    const editCount = Number(entry.edit_count) || revisionContext?.revisions.length || 0
    const editNote = editCount
      ? `Edited ${editCount} time${editCount === 1 ? '' : 's'} · last ${formatReportEntryDate(entry.updated_at)}`
      : `Edited ${formatReportEntryDate(entry.updated_at)}`
    ctx.doc.text(editNote, innerX, ctx.y)
  }

  ctx.y += 14

  drawDivider(ctx, innerX, innerWidth)

  primaryBlocks.forEach((block, blockIndex) => {
    drawBlockLabel(ctx, block.label, innerX, 8.5)
    ctx.y += 12
    drawBlockContent(ctx, block, innerX, 11, 15)
    if (blockIndex < primaryBlocks.length - 1 || detailBlocks.length) {
      ctx.y += 8
    }
  })

  if (detailBlocks.length) {
    if (primaryBlocks.length) {
      drawDivider(ctx, innerX, innerWidth)
    }

    drawBlockLabel(ctx, 'Additional details', innerX, 8)
    ctx.y += 12

    const columnGap = 16
    const columnWidth = (innerWidth - columnGap) / 2

    for (let blockIndex = 0; blockIndex < detailBlocks.length; blockIndex += 2) {
      const left = detailBlocks[blockIndex]
      const right = detailBlocks[blockIndex + 1]
      const rowStartY = ctx.y
      let leftEndY = rowStartY
      let rightEndY = rowStartY

      drawBlockLabel(ctx, left.label, innerX, 7.5)
      leftEndY += 11
      ctx.y = leftEndY
      drawBlockContent(ctx, left, innerX, 10, 14)
      leftEndY = ctx.y

      if (right) {
        ctx.y = rowStartY
        drawBlockLabel(ctx, right.label, innerX + columnWidth + columnGap, 7.5)
        rightEndY += 11
        ctx.y = rightEndY
        drawBlockContent(ctx, right, innerX + columnWidth + columnGap, 10, 14)
        rightEndY = ctx.y
      }

      ctx.y = Math.max(leftEndY, rightEndY) + 8
    }
  }

  if (backdateNote) {
    ctx.y += 10
    drawBackdateNote(ctx, backdateNote, innerX, innerWidth)
  }

  ctx.y = cardY + cardHeight + 14
}

export function drawEntryLogSection(
  doc: jsPDF,
  entries: ReportEntryRecord[],
  x: number,
  y: number,
  width: number,
  margin: number,
  pageHeight: number,
  options: EntryLogSectionOptions = {}
) {
  const reportMode = options.reportMode ?? 'full'
  const reportTitle = getReportModeTitle(reportMode)
  const backdateContext: BackdateReportContext = {
    loggingCadence: options.loggingCadence,
    weeklyLogDay: options.weeklyLogDay
  }
  const bottomLimit = pageHeight - 48
  const ctx: LayoutContext = {
    doc,
    x,
    y,
    width,
    margin,
    pageHeight,
    bottomLimit,
    reportVariant: options.reportVariant
  }

  const sortedEntries = [...entries].sort(
    (left, right) => getEntryDate(right).getTime() - getEntryDate(left).getTime()
  )

  const firstEntry = sortedEntries[0]
  let keepWithHeader = 96
  const showAdvancedChartsNote = reportMode === 'full' && Boolean(options.includeAdvancedCharts)
  let headerHeight = options.reportVariant === 'family'
    ? ENTRY_TYPE_BADGE_HEIGHT + 20
    : 28 + (showAdvancedChartsNote ? 16 : 0)

  const conditionGroups = groupEntriesByCondition(sortedEntries)
  const entryRevisionsByEntryId = options.entryRevisionsByEntryId

  if (firstEntry && conditionGroups[0]) {
    const firstGroup = conditionGroups[0]
    const { veteranCount, familyCount } = buildConditionSourceSummary(firstGroup.entries)
    const firstGroupIntroHeight = measureConditionIntroHeight(
      doc,
      width,
      firstGroup.label,
      firstGroup.statement,
      formatConditionSourceSummary(veteranCount, familyCount)
    )
    const firstRevisionContext = buildEntryRevisionContext(firstEntry, entryRevisionsByEntryId)
    const firstBlocks = buildEntryBlocks(doc, firstEntry, width - 36, firstRevisionContext)
    const firstDateHistory = firstRevisionContext
      ? buildFieldEditHistory(firstRevisionContext.revisions, firstRevisionContext.currentSnapshot, { kind: 'occurred_at' })
      : { priorValues: [] }
    const firstSeverityHistory = firstRevisionContext
      ? buildFieldEditHistory(firstRevisionContext.revisions, firstRevisionContext.currentSnapshot, { kind: 'severity' })
      : { priorValues: [] }
    const firstCardHeight = measureEntryHeight(firstBlocks, {
      backdateNote: getEntryBackdateNote(firstEntry, backdateContext),
      edited: wasEntryEdited(firstEntry) || Boolean(firstRevisionContext?.revisions.length),
      includeFamilyBadge: shouldShowFamilyEntryBadge(ctx, firstEntry),
      hideConditionTitle: true,
      datePriorCount: firstDateHistory.priorValues.length,
      severityPriorCount: firstSeverityHistory.priorValues.length
    })
    keepWithHeader = Math.min(firstGroupIntroHeight + firstCardHeight + 28, 360)
  }

  ensureSpace(ctx, headerHeight + keepWithHeader)

  if (options.reportVariant === 'family') {
    drawFamilyObservationsBanner(ctx)
  } else {
    drawReportTypeHeader(doc, reportTitle, x, ctx.y)
    ctx.y += 24

    if (showAdvancedChartsNote) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      setText(doc, slate500)
      doc.text('All charts are generated from these entries.', x, ctx.y)
      ctx.y += 16
    }
  }

  conditionGroups.forEach((group) => {
    drawConditionIntro(ctx, group.label, group.statement, group.entries)

    group.entries.forEach((entry, index) => {
      drawEntryCard(ctx, entry, index, backdateContext, {
        hideConditionTitle: true,
        entryRevisionsByEntryId
      })
    })
  })

  return ctx.y
}
