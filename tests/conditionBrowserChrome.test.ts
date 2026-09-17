import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('condition browser chrome', () => {
  it('collapses the custom-condition help copy while the list scrolls', () => {
    const source = readFileSync('app/components/ConditionBrowser.vue', 'utf8')
    expect(source).toContain('condition-browser-help')
    expect(source).toContain('revealOnUpward: true')
    expect(source).toContain('Tap conditions below or search to add a custom one to your home screen.')
    expect(source).toContain('Not in the list? Type your condition and tap Add to track it on your home screen.')
  })
})

describe('history sheet click-through', () => {
  it('blocks the workspace under the history sheet until the close tap is done', () => {
    const source = readFileSync('app/pages/index.vue', 'utf8')
    expect(source).toContain('historyBlocksWorkspacePointer')
    expect(source).toContain('blurConditionBrowserIfFocused')
    expect(source).toContain("'pointer-events-none': historyBlocksWorkspacePointer")
  })
})
