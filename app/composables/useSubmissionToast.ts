type SubmissionToastPayload = {
  message: string
  highlight?: string
  tone?: 'success' | 'error'
  durationMs?: number
  action?: {
    href: string
    label: string
  }
}

function normalizeSubmissionToastPayload(payload: string | SubmissionToastPayload): SubmissionToastPayload {
  if (typeof payload === 'string') {
    return { message: payload, tone: 'success' }
  }

  return {
    tone: 'success',
    ...payload
  }
}

export { normalizeSubmissionToastPayload }
export type { SubmissionToastPayload }

export function useSubmissionToast() {
  const toast = useToast()
  const activeToast = computed(() => toast.toasts.value.length > 0)

  function showSubmissionToast(payload: string | SubmissionToastPayload) {
    const normalized = normalizeSubmissionToastPayload(payload)
    const compactHighlight = normalized.highlight?.trim()
    const title = compactHighlight && compactHighlight.length <= 8
      ? `${compactHighlight} ${normalized.message}`
      : normalized.message
    const duration = normalized.tone === 'error'
      ? normalized.durationMs ?? 4200
      : normalized.durationMs ?? 2400

    toast.add({
      title,
      description: compactHighlight && compactHighlight.length > 8 ? compactHighlight : undefined,
      color: normalized.tone === 'error' ? 'error' : 'success',
      icon: normalized.tone === 'error' ? 'i-lucide-alert-circle' : 'i-lucide-check-circle-2',
      duration,
      actions: normalized.action
        ? [{
            label: normalized.action.label,
            to: normalized.action.href,
            target: '_blank',
            color: 'neutral',
            variant: 'link'
          }]
        : undefined
    })
  }

  function clearSubmissionToast() {
    for (const entry of toast.toasts.value) {
      toast.remove(entry.id)
    }
  }

  return {
    activeToast,
    showSubmissionToast,
    clearSubmissionToast
  }
}
