import { describe, expect, it } from 'vitest'
import { resolveFamilyObservationReturnPath } from '../app/utils/appReturnPath'

describe('resolveFamilyObservationReturnPath', () => {
  it('returns home when returnTo is missing or unsafe', () => {
    expect(resolveFamilyObservationReturnPath(undefined)).toBe('/')
    expect(resolveFamilyObservationReturnPath('')).toBe('/')
    expect(resolveFamilyObservationReturnPath('https://evil.com')).toBe('/')
    expect(resolveFamilyObservationReturnPath('//evil.com')).toBe('/')
    expect(resolveFamilyObservationReturnPath('/')).toBe('/')
    expect(resolveFamilyObservationReturnPath('/profile')).toBe('/')
  })

  it('allows a single-segment family report path', () => {
    expect(resolveFamilyObservationReturnPath('/report/abc123')).toBe('/report/abc123')
    expect(resolveFamilyObservationReturnPath('/report/abc123?foo=1')).toBe('/report/abc123')
  })

  it('rejects nested or empty report paths', () => {
    expect(resolveFamilyObservationReturnPath('/report/')).toBe('/')
    expect(resolveFamilyObservationReturnPath('/report/a/b')).toBe('/')
  })
})
