/**
 * Shared Teleport overlay layout: full viewport on mobile, centered modal on lg+.
 */

export type MobileOverlayPanelOptions = {
  desktopMaxWidth?: string
  desktopMaxHeight?: string
  desktopHeight?: string
  expanded?: boolean
  desktopRounded?: string
  background?: string
  border?: string
  shadow?: string
  extra?: string
}

const PANEL_DEFAULTS: Required<Omit<MobileOverlayPanelOptions, 'extra'>> & { extra: string } = {
  desktopMaxWidth: 'lg:max-w-2xl',
  desktopMaxHeight: 'lg:max-h-[min(80dvh,48rem)]',
  desktopHeight: '',
  expanded: false,
  desktopRounded: 'lg:rounded-3xl',
  background: 'bg-default',
  border: 'lg:border lg:border-default',
  shadow: 'lg:shadow-2xl',
  extra: ''
}

const OVERLAY_Z_CLASS: Record<string, string> = {
  90: 'z-[90]',
  100: 'z-[100]'
}

function overlayZClass(zIndex: number | string) {
  const key = String(zIndex)
  return OVERLAY_Z_CLASS[key] ?? 'z-[90]'
}

export function mobileOverlayShellClass(
  zIndex: number | string = 90,
  options?: {
    backdropClass?: string
    mobileBackground?: string
  }
) {
  const backdropClass = options?.backdropClass ?? 'lg:bg-black/55'
  const mobileBackground = options?.mobileBackground ?? 'bg-default'
  return [
    'fixed inset-0',
    overlayZClass(zIndex),
    `flex flex-col ${mobileBackground} max-lg:h-dvh`,
    `lg:items-center lg:justify-center ${backdropClass} lg:p-6`
  ].join(' ')
}

/** Centered modal backdrop for desktop-only shells (e.g. settings expand on lg+). */
export function desktopOverlayShellClass(
  zIndex: number | string = 90,
  backdropClass = 'bg-black/55 backdrop-blur-[1px]'
) {
  return [
    'fixed inset-0',
    overlayZClass(zIndex),
    'flex h-full items-center justify-center',
    backdropClass,
    'p-4'
  ].join(' ')
}

export function mobileOverlayPanelClass(options: MobileOverlayPanelOptions = {}) {
  const opts = { ...PANEL_DEFAULTS, ...options }
  return [
    'flex min-h-0 max-lg:flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]',
    'max-lg:rounded-none max-lg:border-0 max-lg:shadow-none',
    opts.desktopMaxHeight,
    opts.expanded ? 'lg:!h-[calc(100dvh-3rem)] lg:!max-h-[calc(100dvh-3rem)]' : opts.desktopHeight,
    'lg:flex-none lg:min-w-0',
    opts.desktopMaxWidth,
    opts.desktopRounded,
    opts.border,
    opts.shadow,
    opts.background,
    opts.extra
  ].filter(Boolean).join(' ')
}
