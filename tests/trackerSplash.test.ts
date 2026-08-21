import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldShowVueAppSplash } from '../app/utils/trackerSplash.ts'

test('Vue splash stays off when the HTML tank is already on screen', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: true,
    splashDismissed: false,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), false)
})

test('Vue splash is a client-only fallback when the HTML tank is missing', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: false,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), true)
  assert.equal(shouldShowVueAppSplash({
    isClient: false,
    staticSplashPresent: false,
    splashDismissed: false,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), false)
})

test('Vue splash does not replay after bootstrap already dismissed it', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: true,
    isHomeRoute: true,
    homeWorkspaceReady: false,
    nonHomeSplashVisible: true
  }), false)
})

test('home splash hides once the workspace is ready', () => {
  assert.equal(shouldShowVueAppSplash({
    isClient: true,
    staticSplashPresent: false,
    splashDismissed: false,
    isHomeRoute: true,
    homeWorkspaceReady: true,
    nonHomeSplashVisible: true
  }), false)
})
