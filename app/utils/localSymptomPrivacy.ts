/** Remove device-cached health content for one account when its session ends. */
export function clearLocalSymptomData(userId: string | null | undefined) {
  if (!import.meta.client || !userId) return

  const exactKeys = new Set([
    `symptom-tracker-entry-draft:${userId}`,
    `symptom-tracker-deleted-entries-${userId}`,
    `symptom-tracker-tracked-condition-keys:${userId}`,
    `symptom-tracker-conditions-onboarding-completed:${userId}`,
    `symptom-tracker-custom-condition-labels:${userId}`,
    `symptom-tracker-home-condition-order:${userId}`
  ])
  const medicationPrefix = `symptom-tracker-entry-medications:${userId}`

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index)
    if (key && (exactKeys.has(key) || key === medicationPrefix || key.startsWith(`${medicationPrefix}:`))) {
      window.localStorage.removeItem(key)
    }
  }
}
