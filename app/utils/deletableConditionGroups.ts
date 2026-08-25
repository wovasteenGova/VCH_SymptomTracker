import {
  resolveCatalogConditionByStoredKey,
  resolveTrackedConditionByStoredKey,
  resolveTrackedConditionKey
} from './conditionCatalog'
import { conditionKeyFromLabel, formatConditionKeyLabel } from './subscription'

export type DeletableConditionGroup = {
  key: string
  label: string
  activeEntryCount: number
  deletedEntryCount: number
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

function resolveEntryConditionLabel(entry: SymptomEntryRef, key: string) {
  return entry.condition_label?.trim()
    || resolveTrackedConditionByStoredKey(key)?.title
    || formatConditionKeyLabel(key)
}

export function buildDeletableConditionGroups(input: {
  activeEntries?: ReadonlyArray<SymptomEntryRef>
  deletedEntries?: ReadonlyArray<SymptomEntryRef>
}): DeletableConditionGroup[] {
  const grouped = new Map<string, DeletableConditionGroup>()

  function upsert(entry: SymptomEntryRef, field: 'activeEntryCount' | 'deletedEntryCount') {
    const rawKey = resolveEntryConditionKey(entry)
    const key = normalizeConditionKey(rawKey)

    if (!key) {
      return
    }

    const label = resolveEntryConditionLabel(entry, key)
    const existing = grouped.get(key)

    if (existing) {
      existing[field] += 1
      if (label && existing.label === formatConditionKeyLabel(key)) {
        existing.label = label
      }
      return
    }

    grouped.set(key, {
      key,
      label,
      activeEntryCount: field === 'activeEntryCount' ? 1 : 0,
      deletedEntryCount: field === 'deletedEntryCount' ? 1 : 0
    })
  }

  for (const entry of input.activeEntries ?? []) {
    upsert(entry, 'activeEntryCount')
  }

  for (const entry of input.deletedEntries ?? []) {
    upsert(entry, 'deletedEntryCount')
  }

  return [...grouped.values()]
    .filter((group) => group.activeEntryCount + group.deletedEntryCount > 0)
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function totalDeletableEntryCount(group: DeletableConditionGroup) {
  return group.activeEntryCount + group.deletedEntryCount
}
