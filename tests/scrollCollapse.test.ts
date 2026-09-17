import { describe, expect, it } from 'vitest'
import {
  ACCUMULATED_HEADER_COLLAPSE_DEFAULTS,
  resolveAccumulatedHeaderCollapse
} from '../app/utils/scrollCollapse'

describe('accumulated header collapse', () => {
  it('hides intro chrome after a short downward run and shows it at the top', () => {
    let state = resolveAccumulatedHeaderCollapse({
      compact: false,
      scrollTop: ACCUMULATED_HEADER_COLLAPSE_DEFAULTS.compactThreshold + 20,
      lastScrollTop: 0,
      scrollDownAccum: 0,
      nowMs: 1000
    })

    for (let i = 0; i < 4; i++) {
      state = resolveAccumulatedHeaderCollapse({
        compact: state.compact,
        scrollTop: state.lastScrollTop + 16,
        lastScrollTop: state.lastScrollTop,
        scrollDownAccum: state.scrollDownAccum,
        scrollUpAccum: state.scrollUpAccum,
        nowMs: 1000
      })
    }

    expect(state.compact).toBe(true)

    const expanded = resolveAccumulatedHeaderCollapse({
      compact: state.compact,
      scrollTop: ACCUMULATED_HEADER_COLLAPSE_DEFAULTS.topReveal,
      lastScrollTop: state.lastScrollTop,
      scrollDownAccum: state.scrollDownAccum,
      scrollUpAccum: state.scrollUpAccum,
      nowMs: 1000
    })

    expect(expanded.compact).toBe(false)
  })

  it('shows intro chrome again when the user scrolls up mid-list', () => {
    const hidden = resolveAccumulatedHeaderCollapse({
      compact: true,
      scrollTop: 180,
      lastScrollTop: 200,
      scrollDownAccum: 0,
      scrollUpAccum: 0,
      revealOnUpward: true,
      nowMs: 1000
    })

    const shown = resolveAccumulatedHeaderCollapse({
      compact: hidden.compact,
      scrollTop: hidden.lastScrollTop - 20,
      lastScrollTop: hidden.lastScrollTop,
      scrollDownAccum: hidden.scrollDownAccum,
      scrollUpAccum: hidden.scrollUpAccum,
      revealOnUpward: true,
      nowMs: 1000
    })

    expect(shown.compact).toBe(false)
  })
})
