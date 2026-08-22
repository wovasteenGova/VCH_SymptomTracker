import assert from 'node:assert/strict'
import { test } from 'vitest'
import { describeServiceRoleKey } from '../server/utils/supabaseKeyInspect.ts'

function jwtForRole(role: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: 'supabase',
    role,
    ref: 'bszlmqdqrwqocoxbzpyh'
  })).toString('base64url')
  return `${header}.${payload}.sig`
}

test('service key check fails when compared to stale build-baked anon matching service', () => {
  const service = jwtForRole('service_role')
  const anon = jwtForRole('anon')

  assert.equal(describeServiceRoleKey(service, service).ok, false)
  assert.equal(describeServiceRoleKey(service, anon).ok, true)
})
