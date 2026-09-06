/** Shared Chart.js label/grid colors: follow active workspace theme. */
function readThemeColor(variable: string, fallback: string) {
  if (!import.meta.client) {
    return fallback
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value || fallback
}

export function resolveChartUiTheme(isDark: boolean) {
  const text = readThemeColor('--ui-text-highlighted', isDark ? '#f5f1eb' : '#1a1612')
  const muted = readThemeColor('--ui-text-muted', isDark ? '#b0b5a4' : '#6b6258')

  return {
    grid: hexToRgba(muted, isDark ? 0.28 : 0.22),
    text,
    tooltipBackground: readThemeColor('--ui-bg-elevated', isDark ? '#222520' : '#faf9f5'),
    tooltipBorder: readThemeColor('--ui-border-muted', isDark ? '#32352e' : '#ddd9ce')
  }
}

export type SymptomChartColors = {
  primary: string
  primarySoft: string
  mild: string
  moderate: string
  severe: string
}

const FALLBACK_CHART_COLORS: SymptomChartColors = {
  primary: '#b08844',
  primarySoft: 'rgba(176, 136, 68, 0.18)',
  mild: '#16a34a',
  moderate: '#a8723f',
  severe: '#b45309'
}

function readCssColor(variable: string, fallback: string) {
  if (!import.meta.client) {
    return fallback
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  return value || fallback
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '').trim()
  if (!normalized) {
    return `rgba(176, 136, 68, ${alpha})`
  }

  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  if (expanded.length !== 6) {
    return `rgba(176, 136, 68, ${alpha})`
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return `rgba(176, 136, 68, ${alpha})`
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/** Reads the active workspace palette so charts match the selected color theme. */
export function resolveSymptomChartColors(): SymptomChartColors {
  const primary = readCssColor('--ui-primary', FALLBACK_CHART_COLORS.primary)
  const moderate = readCssColor('--ui-secondary', FALLBACK_CHART_COLORS.moderate)

  return {
    primary,
    primarySoft: hexToRgba(primary, 0.18),
    mild: FALLBACK_CHART_COLORS.mild,
    moderate,
    severe: FALLBACK_CHART_COLORS.severe
  }
}

export const CHART_LABEL_FONT = {
  family: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
  size: 13
} as const

export const CHART_ROTATED_TICK_LAYOUT = {
  padding: { top: 4, right: 8, bottom: 28, left: 4 }
} as const

export function chartTooltipPlugin(isDark: boolean) {
  const theme = resolveChartUiTheme(isDark)
  return {
    backgroundColor: theme.tooltipBackground,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    titleColor: theme.text,
    bodyColor: theme.text,
    footerColor: theme.text
  }
}

export function chartScaleOptions(isDark: boolean) {
  const theme = resolveChartUiTheme(isDark)
  return {
    grid: { color: theme.grid },
    ticks: { color: theme.text, font: CHART_LABEL_FONT, padding: 6 }
  }
}

export function chartLegendLabels(isDark: boolean) {
  const theme = resolveChartUiTheme(isDark)
  return {
    color: theme.text,
    font: CHART_LABEL_FONT,
    boxWidth: 14,
    padding: 14
  }
}
