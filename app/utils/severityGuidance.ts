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
    text: 'You had to slow down, rest, or change plans for part of the day.'
  },
  {
    title: 'Moderate impact',
    text: 'Your condition affected you about half the day or clearly cut what you could do.'
  },
  {
    title: 'Moderate to significant impact',
    text: 'Symptoms shaped much of your day: skipping tasks, leaving early, or needing extra rest.'
  },
  {
    title: 'Significant impact',
    text: 'Your condition kept you from functioning normally for most of the day.'
  },
  {
    title: 'Severe impact',
    text: 'Daily tasks were very hard today: frequent breaks, help, or major adjustments were needed.'
  },
  {
    title: 'Very severe impact',
    text: 'You struggled to get through basic routines for most of the day.'
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
  { label: 'Half my day', value: 5 },
  { label: 'Most of my day', value: 7 },
  { label: 'Worst lately', value: 9 }
]
