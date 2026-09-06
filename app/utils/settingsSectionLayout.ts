/** Horizontal dividers between settings sections (no bordered section cards). */
export const SETTINGS_SECTION_BLOCK_CLASS = 'settings-section-block'

export function settingsSectionsStackClass(compact?: boolean) {
  return compact
    ? 'divide-y divide-default/70 [&>.settings-section-block:not(:first-of-type):not(:last-of-type)]:my-3'
    : 'divide-y divide-default/70 [&>.settings-section-block:not(:first-of-type):not(:last-of-type)]:my-5'
}

/** @deprecated Use settingsSectionsStackClass(compact) */
export const SETTINGS_SECTIONS_DIVIDER_CLASS = 'divide-y divide-default/70'

export function settingsScrollBodyClass(options?: {
  compact?: boolean
  overlay?: boolean
}) {
  const { compact, overlay } = options ?? {}
  if (compact) return 'px-3 py-3'
  if (overlay) return 'px-5 py-5'
  return 'px-4 py-4'
}

export function settingsSectionClass(compact?: boolean) {
  const py = compact ? 'py-4' : 'py-6'
  return `scroll-mt-3 ${SETTINGS_SECTION_BLOCK_CLASS} ${py}`
}

/** Bordered help row under Account: Contact us + FAQ. */
export const SETTINGS_ACCOUNT_HELP_CLASS =
  'mt-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-xl border border-default bg-default/40 px-4 py-3 text-center text-sm text-muted'

/** Pro badge + status copy readable on light and dark themes. */
export const PRO_BADGE_CLASS =
  'bg-amber-500/15 text-amber-900 ring-amber-600/40 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/80'

export const PRO_BADGE_ICON_CLASS = 'text-amber-700 dark:text-amber-300'

export const PRO_STATUS_TEXT_CLASS = 'text-amber-800/90 dark:text-amber-100/80'

export const PRO_LOCK_PANEL_CLASS =
  'rounded-3xl border border-amber-600/35 bg-amber-500/10 p-4 dark:border-amber-900/50 dark:bg-amber-950/20'

export const PRO_LOCK_TITLE_CLASS = 'font-semibold text-amber-900 dark:text-amber-100'

export const PRO_LOCK_BODY_CLASS = 'mt-1 text-sm leading-6 text-amber-800/90 dark:text-amber-50/90'

export const PRO_LOCK_LINK_CLASS =
  'mt-3 block text-xs font-semibold text-amber-800/90 underline-offset-2 hover:underline dark:text-amber-100/80'
