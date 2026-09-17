import { describe, expect, it } from 'vitest'
import {
  buildAuthEmailLinkRedirectUrl,
  resolveAuthEmailLinkRedirectPath
} from '../../app/utils/authEmailLinkRedirect'

describe('authEmailLinkRedirect', () => {
  it('routes recovery hash tokens to reset-password', () => {
    const hash = '#access_token=abc&type=recovery'

    expect(resolveAuthEmailLinkRedirectPath({ pathname: '/', search: '', hash }))
      .toBe('/auth/reset-password')
  })

  it('preserves search and hash on redirect url', () => {
    expect(buildAuthEmailLinkRedirectUrl(
      { search: '?code=abc&type=recovery', hash: '' },
      '/auth/reset-password'
    )).toBe('/auth/reset-password?code=abc&type=recovery')
  })
})
