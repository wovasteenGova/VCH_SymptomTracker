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
