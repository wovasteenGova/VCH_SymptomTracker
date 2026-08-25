import { mergeCustomConditionLabelMaps } from './conditionCatalog'

export function normalizeCustomConditionLabels(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const labels: Record<string, string> = {}

  for (const [key, label] of Object.entries(value)) {
    const trimmedKey = key?.trim()
    const trimmedLabel = typeof label === 'string' ? label.trim() : ''

    if (trimmedKey && trimmedLabel) {
      labels[trimmedKey] = trimmedLabel
    }
  }

  return labels
}

export function customConditionLabelsChanged(
  left: Record<string, string>,
  right: Record<string, string>
) {
  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()

  if (leftKeys.length !== rightKeys.length) {
    return true
  }

  return leftKeys.some((key) => left[key] !== right[key])
}

export function mergeStoredCustomConditionLabels(
  remoteLabels: Record<string, string> | undefined,
  localLabels: Record<string, string> | undefined
) {
  const remote = normalizeCustomConditionLabels(remoteLabels)
  const local = normalizeCustomConditionLabels(localLabels)
  const merged = { ...remote }

  for (const [key, label] of Object.entries(local)) {
    if (!merged[key]) {
      merged[key] = label
    }
  }

  return merged
}

/** True when local still has labels that never made it to the server (first-device migration). */
export function shouldUploadLocalCustomConditionLabels(
  remoteLabels: Record<string, string>,
  localLabels: Record<string, string>
) {
  const remote = normalizeCustomConditionLabels(remoteLabels)
  const local = normalizeCustomConditionLabels(localLabels)

  if (!Object.keys(local).length) {
    return false
  }

  if (!Object.keys(remote).length) {
    return true
  }

  return Object.keys(local).some((key) => !remote[key])
}
