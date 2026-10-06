import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('tracker auth session handling', () => {
  it('does not clear user on TOKEN_REFRESHED without a session', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/composables/useSupabaseAuth.ts'),
      'utf8'
    )

    expect(source).toContain("if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return")
    expect(source).not.toMatch(/SIGNED_OUT\s*\|\|\s*!session\?\.user/)
  })

  it('configures explicit PKCE and disables detectSessionInUrl', () => {
    const source = readFileSync(resolve(process.cwd(), 'nuxt.config.ts'), 'utf8')

    expect(source).toContain("flowType: 'pkce'")
    expect(source).toContain('detectSessionInUrl: false')
  })

  it('throttles auth session sync plugin', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/plugins/auth-session-sync.client.ts'),
      'utf8'
    )

    expect(source).toContain('MIN_SYNC_INTERVAL_MS')
  })
})
