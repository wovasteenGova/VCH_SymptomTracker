import { describe, expect, it } from 'vitest'
import {
  TRACKER_SIGN_IN,
  isAuthSessionMissingError,
  resolveTrackerSignInMessage
} from '../app/utils/trackerSignInMessages'

describe('trackerSignInMessages', () => {
  it('maps auth session missing errors to the tracker sign-in copy', () => {
    const error = new Error('Auth session missing!')

    expect(isAuthSessionMissingError(error)).toBe(true)
    expect(resolveTrackerSignInMessage(error, TRACKER_SIGN_IN.saveTrackedConditions))
      .toBe(TRACKER_SIGN_IN.saveTrackedConditions)
  })

  it('keeps unrelated error messages', () => {
    const error = new Error('Network request failed')

    expect(isAuthSessionMissingError(error)).toBe(false)
    expect(resolveTrackerSignInMessage(error, TRACKER_SIGN_IN.saveTrackedConditions))
      .toBe('Network request failed')
  })
})
