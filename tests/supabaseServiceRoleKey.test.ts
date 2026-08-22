import assert from 'node:assert/strict'
import { test } from 'vitest'
import { describeServiceRoleKey, inspectSupabaseKey } from '../server/utils/supabaseKeyInspect.ts'

function jwtForRole(role: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: 'supabase',
    role,
    ref: 'bszlmqdqrwqocoxbzpyh'
  })).toString('base64url')
  return `${header}.${payload}.sig`
}

test('inspectSupabaseKey treats sb_secret_ as service_role', () => {
  assert.equal(inspectSupabaseKey('sb_secret_abc').role, 'service_role')
  assert.equal(inspectSupabaseKey('sb_publishable_abc').role, 'anon')
})

test('describeServiceRoleKey accepts legacy service_role JWT and new secret keys', () => {
  assert.equal(describeServiceRoleKey(jwtForRole('service_role'), jwtForRole('anon')).ok, true)
  assert.equal(describeServiceRoleKey('sb_secret_backend', 'sb_publishable_web').ok, true)
})

test('describeServiceRoleKey rejects anon pasted into the service slot', () => {
  const anon = jwtForRole('anon')
  assert.equal(describeServiceRoleKey(anon, anon).reason, 'same_as_anon')
  assert.equal(describeServiceRoleKey(anon, jwtForRole('anon') + '-other').reason, 'anon_jwt')
  assert.equal(describeServiceRoleKey('', anon).reason, 'missing')
})
