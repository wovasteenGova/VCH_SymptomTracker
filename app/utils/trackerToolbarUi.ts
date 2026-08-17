/** Header toolbar labels and hover help — buttons use Title Case; sentences stay lowercase in copy. */

export const TRACKER_TOOLTIP = {
  delayDuration: 250,
  content: { side: 'bottom' as const, sideOffset: 6 }
}

export const CLAIMBUILDER_ACTION = {
  label: 'Open ClaimBuilder',
  ariaLabel: 'Open ClaimBuilder in a new tab',
  tooltip: 'Draft and organize VA claim prep with AI assistance'
} as const

export const LAY_REPORTING_ACTION = {
  label: 'Lay Reporting',
  ariaLabel: 'Open Lay Reporting settings',
  tooltip: 'Share private links for family and friends to submit signed observations'
} as const

export const SUBMISSIONS_INBOX_ACTION = {
  ariaLabel: 'Open submissions and drafts',
  tooltip: 'Outside reports from family and friends, plus saved entry drafts'
} as const

export const ACCOUNT_SETTINGS_ACTION = {
  tooltip: 'Account settings, billing, and preferences'
} as const

export const COLOR_THEME_ACTION = {
  tooltip: (themeLabel: string) => `Color theme: ${themeLabel}`
} as const

export const COLOR_MODE_ACTION = {
  tooltip: (isDark: boolean) => (isDark ? 'Switch to light mode' : 'Switch to dark mode')
} as const
