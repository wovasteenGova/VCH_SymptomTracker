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

export function groupRevisionsByEntryId(revisions: EntryRevisionRecord[]) {
  const grouped = new Map<string, EntryRevisionRecord[]>()

  for (const revision of revisions) {
    const existing = grouped.get(revision.entry_id) || []
    existing.push(revision)
    grouped.set(revision.entry_id, existing)
  }

  return grouped
}
