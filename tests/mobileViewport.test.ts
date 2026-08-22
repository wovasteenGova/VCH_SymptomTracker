import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  isIosWebKitBrowser,
  resolveMobileViewport
} from '../app/utils/mobileViewport.ts'

test('recognizes iPhone Chrome as iOS WebKit without changing Android', () => {
  assert.equal(isIosWebKitBrowser({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) CriOS/140.0 Mobile/15E148'
  }), true)
  assert.equal(isIosWebKitBrowser({
    userAgent: 'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/143.0.0.0',
    platform: 'Linux armv8l',
    maxTouchPoints: 5
  }), false)
})

test('keeps the iPhone keyboard open when focus panning consumes the layout inset', () => {
  const viewport = resolveMobileViewport({
    layoutHeight: 844,
    visualHeight: 430,
    visualOffsetTop: 360,
    visualBaselineHeight: 780,
    editableFocused: true
  })

  assert.equal(viewport.keyboardOpen, true)
  assert.equal(viewport.offsetTop, 360)
  assert.equal(viewport.height, 430)
  assert.equal(viewport.keyboardInset, 414)
})

test('does not treat browser toolbar movement as a keyboard without an editable focus', () => {
  assert.deepEqual(resolveMobileViewport({
    layoutHeight: 844,
    visualHeight: 700,
    visualOffsetTop: 60,
    visualBaselineHeight: 780,
    editableFocused: false
  }), {
    height: 700,
    offsetTop: 60,
    keyboardInset: 0,
    keyboardOpen: false
  })
})
