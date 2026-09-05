import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  TRACKER_LOADER_SENTENCES,
  pickTrackerLoaderSentence
} from '../app/utils/trackerLoaderCopy.ts'

const spaTemplate = readFileSync('app/spa-loading-template.html', 'utf8')

describe('tracker loader copy', () => {
  it('keeps a small editable sentence pool', () => {
    expect(TRACKER_LOADER_SENTENCES.length).toBeGreaterThanOrEqual(3)
    expect(TRACKER_LOADER_SENTENCES.length).toBeLessThanOrEqual(5)
    expect(TRACKER_LOADER_SENTENCES).toContain('Loading your symptom tracker…')
    expect(TRACKER_LOADER_SENTENCES).toContain('Pulling your logs together…')
    expect(TRACKER_LOADER_SENTENCES).toContain('Almost ready. Preparing Tracker…')
    expect(TRACKER_LOADER_SENTENCES).toContain('Getting your claim day tracking ready…')
    expect(TRACKER_LOADER_SENTENCES).toContain("We don't sell your data.")
    expect(TRACKER_LOADER_SENTENCES.join(' ')).not.toMatch(/never share/i)

    for (const sentence of TRACKER_LOADER_SENTENCES) {
      expect(sentence).not.toContain('—')
      expect(sentence.length).toBeGreaterThan(0)
    }
  })

  it('picks one stable sentence from the pool for a given random value', () => {
    expect(pickTrackerLoaderSentence(() => 0)).toBe(TRACKER_LOADER_SENTENCES[0])
    expect(pickTrackerLoaderSentence(() => 0.99)).toBe(TRACKER_LOADER_SENTENCES[TRACKER_LOADER_SENTENCES.length - 1])
    expect(pickTrackerLoaderSentence(() => 0.5)).toBe(
      TRACKER_LOADER_SENTENCES[Math.floor(0.5 * TRACKER_LOADER_SENTENCES.length)]
    )
    expect(TRACKER_LOADER_SENTENCES).toContain(pickTrackerLoaderSentence())
  })

  it('keeps the first-paint splash sentence list in sync', () => {
    const match = spaTemplate.match(/var sentences = \[([\s\S]*?)\]/)
    expect(match).toBeTruthy()
    const embedded = [...(match?.[1].matchAll(/"([^"]*)"/g) ?? [])].map((item) => item[1])
    expect(embedded).toEqual([...TRACKER_LOADER_SENTENCES])
  })
})
