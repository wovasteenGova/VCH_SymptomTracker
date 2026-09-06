/** Semantic class tokens for tracker panels: follow active color theme. */

export function trackerDesktopPanelClass() {
  return [
    'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-default',
    'bg-elevated shadow-lg shadow-black/5 ring-1 ring-black/[0.03]',
    'dark:shadow-black/20 dark:ring-white/[0.04]'
  ].join(' ')
}

export const td = {
  panelHeader: 'shrink-0 border-b border-default px-4 py-4',
  panelHeaderSm: 'shrink-0 border-b border-default px-4 py-3',
  tabRail: 'rounded-full bg-muted p-1',
  tabActive: 'rounded-full bg-elevated px-3 py-2.5 text-sm font-semibold text-highlighted shadow-sm transition',
  tabInactive: 'rounded-full px-3 py-2.5 text-sm font-semibold text-muted transition',
  titleLg: 'text-xl font-bold text-highlighted',
  titleBase: 'text-lg font-bold text-highlighted',
  titleXl: 'text-xl font-bold text-highlighted',
  title2xl: 'text-2xl font-bold text-highlighted',
  body: 'text-sm leading-6 text-toned',
  caption: 'text-xs font-bold uppercase tracking-[0.14em] text-muted',
  captionWide: 'text-xs font-semibold uppercase tracking-[0.18em] text-muted',
  meta: 'text-sm text-muted',
  primaryBtn: 'rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50',
  primaryBtnLg: 'inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50',
  primaryBtnBlock: 'flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50',
  chipActive: 'rounded-full bg-primary px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:opacity-90',
  chipInactive: 'rounded-full bg-muted px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-toned ring-1 ring-default transition hover:bg-accented',
  insetCard: 'rounded-2xl border border-default bg-muted/40 p-4',
  tipCard: 'rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 dark:border-primary/30 dark:bg-primary/10',
  tipCaption: 'text-xs font-bold uppercase tracking-[0.14em] text-primary',
  tipLink: 'text-xs font-bold text-primary underline decoration-primary/40 underline-offset-2 transition hover:opacity-90',
  rowHover: 'transition hover:bg-accented/40',
  rowSelected: 'bg-accented ring-1 ring-primary/35',
  divider: 'border-t border-default',
  dividerPt: 'shrink-0 border-t border-default pt-4',
  link: 'font-semibold text-primary underline-offset-2 hover:underline',
  iconMuted: 'text-muted',
  conditionRowGoIcon: 'i-lucide-chevron-right',
  dateBadge: 'grid size-14 shrink-0 place-items-center rounded-2xl bg-muted text-center',
  ghostBtn: 'rounded-full px-3 py-2 text-sm font-semibold text-toned transition hover:bg-accented',
  secondaryBtn: 'rounded-2xl bg-muted px-4 py-3 text-sm font-bold text-highlighted transition hover:bg-accented',
  imageRing: 'ring-1 ring-default',
  sheetPanel: 'flex min-h-0 flex-col overflow-hidden rounded-t-[1.75rem] border-t border-default/80 bg-elevated',
  overlayBackdrop: 'bg-black/55'
} as const
