import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  PWA_DISMISSAL_TTL_MS,
  pwaDismissalIsActive,
  resolvePwaInstallPlatform,
  shouldOfferPwaPromotion
} from '../app/utils/pwaInstall.ts'

test('detects supported install platforms, including iPad desktop mode', () => {
  assert.equal(resolvePwaInstallPlatform({
    userAgent: 'Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/143.0.0.0'
  }), 'android')
  assert.equal(resolvePwaInstallPlatform({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) Version/19.0 Mobile/15E148 Safari/604.1'
  }), 'ios-safari')
  assert.equal(resolvePwaInstallPlatform({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) CriOS/143.0 Mobile/15E148 Safari/604.1'
  }), 'ios-other')
  assert.equal(resolvePwaInstallPlatform({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/19.0 Safari/605.1.15',
    platform: 'MacIntel',
    maxTouchPoints: 5
  }), 'ios-safari')
  assert.equal(resolvePwaInstallPlatform({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/143.0.0.0'
  }), 'desktop')
})

test('offers the contextual promotion only after signed-in onboarding and engagement', () => {
  const base = {
    signedIn: true,
    inApp: true,
    onboardingComplete: true,
    engaged: true,
    installPromptAvailable: true,
    platform: 'desktop' as const,
    standalone: false
  }

  assert.equal(shouldOfferPwaPromotion(base), true)
  assert.equal(shouldOfferPwaPromotion({ ...base, signedIn: false }), false)
  assert.equal(shouldOfferPwaPromotion({ ...base, onboardingComplete: false }), false)
  assert.equal(shouldOfferPwaPromotion({ ...base, engaged: false }), false)
  assert.equal(shouldOfferPwaPromotion({ ...base, standalone: true }), false)
  assert.equal(shouldOfferPwaPromotion({
    ...base,
    installPromptAvailable: false,
    platform: 'android'
  }), false)
  assert.equal(shouldOfferPwaPromotion({
    ...base,
    installPromptAvailable: false,
    platform: 'ios-safari'
  }), true)
})

test('honors and expires the not-now cooldown', () => {
  const now = Date.now()
  assert.equal(pwaDismissalIsActive(now - 1_000, now), true)
  assert.equal(pwaDismissalIsActive(now - PWA_DISMISSAL_TTL_MS, now), false)
  assert.equal(pwaDismissalIsActive(null, now), false)

  assert.equal(shouldOfferPwaPromotion({
    signedIn: true,
    inApp: true,
    onboardingComplete: true,
    engaged: true,
    installPromptAvailable: true,
    platform: 'desktop',
    standalone: false,
    dismissedAt: now - 1_000,
    now
  }), false)
})
