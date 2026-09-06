import type { SeverityGuidance, SeverityQuickPreset } from './severityGuidance'

export type SupporterImpactPreset = {
  label: string
  value: string
}

export const supporterSeverityGuidanceByLevel: SeverityGuidance[] = [
  {
    title: 'No impact noticed',
    text: 'They seemed unaffected: I did not see symptoms limit them.'
  },
  {
    title: 'Minimal impact',
    text: 'I noticed symptoms, but they barely changed how they got through the day.'
  },
  {
    title: 'Very mild impact',
    text: 'Symptoms seemed like a small bother, but daily tasks mostly stayed on track.'
  },
  {
    title: 'Mild impact',
    text: 'It looked like their condition got in the way now and then, but they kept going.'
  },
  {
    title: 'Mild to moderate impact',
    text: 'They seemed to slow down, rest, or change plans for part of the day.'
  },
  {
    title: 'Moderate impact',
    text: 'Symptoms appeared to affect them about half the day or clearly cut what they could do.'
  },
  {
    title: 'Moderate to significant impact',
    text: 'It looked like symptoms shaped much of the day: skipping tasks, leaving early, or needing extra rest.'
  },
  {
    title: 'Significant impact',
    text: 'They seemed unable to function normally for most of the day.'
  },
  {
    title: 'Severe impact',
    text: 'Daily tasks looked very hard: frequent breaks, help, or major adjustments were needed.'
  },
  {
    title: 'Very severe impact',
    text: 'They appeared to struggle with basic routines for most of the day.'
  },
  {
    title: 'Debilitating impact',
    text: 'Symptoms seemed to largely shut down their day: little to no normal function that I saw.'
  }
]

export function getSupporterSeverityGuidance(value: number): SeverityGuidance {
  const level = Math.min(10, Math.max(0, Math.round(value)))
  return supporterSeverityGuidanceByLevel[level] ?? supporterSeverityGuidanceByLevel[5]
}

export const supporterSeverityQuickPresets: SeverityQuickPreset[] = [
  { label: 'Barely noticed', value: 1 },
  { label: 'Seemed manageable', value: 3 },
  { label: 'About half the day', value: 5 },
  { label: 'Most of the day', value: 7 },
  { label: 'Worst I have seen', value: 9 }
]

export const supporterImpactPresets: SupporterImpactPreset[] = [
  { label: 'Missed work', value: 'They missed work' },
  { label: 'Left early', value: 'They left work early' },
  { label: 'Called out', value: 'They called out of work' },
  { label: 'Poor sleep', value: 'They had poor sleep' },
  { label: 'Cancelled plans', value: 'They cancelled plans' },
  { label: 'Stayed home', value: 'They could not leave home' },
  { label: 'Skipped chores', value: 'They skipped chores or self-care' },
  { label: 'Avoided people', value: 'They avoided people or social plans' },
  { label: 'Hard to focus', value: 'They had trouble focusing or finishing tasks' },
  { label: 'Needed help', value: 'They needed help with daily tasks' }
]

function splitImpactValues(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function supporterImpactPresetIsSelected(currentValue: string | undefined, presetValue: string) {
  if (!currentValue?.trim()) {
    return false
  }

  const normalizedPreset = presetValue.trim().toLowerCase()
  return splitImpactValues(currentValue).some((part) => part.toLowerCase() === normalizedPreset)
}

export function toggleSupporterImpactPreset(currentValue: string | undefined, presetValue: string) {
  const parts = splitImpactValues(currentValue || '')
  const normalizedPreset = presetValue.trim().toLowerCase()
  const existingIndex = parts.findIndex((part) => part.toLowerCase() === normalizedPreset)

  if (existingIndex >= 0) {
    parts.splice(existingIndex, 1)
  } else {
    parts.push(presetValue.trim())
  }

  return parts.join(', ')
}
