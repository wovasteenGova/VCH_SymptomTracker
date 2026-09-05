/**
 * Captions for the branded tank loader / first-paint splash.
 * Edit this list to change what users see. One sentence is picked per load.
 */

export const TRACKER_LOADER_SENTENCES = [
  'Loading your symptom tracker…',
  'Pulling your logs together…',
  'Almost ready. Preparing Tracker…',
  'Getting your claim day tracking ready…',
  "We don't sell your data."
] as const

export type TrackerLoaderSentence = (typeof TRACKER_LOADER_SENTENCES)[number]

export function pickTrackerLoaderSentence(random: () => number = Math.random): string {
  const count = TRACKER_LOADER_SENTENCES.length
  const index = Math.min(count - 1, Math.max(0, Math.floor(random() * count)))
  return TRACKER_LOADER_SENTENCES[index] ?? TRACKER_LOADER_SENTENCES[0]
}
