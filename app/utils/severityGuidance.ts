export type SeverityGuidance = {
  title: string
  text: string
}

export const severityGuidanceByLevel: SeverityGuidance[] = [
  {
    title: 'No impact',
    text: 'Your condition is not really limiting you or others right now.'
  },
  {
    title: 'Minimal impact',
    text: 'You had symptoms, but they barely changed how you functioned today.'
  },
  {
    title: 'Very mild impact',
    text: 'Symptoms were a small bother, but daily tasks stayed mostly on track.'
  },
  {
    title: 'Mild impact',
    text: 'Your condition got in the way now and then, but you kept going.'
  },
  {
    title: 'Mild to moderate impact',
    text: 'Symptoms made you slow down, rest, or change plans more than usual.'
  },
  {
    title: 'Moderate impact',
    text: 'Your condition clearly limited what you could do: slower pace, rest, or changed plans.'
  },
  {
    title: 'Moderate to significant impact',
    text: 'Symptoms shaped much of what you could do: skipping tasks, leaving early, or needing extra rest.'
  },
  {
    title: 'Significant impact',
    text: 'Normal function was hard: many tasks were skipped, cut short, or needed help.'
  },
  {
    title: 'Severe impact',
    text: 'Daily tasks were very hard today: frequent breaks, help, or major adjustments were needed.'
  },
  {
    title: 'Very severe impact',
    text: 'Basic routines were a serious struggle today.'
  },
  {
    title: 'Debilitating impact',
    text: 'Symptoms largely shut down your day: little to no normal function.'
  }
]

export function getSeverityGuidance(value: number): SeverityGuidance {
  const level = Math.min(10, Math.max(0, Math.round(value)))
  return severityGuidanceByLevel[level] ?? severityGuidanceByLevel[5]
}

export function getSeverityEmoji(value: number) {
  const level = Math.min(10, Math.max(0, Math.round(value)))

  if (level >= 9) {
    return '😫'
  }

  if (level >= 7) {
    return '😣'
  }

  if (level >= 5) {
    return '😐'
  }

  if (level >= 3) {
    return '🙂'
  }

  return '😊'
}

export type SeverityQuickPreset = {
  label: string
  value: number
}

export const severityQuickPresets: SeverityQuickPreset[] = [
  { label: 'Barely noticed', value: 1 },
  { label: 'Manageable', value: 3 },
  { label: 'Moderate impact', value: 5 },
  { label: 'Significant impact', value: 7 },
  { label: 'Worst lately', value: 9 }
]
