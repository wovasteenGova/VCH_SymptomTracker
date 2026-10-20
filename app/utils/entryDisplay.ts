import { normalizeConditionLabel, resolveCatalogConditionByStoredKey } from './conditionCatalog'
import { conditionKeyFromLabel } from './subscription'

/** Max words shown for entry narrative in History entry lists (not detail views). */
export const HISTORY_ENTRY_LIST_MAX_WORDS = 65

export function truncateToWordCount(text: string, maxWords = HISTORY_ENTRY_LIST_MAX_WORDS) {
  const normalized = text.trim()
  if (!normalized) {
    return text
  }

  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) {
    return normalized
  }

  return `${words.slice(0, maxWords).join(' ')}…`
}

export function resolveEntryConditionKey(entry: Record<string, any>) {
  const stored = entry.condition_key || entry.condition_label || ''
  const resolved = resolveCatalogConditionByStoredKey(stored)
  return resolved?.key || entry.condition_key || conditionKeyFromLabel(entry.condition_label || '')
}

export function mapEntryHistoryItem(entry: Record<string, any>, options: { deleted?: boolean } = {}) {
  const entryDate = entry.occurred_at ? new Date(entry.occurred_at) : new Date(entry.created_at)
  const createdAt = entry.created_at ? new Date(entry.created_at) : entryDate
  const updatedAt = entry.updated_at ? new Date(entry.updated_at) : createdAt
  const deletedAt = entry.deleted_at ? new Date(entry.deleted_at) : null
  const wasEdited = !options.deleted && updatedAt.getTime() - createdAt.getTime() > 60_000
  const conditionLabel = normalizeConditionLabel(entry.condition_label)
  const title = entry.summary || conditionLabel
  const summary = entry.impact || 'No impact note added'

  return {
    id: entry.id,
    month: entryDate.toLocaleString('en-US', { month: 'short' }),
    day: entryDate.toLocaleString('en-US', { day: '2-digit' }),
    condition: conditionLabel,
    conditionKey: resolveEntryConditionKey(entry),
    source: entry.source === 'family' ? 'Family' : 'Veteran',
    title,
    summary,
    listTitle: truncateToWordCount(title),
    listSummary: truncateToWordCount(summary),
    severity: entry.severity ?? 0,
    time: entryDate.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    }),
    wasEdited,
    editedLabel: wasEdited
      ? `Edited ${updatedAt.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}`
      : '',
    deletedLabel: deletedAt
      ? `Deleted ${deletedAt.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}`
      : '',
    statusIcon: entry.severity >= 7 ? 'i-lucide-frown' : entry.severity >= 4 ? 'i-lucide-meh' : 'i-lucide-smile',
    statusColor: entry.severity >= 7
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
      : entry.severity >= 4
        ? 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  }
}
