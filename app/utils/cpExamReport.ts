import { normalizeConditionLabel } from './conditionCatalog'

type CpExamEntry = {
  condition_label: string
  severity?: number | null
  occurred_at?: string | null
  created_at?: string | null
  impact?: string | null
  summary?: string | null
  details?: Record<string, unknown> | null
}

export type CpExamConditionSummary = {
  conditionLabel: string
  entryCount: number
  trackingSpanLabel: string
  trackingWeeks: number
  overallAvgPerWeek: number
  overallFrequencyLabel: string
  recentAvgPerWeek: number
  recentFrequencyLabel: string
  avgSeverity: number
  peakSeverity: number
  severityLabel: string
  functionalImpacts: string[]
  reportedNotes: string[]
  recentWeeklyCounts: Array<{ label: string, count: number }>
  talkingPoint: string
}

const RECENT_WINDOW_DAYS = 90
const IMPACT_DETAIL_KEYS = [
  'functional_impact',
  'had_to_stop_activity',
  'kept_you_from_sleeping',
  'night_symptoms',
  'movement_limit',
  'sleep_interruption'
] as const

function getEntryDate(entry: CpExamEntry) {
  return new Date(entry.occurred_at || entry.created_at || 0)
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime())
}

function formatFrequencyLabel(avgPerWeek: number) {
  if (avgPerWeek <= 0) {
    return 'no logged episodes in this period'
  }

  if (avgPerWeek < 0.75) {
    return 'less than once per week'
  }

  if (avgPerWeek < 1.25) {
    return 'about once per week'
  }

  const rounded = Math.round(avgPerWeek)
  const low = Math.max(1, Math.floor(avgPerWeek))
  const high = Math.ceil(avgPerWeek)

  if (high - low <= 1) {
    return `about ${rounded} times per week`
  }

  return `about ${low}–${high} times per week`
}

function formatSeverityLabel(avgSeverity: number, peakSeverity: number) {
  const avg = Math.round(avgSeverity * 10) / 10

  if (peakSeverity <= avg) {
    return `typically around ${avg}/10`
  }

  return `typically around ${avg}/10, sometimes up to ${peakSeverity}/10`
}

function parseImpactTokens(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
}

function collectFunctionalImpacts(entries: CpExamEntry[]) {
  const impactCounts = new Map<string, number>()

  for (const entry of entries) {
    for (const token of parseImpactTokens(String(entry.impact || ''))) {
      impactCounts.set(token, (impactCounts.get(token) || 0) + 1)
    }

    const details = entry.details || {}
    for (const key of IMPACT_DETAIL_KEYS) {
      const value = details[key]
      if (typeof value !== 'string' || !value.trim()) {
        continue
      }

      const label = value.trim().charAt(0).toUpperCase() + value.trim().slice(1)
      impactCounts.set(label, (impactCounts.get(label) || 0) + 1)
    }
  }

  return [...impactCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label]) => label)
}

function buildRecentWeeklyCounts(entries: CpExamEntry[], referenceDate = new Date()) {
  const weeks: Array<{ label: string, count: number, start: Date }> = []

  for (let index = 3; index >= 0; index -= 1) {
    const end = new Date(referenceDate)
    end.setHours(23, 59, 59, 999)
    end.setDate(end.getDate() - index * 7)

    const start = new Date(end)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 6)

    const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks.push({ label, count: 0, start })
  }

  for (const entry of entries) {
    const entryDate = getEntryDate(entry)
    if (!isValidDate(entryDate)) {
      continue
    }

    for (const week of weeks) {
      const weekEnd = new Date(week.start)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      if (entryDate >= week.start && entryDate <= weekEnd) {
        week.count += 1
        break
      }
    }
  }

  return weeks.map(({ label, count }) => ({ label, count }))
}

function buildTrackingSpan(entries: CpExamEntry[]) {
  const dates = entries
    .map((entry) => getEntryDate(entry))
    .filter(isValidDate)
    .sort((left, right) => left.getTime() - right.getTime())

  if (!dates.length) {
    return { trackingSpanLabel: 'N/A', trackingWeeks: 1 }
  }

  const first = dates[0]
  const last = dates[dates.length - 1]
  const trackingDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1)
  const trackingWeeks = Math.max(1, trackingDays / 7)

  const sameYear = first.getFullYear() === last.getFullYear()
  const firstLabel = first.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' })
  })
  const lastLabel = last.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return {
    trackingSpanLabel: `${firstLabel} – ${lastLabel}`,
    trackingWeeks
  }
}

function collectReportedNotes(entries: CpExamEntry[]) {
  const notes: string[] = []
  const seen = new Set<string>()
  const sorted = [...entries].sort((left, right) => getEntryDate(right).getTime() - getEntryDate(left).getTime())

  for (const entry of sorted) {
    for (const candidate of [entry.summary?.trim(), entry.impact?.trim()]) {
      if (!candidate) {
        continue
      }

      const key = candidate.toLowerCase()
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      notes.push(candidate)

      if (notes.length >= 5) {
        return notes
      }
    }
  }

  return notes
}

function timesPerMonthLabel(avgPerWeek: number) {
  if (avgPerWeek <= 0) {
    return 'no logged episodes in this period'
  }

  const perMonth = avgPerWeek * (52 / 12)
  const rounded = Math.round(perMonth)

  if (rounded <= 1) {
    return 'about once a month'
  }

  if (rounded === 2) {
    return 'about twice a month'
  }

  return `about ${rounded} times a month`
}

function episodeNoun(conditionLabel: string) {
  const label = conditionLabel.toLowerCase()

  if (/ptsd|anxiety|depression|mental|panic/.test(label)) {
    return 'episodes'
  }

  if (/migraine|headache/.test(label)) {
    return 'headache days'
  }

  if (/gerd|ibs|digestive|diarrhea|constipation|reflux/.test(label)) {
    return 'flare-ups'
  }

  if (/sleep|apnea|insomnia/.test(label)) {
    return 'sleep issues'
  }

  return 'symptom episodes'
}

function joinNatural(items: string[]) {
  if (!items.length) {
    return ''
  }

  if (items.length === 1) {
    return items[0]
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }

  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

function softenImpactForSpeech(impact: string) {
  const normalized = impact.trim()
  const map: Record<string, string> = {
    'No - kept going': 'keep up your normal pace',
    'Slowed down but continued': 'move at your normal pace',
    'Yes - had to rest or lie down': 'rest or get through the day',
    'Yes - left work or stopped activity': 'stay at work or finish activities',
    'Yes - cancelled plans or errands': 'keep plans or run errands',
    'Sleep was mostly OK': 'get useful sleep',
    'Woke up several times': 'sleep through the night',
    'Hard to fall asleep': 'fall asleep',
    'Barely slept': 'get useful sleep',
    'No useful rest': 'get useful rest',
    'Panic': 'feel calm in everyday situations',
    'Nightmare': 'sleep without nightmares',
    'Flashback': 'stay grounded in the present',
    'Isolation': 'stay engaged with people',
    'Irritability': 'stay patient with others',
    'Suicidal thoughts': 'feel safe and stable',
    'Nightmares': 'sleep without nightmares',
    'Flashbacks': 'stay grounded in the present',
    'Hypervigilance': 'relax in normal settings',
    'Avoidance': 'go places or do activities you avoid',
    'Heartburn': 'eat comfortably',
    'Regurgitation': 'eat without reflux symptoms',
    'Trouble swallowing': 'swallow comfortably',
    'Pain when swallowing': 'swallow without pain',
    'Nausea or vomiting': 'keep food down',
    'Abdominal pain': 'get through the day without abdominal pain',
    'Constipation': 'stay regular',
    'Diarrhea': 'leave the house without urgency',
    'Stiffness': 'move comfortably',
    'Limited range of motion': 'move the way you need to',
    'Joint instability': 'trust the joint during activity',
    'Radiating pain': 'move without radiating pain',
    'Numbness': 'feel the affected area normally',
    'Tingling': 'go through the day without tingling',
    'Burning pain': 'get through daily tasks',
    'Weakness': 'rely on normal strength',
    'Near fall or fall': 'move safely',
    'Prostrating attack': 'function during headache days',
    'Light sensitivity': 'tolerate light',
    'Sound sensitivity': 'tolerate noise'
  }

  return map[normalized] ?? normalized.charAt(0).toLowerCase() + normalized.slice(1)
}

export function buildCpExamTalkingPoint(summary: Pick<
  CpExamConditionSummary,
  | 'conditionLabel'
  | 'entryCount'
  | 'trackingSpanLabel'
  | 'recentAvgPerWeek'
  | 'recentFrequencyLabel'
  | 'avgSeverity'
  | 'severityLabel'
  | 'functionalImpacts'
  | 'reportedNotes'
>) {
  if (summary.entryCount <= 0) {
    return 'No logged entries yet for this condition.'
  }

  const sentences: string[] = []
  const episodes = episodeNoun(summary.conditionLabel)
  const monthlyFrequency = timesPerMonthLabel(summary.recentAvgPerWeek)

  sentences.push(
    `Based on your symptom logs (${summary.trackingSpanLabel}), you reported ${summary.conditionLabel}-related ${episodes} ${monthlyFrequency} recently (${summary.recentFrequencyLabel}).`
  )

  if (summary.functionalImpacts.length) {
    const impacts = summary.functionalImpacts
      .slice(0, 3)
      .map(softenImpactForSpeech)

    sentences.push(
      `Your entries often note that this makes it hard to ${joinNatural(impacts)}.`
    )
  }

  if (summary.entryCount >= 3 && summary.avgSeverity > 0) {
    sentences.push(
      `When you logged episodes, severity was ${summary.severityLabel}.`
    )
  }

  if (summary.reportedNotes[0]) {
    sentences.push(`You also wrote: "${summary.reportedNotes[0]}"`)
  }

  sentences.push('Use your own words at the exam; only describe what is still true for you.')

  return sentences.join(' ')
}

export function buildCpExamSummaries(entries: CpExamEntry[]): CpExamConditionSummary[] {
  const byCondition = new Map<string, CpExamEntry[]>()

  for (const entry of entries) {
    const label = normalizeConditionLabel(entry.condition_label)
    const bucket = byCondition.get(label) || []
    bucket.push(entry)
    byCondition.set(label, bucket)
  }

  const now = new Date()
  const recentCutoff = new Date(now)
  recentCutoff.setDate(recentCutoff.getDate() - RECENT_WINDOW_DAYS)

  return [...byCondition.entries()]
    .map(([conditionLabel, conditionEntries]) => {
      const validEntries = conditionEntries.filter((entry) => isValidDate(getEntryDate(entry)))
      const recentEntries = validEntries.filter((entry) => getEntryDate(entry) >= recentCutoff)
      const { trackingSpanLabel, trackingWeeks } = buildTrackingSpan(validEntries)

      const recentWeeks = Math.max(1, RECENT_WINDOW_DAYS / 7)
      const overallAvgPerWeek = validEntries.length / trackingWeeks
      const recentAvgPerWeek = recentEntries.length / recentWeeks

      const severities = validEntries.map((entry) => entry.severity ?? 0)
      const avgSeverity = severities.reduce((sum, value) => sum + value, 0) / Math.max(severities.length, 1)
      const peakSeverity = Math.max(...severities, 0)

      const functionalImpacts = collectFunctionalImpacts(validEntries)
      const recentFrequencyLabel = formatFrequencyLabel(recentAvgPerWeek)
      const overallFrequencyLabel = formatFrequencyLabel(overallAvgPerWeek)
      const severityLabel = formatSeverityLabel(avgSeverity, peakSeverity)

      const summary: CpExamConditionSummary = {
        conditionLabel,
        entryCount: validEntries.length,
        trackingSpanLabel,
        trackingWeeks,
        overallAvgPerWeek,
        overallFrequencyLabel,
        recentAvgPerWeek,
        recentFrequencyLabel,
        avgSeverity,
        peakSeverity,
        severityLabel,
        functionalImpacts,
        reportedNotes: collectReportedNotes(validEntries),
        recentWeeklyCounts: buildRecentWeeklyCounts(validEntries, now),
        talkingPoint: ''
      }

      summary.talkingPoint = buildCpExamTalkingPoint(summary)

      return summary
    })
    .sort((left, right) => right.entryCount - left.entryCount)
}

export function buildCpExamReportTitle(conditionLabel: string | null | undefined) {
  return conditionLabel
    ? `Personal Review Summary: ${conditionLabel}`
    : 'Personal Review Summary'
}
