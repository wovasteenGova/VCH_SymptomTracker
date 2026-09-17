import { ref } from 'vue'
import {
  resolveAccumulatedHeaderCollapse,
  type AccumulatedHeaderCollapseInput
} from '../utils/scrollCollapse'

type AccumulatedScrollHeaderCollapseOptions = Pick<
  AccumulatedHeaderCollapseInput,
  'compactThreshold' | 'topReveal' | 'rehideAccum' | 'revealAccum' | 'revealOnUpward'
>

/**
 * Collapse intro chrome beside a content scroller.
 * Downward scroll hides it. Scrolling back to the top shows it again.
 * Pass revealOnUpward to also show it when the user scrolls up mid-list.
 */
export function useAccumulatedScrollHeaderCollapse(
  options?: AccumulatedScrollHeaderCollapseOptions
) {
  const compact = ref(false)
  let lastScrollTop = 0
  let scrollDownAccum = 0
  let scrollUpAccum = 0
  let userCollapsed = false
  let revealLockedUntilMs = 0

  function applyScrollTop(scrollTop: number) {
    const next = resolveAccumulatedHeaderCollapse({
      compact: compact.value,
      scrollTop,
      lastScrollTop,
      scrollDownAccum,
      scrollUpAccum,
      userCollapsed,
      revealLockedUntilMs,
      nowMs: Date.now(),
      ...options
    })
    compact.value = next.compact
    lastScrollTop = next.lastScrollTop
    scrollDownAccum = next.scrollDownAccum
    scrollUpAccum = next.scrollUpAccum
  }

  function onScroll(event: Event) {
    const target = event.currentTarget as HTMLElement | null
    applyScrollTop(target?.scrollTop ?? 0)
  }

  function setUserCollapsed(next: boolean) {
    userCollapsed = next
    if (!next) {
      revealLockedUntilMs = Date.now() + 1150
      scrollDownAccum = 0
      scrollUpAccum = 0
    }
    applyScrollTop(lastScrollTop)
  }

  function reset() {
    compact.value = false
    lastScrollTop = 0
    scrollDownAccum = 0
    scrollUpAccum = 0
    userCollapsed = false
    revealLockedUntilMs = 0
  }

  return {
    compact,
    onScroll,
    reset,
    setUserCollapsed
  }
}
