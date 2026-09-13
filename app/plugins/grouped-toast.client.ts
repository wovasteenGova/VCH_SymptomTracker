import { resolveToastGroupKey } from '#shared/groupedToast'

export default defineNuxtPlugin(() => {
  const toast = useToast()
  const {
    appendEntry,
    removeGroup,
    handleGroupedToastToggle,
    isGroupedToastId
  } = useGroupedToast()

  const originalAdd = toast.add.bind(toast)
  const originalRemove = toast.remove.bind(toast)
  const originalUpdate = toast.update.bind(toast)

  function upsertGroupedToast(groupedToast: Parameters<typeof originalAdd>[0] & { id: string | number }) {
    const existingIndex = toast.toasts.value.findIndex(entry => entry.id === groupedToast.id)
    if (existingIndex !== -1) {
      originalUpdate(groupedToast.id, groupedToast)
      return { ...toast.toasts.value[existingIndex], ...groupedToast }
    }

    const max = 5
    toast.toasts.value = [...toast.toasts.value, groupedToast as ReturnType<typeof originalAdd>].slice(-max)
    return groupedToast as ReturnType<typeof originalAdd>
  }

  toast.add = (partial) => {
    const groupKey = resolveToastGroupKey(partial)
    if (!groupKey) {
      return originalAdd(partial)
    }

    const { id, entryCount, expanded, duration } = appendEntry(
      groupKey,
      partial.description,
      partial.duration
    )

    const groupedToast = {
      ...partial,
      id,
      open: true,
      description: partial.description,
      duration: expanded ? 0 : duration,
      onClick: () => handleGroupedToastToggle(id)
    }

    return upsertGroupedToast({
      ...groupedToast,
      _duplicate: entryCount > 1 ? entryCount - 1 : undefined
    })
  }

  toast.remove = (id) => {
    if (isGroupedToastId(id)) {
      removeGroup(String(id))
    }
    return originalRemove(id)
  }
})
