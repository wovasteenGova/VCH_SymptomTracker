import { describe, expect, it } from 'vitest'
import {
  createSupporterLinkToken,
  SUPPORTER_LINK_TOKEN_BYTE_LENGTH
} from '../app/utils/supporterLinkToken'

describe('createSupporterLinkToken', () => {
  it('returns hex twice the byte length', () => {
    const token = createSupporterLinkToken()
    expect(token).toMatch(/^[0-9a-f]+$/)
    expect(token.length).toBe(SUPPORTER_LINK_TOKEN_BYTE_LENGTH * 2)
  })

  it('defaults to 128-bit tokens', () => {
    expect(SUPPORTER_LINK_TOKEN_BYTE_LENGTH).toBe(16)
  })
})
