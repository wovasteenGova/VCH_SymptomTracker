/**
 * Date shown as Pro "Access until" in Payment Center / profile.
 * Prefer Claim Maker user_subscriptions.current_period_end; founding grant until is fallback only.
 */
export function resolveDisplayedProAccessUntilIso(input: {
  currentPeriodEnd?: string | null
  foundingProUntil?: string | null
}): string | null {
  for (const candidate of [input.currentPeriodEnd, input.foundingProUntil]) {
    const value = typeof candidate === 'string' ? candidate.trim() : ''
    if (!value) continue
    if (Number.isNaN(Date.parse(value))) continue
    return value
  }
  return null
}

/** Format an access-until ISO for UI without shifting the calendar day in local TZ. */
export function formatProAccessUntilDate(
  untilIso: string,
  locale?: string
): string {
  const parsed = new Date(untilIso)
  if (Number.isNaN(parsed.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(parsed)
}
