import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSupabaseEnv } from '../server/utils/supabaseEnv.ts'

const KEYS = [
  'SUPABASE_URL',
  'NUXT_PUBLIC_SUPABASE_URL',
  'NUXT_SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_KEY',
  'NUXT_PUBLIC_SUPABASE_ANON_KEY',
  'NUXT_PUBLIC_SUPABASE_KEY',
  'NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NUXT_SUPABASE_KEY',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NUXT_SUPABASE_SERVICE_KEY',
  'NUXT_SUPABASE_SECRET_KEY'
] as const

function withEnv(values: Partial<Record<(typeof KEYS)[number], string>>, run: () => void) {
  const previous = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]))

  for (const key of KEYS) {
    if (values[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = values[key]
    }
  }

  try {
    run()
  } finally {
    for (const key of KEYS) {
      const value = previous[key]
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('resolveSupabaseEnv reads SUPABASE_SERVICE_KEY from process.env', () => {
  withEnv({
    SUPABASE_URL: 'https://bszlmqdqrwqocoxbzpyh.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_KEY: 'service-key'
  }, () => {
    const env = resolveSupabaseEnv()
    assert.equal(env.serviceKey, 'service-key')
    assert.equal(env.anonKey, 'anon-key')
  })
})

test('resolveSupabaseEnv prefers SUPABASE_SERVICE_KEY over SUPABASE_SERVICE_ROLE_KEY', () => {
  withEnv({
    SUPABASE_SERVICE_KEY: 'service-key',
    SUPABASE_SERVICE_ROLE_KEY: 'stale-role-key'
  }, () => {
    assert.equal(resolveSupabaseEnv().serviceKey, 'service-key')
  })
})

test('resolveSupabaseEnv accepts SUPABASE_SERVICE_ROLE_KEY as an alias', () => {
  withEnv({
    SUPABASE_SERVICE_ROLE_KEY: 'role-key'
  }, () => {
    assert.equal(resolveSupabaseEnv().serviceKey, 'role-key')
  })
})
