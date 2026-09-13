import {
  type GroupedToastGroup,
  groupedToastIdForTitle,
  isGroupedToastId
} from '#shared/groupedToast'

export function useGroupedToast() {
  const groups = useState<Record<string, GroupedToastGroup>>('vch-grouped-toast-groups', () => ({}))

  function getGroup(id: string): GroupedToastGroup | undefined {
    return groups.value[id]
  }

  function appendEntry(groupKey: string, description?: string, duration?: number) {
    const id = groupedToastIdForTitle(groupKey)
    const entry = {
      description: description ? String(description) : undefined,
      addedAt: Date.now()
    }
    const existing = groups.value[id]
    if (existing) {
      existing.entries.unshift(entry)
      if (duration != null) {
        existing.duration = duration
      }
    } else {
      groups.value[id] = {
        title: groupKey,
        entries: [entry],
        expanded: false,
        duration
      }
    }
    return {
      id,
      entryCount: groups.value[id]!.entries.length,
      expanded: groups.value[id]!.expanded,
      duration: groups.value[id]!.duration
    }
  }

  function toggleExpanded(id: string) {
    const group = groups.value[id]
    if (!group || group.entries.length <= 1) {
      return false
    }
    group.expanded = !group.expanded
    return group.expanded
  }

  function removeGroup(id: string) {
    if (!groups.value[id]) {
      return
    }
    const { [id]: _removed, ...rest } = groups.value
    groups.value = rest
  }

  function handleGroupedToastToggle(id: string) {
    const toast = useToast()
    const group = groups.value[id]
    const isExpanded = toggleExpanded(id)
    toast.update(id, {
      duration: isExpanded ? 0 : group?.duration ?? 5000,
      open: true
    })
  }

  return {
    groups,
    getGroup,
    appendEntry,
    toggleExpanded,
    removeGroup,
    handleGroupedToastToggle,
    isGroupedToastId
  }
}
