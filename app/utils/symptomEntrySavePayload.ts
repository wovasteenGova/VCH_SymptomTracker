import { conditionKeyFromLabel } from './subscription'
import { toLocalDateTimeInputValue } from './symptomDateTime'

export type SymptomEntrySavePayload = {
  condition_key: string
  condition_label: string
  severity: number
  occurred_at: string | null
  summary: string
  impact: string | null
  details: Record<string, string>
}

export function buildSymptomEntrySavePayload(options: {
  entryTitle: string
  severity: number
  entryForm: Record<string, string>
  /** Preserve the stored key when editing an existing entry. */
  conditionKey?: string | null
}): SymptomEntrySavePayload {
  const { entryTitle, severity, entryForm, conditionKey } = options
  const details = { ...entryForm }
  const occurredAt = entryForm.date_and_time
    ? new Date(entryForm.date_and_time).toISOString()
    : null
  const resolvedConditionKey = conditionKey?.trim() || conditionKeyFromLabel(entryTitle)

  return {
    condition_key: resolvedConditionKey,
    condition_label: entryTitle,
    severity,
    occurred_at: occurredAt,
    summary: entryForm.what_happened || entryForm.condition_name || entryTitle,
    impact: entryForm.daily_impact || null,
    details
  }
}

export function buildSymptomEntrySavePayloadFromRecord(
  entry: Record<string, unknown>,
  entryTitle: string,
  options: { customName?: string | null, conditionKey?: string | null } = {}
): SymptomEntrySavePayload {
  const details = {
    ...((entry.details as Record<string, string>) || {})
  } as Record<string, string>

  if (entry.summary && !details.what_happened) {
    details.what_happened = String(entry.summary)
  }

  if (entry.impact && !details.daily_impact) {
    details.daily_impact = String(entry.impact)
  }

  if (!details.date_and_time && entry.occurred_at) {
    details.date_and_time = toLocalDateTimeInputValue(new Date(String(entry.occurred_at)))
  }

  if (options.customName) {
    details.condition_name = options.customName
  }

  return buildSymptomEntrySavePayload({
    entryTitle,
    severity: (entry.severity as number | null | undefined) ?? 5,
    entryForm: details,
    conditionKey: options.conditionKey
      ?? (typeof entry.condition_key === 'string' ? entry.condition_key : null)
  })
}

function normalizeDetails(details: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {}

  for (const [key, value] of Object.entries(details)) {
    const trimmed = String(value ?? '').trim()

    if (trimmed) {
      normalized[key] = trimmed
    }
  }

  return normalized
}

function detailsEqual(left: Record<string, string>, right: Record<string, string>): boolean {
  const normalizedLeft = normalizeDetails(left)
  const normalizedRight = normalizeDetails(right)
  const leftKeys = Object.keys(normalizedLeft).sort()
  const rightKeys = Object.keys(normalizedRight).sort()

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key, index) => key === rightKeys[index] && normalizedLeft[key] === normalizedRight[index])
}

export function symptomEntrySavePayloadsEqual(
  left: SymptomEntrySavePayload,
  right: SymptomEntrySavePayload
): boolean {
  return left.condition_key === right.condition_key
    && left.condition_label === right.condition_label
    && left.severity === right.severity
    && left.occurred_at === right.occurred_at
    && left.summary === right.summary
    && left.impact === right.impact
    && detailsEqual(left.details, right.details)
}
