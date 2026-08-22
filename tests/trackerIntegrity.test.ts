import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const entries = readFileSync('app/composables/useSymptomEntries.ts', 'utf8')
const tracked = readFileSync('app/composables/useTrackedConditions.ts', 'utf8')
const index = readFileSync('app/pages/index.vue', 'utf8')
const profile = readFileSync('app/pages/profile.vue', 'utf8')
const report = readFileSync('app/pages/report/[token].vue', 'utf8')
const migration = readFileSync('supabase/migrations/20260822110000_symptom_entry_integrity.sql', 'utf8')

describe('tracker data integrity regressions', () => {
  it('keeps active and deleted logs server-backed and account scoped', () => {
    expect(entries).toContain(".is('deleted_at', null)")
    expect(entries).toContain(".not('deleted_at', 'is', null)")
    expect(entries).toContain(".eq('user_id', userId)")
    expect(entries).toContain('async function restoreEntry')
    expect(index).not.toContain('archiveDeletedEntry(user.value.id, entry)')
    expect(profile).toContain('await restoreEntry(entryId)')
  })

  it('scopes condition cache and rejects stale account loads and saves', () => {
    expect(tracked).toContain("`${baseKey}:${ownerId || 'guest'}`")
    expect(tracked).toContain('Your account changed before these conditions could be saved.')
    expect(index).toContain('requestSequence !== entriesLoadSequence')
    expect(profile).toContain('requestSequence !== profileLoadSequence')
    expect(profile).toContain('saveProfile(expectedUserId)')
  })

  it('makes family reports immutable and veteran revisions atomic', () => {
    expect(index).toContain('Signed family observations are read-only.')
    expect(migration).toContain("if old.source = 'family' and v_content_changed")
    expect(migration).toContain('insert into tracker.symptom_entry_revisions')
    expect(migration).toContain("perform set_config('tracker.revision_update', '1', true)")
    expect(migration).toContain('update tracker.symptom_entries')
  })

  it('rejects future observation times in the UI and database', () => {
    expect(report).toContain('observedAt.getTime() > Date.now() + 60_000')
    expect(migration).toContain("new.occurred_at > now() + interval '1 minute'")
  })
})
