import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import {
  TRACKER_LOADER_SENTENCES,
  applyTrackerLoaderCaption,
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

  it('writes the caption through textContent on a dedicated node', () => {
    const caption = { textContent: '' }
    const siblingMarkup = '<span class="dots" aria-hidden="true">...</span>'
    applyTrackerLoaderCaption(caption, TRACKER_LOADER_SENTENCES[0])
    expect(caption.textContent).toBe(TRACKER_LOADER_SENTENCES[0])
    expect(caption.textContent).not.toMatch(/class=|aria-hidden|<span/)
    expect(siblingMarkup).toContain('aria-hidden')
  })

  it('does not leak sibling splash markup into the visible caption', () => {
    expect(spaTemplate).toMatch(/<span id="vch-spa-loader-caption"><\/span>/)
    expect(spaTemplate).toContain("caption.textContent = sentence")
    expect(spaTemplate).not.toMatch(/\.innerHTML\s*=/)
    expect(spaTemplate).not.toMatch(/label\.textContent/)

    const script = spaTemplate.match(/<script>([\s\S]*?)<\/script>/)?.[1]
    expect(script).toBeTruthy()

    const caption = { textContent: '' }
    const label = {
      innerHTML: '<span id="vch-spa-loader-caption"></span><span class="dots" aria-hidden="true">...</span>',
      textContent: ''
    }
    const rootAttrs: Record<string, string> = {}
    runInNewContext(script!, {
      Math: { floor: () => 0, random: () => 0 },
      document: {
        getElementById: (id: string) => {
          if (id === 'vch-spa-loader-caption') {
            return caption
          }
          if (id === 'vch-spa-loader-label') {
            return label
          }
          return null
        },
        querySelector: () => ({
          setAttribute: (name: string, value: string) => {
            rootAttrs[name] = value
          }
        })
      }
    })

    expect(caption.textContent).toBe(TRACKER_LOADER_SENTENCES[0])
    expect(caption.textContent).not.toMatch(/class=|aria-hidden|<span|dots/)
    expect(label.innerHTML).toContain('class="dots"')
    expect(label.innerHTML).toContain('aria-hidden')
    expect(label.textContent).toBe('')
    expect(rootAttrs['aria-label']).toBe(TRACKER_LOADER_SENTENCES[0])
  })
})
