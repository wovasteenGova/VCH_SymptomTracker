import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldShowVueAppSplash } from '../app/utils/trackerSplash.ts'

test('Vue splash stays off on first load even if the HTML tank is missing', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: false,
    allowVueFallback: false,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), false)
})

test('Vue splash stays off when the HTML tank is already on screen', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: true,
    splashDismissed: false,
    allowVueFallback: true,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), false)
})

test('Vue splash is allowed only after an explicit retry fallback', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: false,
    allowVueFallback: true,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), true)
})

test('Vue splash does not replay after bootstrap already dismissed it', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: true,
    allowVueFallback: true,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), false)
})

test('Vue splash stays off after the boot splash has already been locked off', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: false,
    allowVueFallback: true,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true,
    bootSplashLockedOff: true
  }), false)
})

test('home splash hides once the workspace is ready', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: false,
    allowVueFallback: true,
    isHomeRoute: true,
    homeWorkspaceReady: true,
    nonHomeSplashVisible: true
  }), false)
})
