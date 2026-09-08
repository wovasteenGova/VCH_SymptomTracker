import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  isTrackedConditionsHydrating,
  resolveHomeConditionsView
} from '../app/utils/homeConditionsPanel.ts'

describe('tracked conditions hydration', () => {
  it('treats the initial login race as hydrating, not loaded', () => {
    expect(isTrackedConditionsHydrating({
      isDemoMode: false,
      isAuthLoading: true,
      isLoading: false,
      hasLoaded: false,
      userId: null,
      loadedOwnerId: null,
      trackedKeyCount: 0
    })).toBe(true)

    expect(isTrackedConditionsHydrating({
      isDemoMode: false,
      isAuthLoading: false,
      isLoading: true,
      hasLoaded: false,
      userId: 'user-1',
      loadedOwnerId: null,
      trackedKeyCount: 0
    })).toBe(true)
  })

  it('keeps hydrating when a guest cache is still showing after sign-in', () => {
    expect(isTrackedConditionsHydrating({
      isDemoMode: false,
      isAuthLoading: false,
      isLoading: false,
      hasLoaded: true,
      userId: 'user-1',
      loadedOwnerId: null,
      trackedKeyCount: 0
    })).toBe(true)
  })

  it('is settled for a signed-in user whose conditions already loaded', () => {
    expect(isTrackedConditionsHydrating({
      isDemoMode: false,
      isAuthLoading: false,
      isLoading: false,
      hasLoaded: true,
      userId: 'user-1',
      loadedOwnerId: 'user-1',
      trackedKeyCount: 2
    })).toBe(false)
  })

  it('is settled when a new account loaded with zero conditions', () => {
    expect(isTrackedConditionsHydrating({
      isDemoMode: false,
      isAuthLoading: false,
      isLoading: false,
      hasLoaded: true,
      userId: 'user-1',
      loadedOwnerId: 'user-1',
      trackedKeyCount: 0
    })).toBe(false)
  })

  it('lets cached conditions for the current user render during a refresh', () => {
    expect(isTrackedConditionsHydrating({
      isDemoMode: false,
      isAuthLoading: false,
      isLoading: true,
      hasLoaded: true,
      userId: 'user-1',
      loadedOwnerId: 'user-1',
      trackedKeyCount: 3
    })).toBe(false)
  })
})

describe('home conditions view', () => {
  it('does not show the error panel while conditions are still hydrating', () => {
    expect(resolveHomeConditionsView({
      showConditionBrowser: false,
      isHydrating: true,
      loadError: '',
      conditionsCount: 0
    })).toBe('loading')

    expect(resolveHomeConditionsView({
      showConditionBrowser: false,
      isHydrating: true,
      loadError: 'Could not load your conditions.',
      conditionsCount: 0
    })).toBe('loading')
  })

  it('shows the error panel only after a failed fetch with no conditions', () => {
    expect(resolveHomeConditionsView({
      showConditionBrowser: false,
      isHydrating: false,
      loadError: 'Could not load your conditions.',
      conditionsCount: 0
    })).toBe('error')
  })

  it('shows the carousel once conditions are available', () => {
    expect(resolveHomeConditionsView({
      showConditionBrowser: false,
      isHydrating: false,
      loadError: '',
      conditionsCount: 2
    })).toBe('carousel')
  })

  it('shows the condition browser for empty settled state, not an error', () => {
    expect(resolveHomeConditionsView({
      showConditionBrowser: true,
      isHydrating: false,
      loadError: '',
      conditionsCount: 0
    })).toBe('browser')
  })
})

describe('home workspace template', () => {
  const index = readFileSync('app/pages/index.vue', 'utf8')

  it('does not use the catch-all unexpected-state error during empty loads', () => {
    expect(index).toContain('homeConditionsView === \'loading\'')
    expect(index).toContain('homeConditionsView === \'error\'')
    expect(index).not.toContain("Something didn't load right")
    expect(index).toContain('Loading your conditions.')
    expect(index).toContain('isHydrating: isHydratingTrackedConditions')
  })
})
