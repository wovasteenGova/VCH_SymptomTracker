export const GROUPED_TOAST_ID_PREFIX = 'toast-group:'

export type GroupedToastEntry = {
  description?: string
  addedAt: number
}

export type GroupedToastGroup = {
  title: string
  entries: GroupedToastEntry[]
  expanded: boolean
  duration?: number
}

export function groupedToastIdForTitle(title: string): string {
  return `${GROUPED_TOAST_ID_PREFIX}${title}`
}

export function isGroupedToastId(id: string | number): boolean {
  return String(id).startsWith(GROUPED_TOAST_ID_PREFIX)
}

export function titleFromGroupedToastId(id: string | number): string {
  return String(id).slice(GROUPED_TOAST_ID_PREFIX.length)
}

export function resolveToastGroupKey(partial: {
  id?: string | number
  title?: unknown
  actions?: unknown[]
}): string | null {
  const title = partial.title
  if (typeof title !== 'string' || !title.trim()) {
    return null
  }
  if (partial.id != null && !isGroupedToastId(partial.id)) {
    return null
  }
  if (Array.isArray(partial.actions) && partial.actions.length > 0) {
    return null
  }
  return title.trim()
}
