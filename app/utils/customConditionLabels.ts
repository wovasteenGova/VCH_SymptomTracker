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
  return mergeCustomConditionLabelMaps(remoteLabels, localLabels)
}
