import { diffWordsWithSpace } from 'diff'
import type { SymptomEntrySavePayload } from './symptomEntrySavePayload'
import { formatReportEntryTimestamp } from './reportBackfillNote'

export const MAX_ENTRY_EDITS = 3

export type EntryRevisionSnapshot = SymptomEntrySavePayload

export type EntryRevisionRecord = {
  id?: string
  entry_id: string
  revision_number: number
  revised_at: string
  snapshot: EntryRevisionSnapshot
}

export type EntryFieldRef =
  | { kind: 'summary' }
  | { kind: 'impact' }
  | { kind: 'severity' }
  | { kind: 'occurred_at' }
  | { kind: 'detail', key: string }

export function getRemainingEntryEdits(editCount: number | null | undefined) {
  const used = Math.max(0, Number(editCount) || 0)
  return Math.max(0, MAX_ENTRY_EDITS - used)
}

export function isEntryEditLocked(editCount: number | null | undefined) {
  return getRemainingEntryEdits(editCount) <= 0
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function formatSeverityValue(severity: number | null | undefined) {
  if (typeof severity !== 'number' || Number.isNaN(severity)) {
    return ''
  }

  return `Severity ${severity}/10`
}

function formatOccurredAtValue(occurredAt: string | null | undefined) {
  if (!occurredAt) {
    return ''
  }

  return formatReportEntryTimestamp(occurredAt)
}

export function getSnapshotFieldValue(snapshot: EntryRevisionSnapshot, field: EntryFieldRef) {
  switch (field.kind) {
    case 'summary':
      return normalizeText(snapshot.summary)
    case 'impact':
      return normalizeText(snapshot.impact)
    case 'severity':
      return formatSeverityValue(snapshot.severity)
    case 'occurred_at':
      return formatOccurredAtValue(snapshot.occurred_at)
    case 'detail':
      return normalizeText(snapshot.details?.[field.key])
  }
}

export function buildFieldEditHistory(
  revisions: EntryRevisionRecord[],
  current: EntryRevisionSnapshot,
  field: EntryFieldRef
) {
  const sortedRevisions = [...revisions].sort((left, right) => left.revision_number - right.revision_number)
  const priorValues: string[] = []

  for (let index = 0; index < sortedRevisions.length; index += 1) {
    const before = getSnapshotFieldValue(sortedRevisions[index].snapshot, field)
    const afterSnapshot = sortedRevisions[index + 1]?.snapshot ?? current
    const after = getSnapshotFieldValue(afterSnapshot, field)

    if (before && before !== after) {
      priorValues.push(before)
    }
  }

  const currentValue = getSnapshotFieldValue(current, field)

  return {
    priorValues,
    currentValue
  }
}

export type EntryEditTextRun = {
  text: string
  kind: 'unchanged' | 'added' | 'removed'
  addedAt?: string
  removedAt?: string
}

export type EntryEditParagraph = {
  runs: EntryEditTextRun[]
  addedAt?: string
}

function appendEditRun(runs: EntryEditTextRun[], run: EntryEditTextRun) {
  if (!run.text) return

  const previous = runs[runs.length - 1]
  if (previous && run.kind !== 'removed' && previous.kind === run.kind
    && previous.addedAt === run.addedAt && previous.removedAt === run.removedAt) {
    previous.text += run.text
  } else {
    runs.push({ ...run })
  }
}

function applyTextRevision(runs: EntryEditTextRun[], after: string, revisedAt: string) {
  const before = runs.filter(run => run.kind !== 'removed').map(run => run.text).join('')
  const changes = diffWordsWithSpace(before, after, { timeout: 100 }) ?? [
    { value: before, removed: true, added: false },
    { value: after, removed: false, added: true }
  ]
  const next: EntryEditTextRun[] = []
  let runIndex = 0
  let offset = 0

  // Compare only live text, carrying earlier deletions along at their original positions.
  const carryDeletions = () => {
    while (runs[runIndex]?.kind === 'removed') {
      appendEditRun(next, runs[runIndex]!)
      runIndex += 1
    }
  }
  const consume = (length: number, removed: boolean) => {
    while (length > 0 && runIndex < runs.length) {
      carryDeletions()
      const run = runs[runIndex]
      if (!run) break

      const count = Math.min(length, run.text.length - offset)
      appendEditRun(next, {
        ...run,
        text: run.text.slice(offset, offset + count),
        ...(removed ? { kind: 'removed', removedAt: revisedAt } : {})
      })
      length -= count
      offset += count
      if (offset === run.text.length) {
        runIndex += 1
        offset = 0
      }
    }
  }

  for (const change of changes) {
    if (change.added) {
      carryDeletions()
      appendEditRun(next, { text: change.value, kind: 'added', addedAt: revisedAt })
    } else {
      consume(change.value.length, Boolean(change.removed))
    }
  }
  carryDeletions()
  return next
}

export function buildFieldEditPresentation(
  revisions: EntryRevisionRecord[],
  current: EntryRevisionSnapshot,
  field: EntryFieldRef
): EntryEditParagraph[] {
  const sorted = [...revisions].sort((left, right) => left.revision_number - right.revision_number)
  const text = (snapshot: EntryRevisionSnapshot) => getSnapshotFieldValue(snapshot, field).replace(/\r\n?/g, '\n')
  let runs: EntryEditTextRun[] = [{ text: text(sorted[0]?.snapshot ?? current), kind: 'unchanged' }]

  sorted.forEach((revision, index) => {
    runs = applyTextRevision(runs, text(sorted[index + 1]?.snapshot ?? current), revision.revised_at)
  })

  const paragraphs: EntryEditParagraph[] = [{ runs: [] }]
  for (const run of runs) {
    for (const part of run.text.split(/(\n[\t ]*\n+)/)) {
      if (/^\n[\t ]*\n+$/.test(part)) {
        paragraphs.push({ runs: [] })
      } else {
        appendEditRun(paragraphs[paragraphs.length - 1]!.runs, { ...run, text: part })
      }
    }
  }

  return paragraphs.filter(paragraph => paragraph.runs.some(run => run.text.trim())).map((paragraph) => {
    const content = paragraph.runs.filter(run => run.text.trim())
    // A wholly new paragraph gets one label; inline additions remain part of their sentence.
    const addedAt = content.every(run => run.addedAt)
      ? content.map(run => run.addedAt!).sort()[0]
      : undefined
    return { ...paragraph, ...(addedAt ? { addedAt } : {}) }
  })
}

export function buildSymptomEntrySavePayloadFromReportEntry(entry: {
  condition_label?: string | null
  condition_key?: string | null
  severity?: number | null
  occurred_at?: string | null
  created_at?: string | null
  summary?: string | null
  impact?: string | null
  details?: Record<string, unknown> | null
}): EntryRevisionSnapshot {
  const conditionLabel = normalizeText(entry.condition_label) || 'Symptom log'
  const details = {
    ...((entry.details as Record<string, string>) || {})
  }

  if (entry.summary && !details.what_happened) {
    details.what_happened = String(entry.summary)
  }

  if (entry.impact && !details.daily_impact) {
    details.daily_impact = String(entry.impact)
  }

  return {
    condition_key: normalizeText(entry.condition_key) || conditionLabel.toLowerCase().replace(/\s+/g, '_'),
    condition_label: conditionLabel,
    severity: (entry.severity as number | null | undefined) ?? 5,
    occurred_at: entry.occurred_at || entry.created_at || null,
    summary: normalizeText(entry.summary) || conditionLabel,
    impact: normalizeText(entry.impact) || null,
    details
  }
}

export function normalizeRevisionSnapshot(raw: unknown): EntryRevisionSnapshot {
  if (!raw) {
    return {
      condition_key: '',
      condition_label: '',
      severity: 5,
      occurred_at: null,
      summary: '',
      impact: null,
      details: {}
    }
  }

  if (typeof raw === 'string') {
    try {
      return normalizeRevisionSnapshot(JSON.parse(raw))
    } catch {
      return {
        condition_key: '',
        condition_label: '',
        severity: 5,
        occurred_at: null,
        summary: raw.trim(),
        impact: null,
        details: {}
      }
    }
  }

  const record = raw as Partial<EntryRevisionSnapshot>
  return {
    condition_key: normalizeText(record.condition_key),
    condition_label: normalizeText(record.condition_label) || 'Symptom log',
    severity: typeof record.severity === 'number' ? record.severity : 5,
    occurred_at: record.occurred_at || null,
    summary: normalizeText(record.summary),
    impact: normalizeText(record.impact) || null,
    details: {
      ...((record.details as Record<string, string>) || {})
    }
  }
}

export function normalizeRevisionRecord(revision: EntryRevisionRecord): EntryRevisionRecord {
  return {
    ...revision,
    snapshot: normalizeRevisionSnapshot(revision.snapshot)
  }
}

export function normalizeRevisionRecords(revisions: EntryRevisionRecord[]) {
  return revisions.map((revision) => normalizeRevisionRecord(revision))
}

export function groupRevisionsByEntryId(revisions: EntryRevisionRecord[]) {
  const grouped = new Map<string, EntryRevisionRecord[]>()

  for (const revision of normalizeRevisionRecords(revisions)) {
    const existing = grouped.get(revision.entry_id) || []
    existing.push(revision)
    grouped.set(revision.entry_id, existing)
  }

  return grouped
}
