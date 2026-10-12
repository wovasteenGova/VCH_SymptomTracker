import { describe, expect, it } from 'vitest'
import {
  buildSignupAttributionMetadata,
  mergeSignupAttributionMetadata,
  readSignupAttribution
} from '../../shared/signupAttribution'

describe('signupAttribution', () => {
  it('stamps symptom_tracker metadata', () => {
    const meta = buildSignupAttributionMetadata({
      product: 'symptom_tracker',
      host: 'tracker.veteranscentralhub.com',
      at: '2026-10-12T00:00:00.000Z'
    })
    expect(meta.signup_product).toBe('symptom_tracker')
    expect(readSignupAttribution(meta).product).toBe('symptom_tracker')
  })

  it('does not overwrite existing signup_product', () => {
    expect(mergeSignupAttributionMetadata(
      { signup_product: 'hub' },
      { product: 'symptom_tracker' }
    )).toBeNull()
  })
})
