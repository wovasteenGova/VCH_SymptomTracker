import {
  isCustomTrackedConditionKey,
  resolveCatalogConditionByStoredKey,
  resolveTrackedConditionByStoredKey,
  resolveTrackedConditionKey
} from './conditionCatalog'
import { conditionKeyFromLabel, formatConditionKeyLabel } from './subscription'

export type InactiveCustomCondition = {
  key: string
  label: string
  entryCount: number
}

type SymptomEntryRef = {
  condition_key?: string | null
  condition_label?: string | null
}

function resolveEntryConditionKey(entry: SymptomEntryRef) {
  const resolved = resolveCatalogConditionByStoredKey(entry.condition_key || entry.condition_label || '')
  return resolved?.key || entry.condition_key?.trim() || conditionKeyFromLabel(entry.condition_label || '')
}

function normalizeConditionKey(key: string) {
  return resolveTrackedConditionKey(key) ?? key.trim()
}

export function buildInactiveCustomConditions(input: {
  trackedKeys?: string[]
  entries?: ReadonlyArray<SymptomEntryRef>
  customLabels?: Record<string, string>
}): InactiveCustomCondition[] {
  const trackedSet = new Set(
    (input.trackedKeys ?? [])
      .map((key) => normalizeConditionKey(key))
      .filter(Boolean)
  )
  const grouped = new Map<string, InactiveCustomCondition>()

  for (const entry of input.entries ?? []) {
    const rawKey = resolveEntryConditionKey(entry)
    const key = normalizeConditionKey(rawKey)

    if (!key || !isCustomTrackedConditionKey(key) || trackedSet.has(key)) {
      continue
    }

    const label = entry.condition_label?.trim()
      || input.customLabels?.[key]
      || resolveTrackedConditionByStoredKey(key, input.customLabels)?.title
      || formatConditionKeyLabel(key)

    const existing = grouped.get(key)

    if (existing) {
      existing.entryCount += 1
      if (label && existing.label === formatConditionKeyLabel(key)) {
        existing.label = label
      }
      continue
    }

    grouped.set(key, {
      key,
      label,
      entryCount: 1
    })
  }

  for (const [rawKey, label] of Object.entries(input.customLabels ?? {})) {
    const key = normalizeConditionKey(rawKey)

    if (!key || !isCustomTrackedConditionKey(key) || trackedSet.has(key) || grouped.has(key)) {
      continue
    }

    grouped.set(key, {
      key,
      label: label.trim() || formatConditionKeyLabel(key),
      entryCount: 0
    })
  }

  return [...grouped.values()].sort((left, right) => left.label.localeCompare(right.label))
}
