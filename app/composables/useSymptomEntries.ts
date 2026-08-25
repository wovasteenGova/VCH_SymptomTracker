import { useSupabaseClient } from '#imports'
import { type EntryRevisionRecord, type EntryRevisionSnapshot, normalizeRevisionRecords } from '../utils/entryEditHistory'
import { resolveCatalogConditionByStoredKey, resolveTrackedConditionKey } from '../utils/conditionCatalog'
import { conditionKeyFromLabel } from '../utils/subscription'
import { useTrackerDb } from './useTrackerDb'
import { readDeletedEntriesForUser, writeDeletedEntriesForUser } from './useDeletedEntryArchive'

type SymptomEntryPayload = {
  condition_key: string
  condition_label: string
  source?: 'veteran' | 'family'
  entry_status?: 'draft' | 'complete'
  severity?: number | null
  occurred_at?: string | null
  summary?: string | null
  impact?: string | null
  details?: Record<string, unknown>
  edit_count?: number
}

export class EntryEditLimitError extends Error {
  constructor() {
    super('This entry has reached the maximum of 3 edits. Log a new entry if you need to add more detail.')
    this.name = 'EntryEditLimitError'
  }
}

async function getAccessToken(supabase: ReturnType<typeof useSupabaseClient>) {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session?.access_token || null
}

function isMissingDeletedAtColumn(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''
  return /deleted_at/i.test(message) && /column|schema cache/i.test(message)
}

function entryMatchesConditionKey(
  entry: { condition_key?: string | null, condition_label?: string | null },
  normalizedTarget: string
) {
  const resolved = resolveCatalogConditionByStoredKey(entry.condition_key || entry.condition_label || '')
  const entryKey = resolved?.key || entry.condition_key?.trim() || conditionKeyFromLabel(entry.condition_label || '')
  const normalizedEntryKey = resolveTrackedConditionKey(entryKey) ?? entryKey
  return normalizedEntryKey === normalizedTarget
}

export function useSymptomEntries() {
  const supabase = useSupabaseClient()
  const trackerDb = useTrackerDb()

  async function getUserId() {
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    if (userData.user) {
      return userData.user.id
    }

    throw new Error('Please sign in before saving symptom entries.')
  }

  async function assertRequestOwner(expectedUserId: string) {
    const currentUserId = await getUserId()
    if (currentUserId !== expectedUserId) {
      throw new Error('Your account changed while this request was running. Please try again.')
    }
  }

  async function listEntries() {
    const userId = await getUserId()

    const { data, error } = await trackerDb
      .from('symptom_entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      if (!isMissingDeletedAtColumn(error)) throw error
      const fallback = await trackerDb
        .from('symptom_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (fallback.error) throw fallback.error
      await assertRequestOwner(userId)
      return fallback.data || []
    }

    await assertRequestOwner(userId)
    return data || []
  }

  async function listDeletedEntries() {
    const userId = await getUserId()
    const { data, error } = await trackerDb
      .from('symptom_entries')
      .select('*')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      if (isMissingDeletedAtColumn(error)) return readDeletedEntriesForUser(userId)
      throw error
    }
    await assertRequestOwner(userId)
    return data || []
  }

  async function createEntry(payload: SymptomEntryPayload) {
    const userId = await getUserId()

    const { data, error } = await trackerDb
      .from('symptom_entries')
      .insert({
        ...payload,
        user_id: userId,
        source: 'veteran',
        entry_status: 'complete',
        edit_count: 0
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async function updateEntry(id: string, payload: Partial<SymptomEntryPayload>) {
    const userId = await getUserId()
    const { data, error } = await trackerDb
      .from('symptom_entries')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('source', 'veteran')
      .eq('entry_status', 'draft')
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async function updateEntryWithRevision(
    id: string,
    beforeSnapshot: EntryRevisionSnapshot,
    payload: Partial<SymptomEntryPayload>
  ) {
    const accessToken = await getAccessToken(supabase)

    if (!accessToken) {
      throw new Error('Please sign in before saving symptom entries.')
    }

    try {
      const data = await $fetch<Record<string, unknown>>(`/api/entries/${id}/revise`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          beforeSnapshot,
          payload
        }
      })

      return data
    } catch (error: unknown) {
      const fetchError = error as { statusCode?: number, data?: { message?: string }, message?: string }
      const message = fetchError.data?.message || fetchError.message || 'Could not save entry revision.'

      if (fetchError.statusCode === 400 && message.includes('maximum of 3 edits')) {
        throw new EntryEditLimitError()
      }

      throw new Error(message)
    }
  }

  async function listRevisionsForEntries(entryIds: string[]) {
    if (!entryIds.length) {
      return [] as EntryRevisionRecord[]
    }

    const accessToken = await getAccessToken(supabase)

    if (!accessToken) {
      return [] as EntryRevisionRecord[]
    }

    try {
      const response = await $fetch<{ revisions: EntryRevisionRecord[] }>(
        `/api/entries/revisions?entryIds=${encodeURIComponent(entryIds.join(','))}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      return normalizeRevisionRecords(response.revisions || [])
    } catch (error: unknown) {
      const fetchError = error as { data?: { message?: string }, message?: string }
      const message = fetchError.data?.message || fetchError.message || 'Could not load entry revisions for export.'

      throw new Error(message)
    }
  }

  async function deleteEntry(id: string) {
    const userId = await getUserId()
    const { data: existingEntry } = await trackerDb
      .from('symptom_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    const { error } = await trackerDb
      .from('symptom_entries')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      if (!isMissingDeletedAtColumn(error)) throw error
      if (existingEntry) {
        writeDeletedEntriesForUser(userId, [{
          ...existingEntry,
          deleted_at: new Date().toISOString()
        }, ...readDeletedEntriesForUser(userId)])
      }
      const fallback = await trackerDb
        .from('symptom_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (fallback.error) throw fallback.error
    }
  }

  async function restoreEntry(id: string) {
    const userId = await getUserId()
    const { data, error } = await trackerDb
      .from('symptom_entries')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (!isMissingDeletedAtColumn(error)) throw error
      const archived = readDeletedEntriesForUser(userId).find(entry => entry.id === id)
      if (!archived) throw new Error('Deleted entry not found.')
      const { data: restored, error: restoreError } = await trackerDb
        .from('symptom_entries')
        .insert({
          user_id: userId,
          source: archived.source === 'family' ? 'family' : 'veteran',
          entry_status: archived.entry_status || 'complete',
          edit_count: archived.edit_count || 0,
          condition_key: archived.condition_key,
          condition_label: archived.condition_label,
          severity: archived.severity,
          occurred_at: archived.occurred_at,
          summary: archived.summary,
          impact: archived.impact,
          details: archived.details || {}
        })
        .select()
        .single()
      if (restoreError) throw restoreError
      writeDeletedEntriesForUser(
        userId,
        readDeletedEntriesForUser(userId).filter(entry => entry.id !== id)
      )
      return restored
    }
    return data
  }

  async function purgeDeletedEntry(id: string) {
    const userId = await getUserId()
    const { error } = await trackerDb
      .from('symptom_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)

    if (error) {
      if (!isMissingDeletedAtColumn(error)) throw error
      writeDeletedEntriesForUser(
        userId,
        readDeletedEntriesForUser(userId).filter(entry => entry.id !== id)
      )
    }
  }

  async function deleteEntriesForConditionKey(conditionKey: string) {
    const normalizedTarget = resolveTrackedConditionKey(conditionKey) ?? conditionKey.trim()
    if (!normalizedTarget) {
      return 0
    }

    const entries = await listEntries()
    const matching = entries.filter((entry) => entryMatchesConditionKey(entry, normalizedTarget))

    for (const entry of matching) {
      await deleteEntry(entry.id)
    }

    return matching.length
  }

  async function purgeDeletedEntriesForConditionKey(conditionKey: string) {
    const normalizedTarget = resolveTrackedConditionKey(conditionKey) ?? conditionKey.trim()
    if (!normalizedTarget) {
      return 0
    }

    const entries = await listDeletedEntries()
    const matching = entries.filter((entry) => entryMatchesConditionKey(entry, normalizedTarget))

    for (const entry of matching) {
      await purgeDeletedEntry(entry.id)
    }

    return matching.length
  }

  async function removeAllEntriesForConditionKeys(conditionKeys: string[]) {
    const uniqueKeys = [...new Set(
      conditionKeys
        .map((key) => resolveTrackedConditionKey(key) ?? key.trim())
        .filter(Boolean)
    )]

    let archivedCount = 0
    let purgedCount = 0

    for (const key of uniqueKeys) {
      archivedCount += await deleteEntriesForConditionKey(key)
      purgedCount += await purgeDeletedEntriesForConditionKey(key)
    }

    return {
      archivedCount,
      purgedCount,
      totalCount: archivedCount + purgedCount
    }
  }

  async function deleteAllEntries() {
    const userId = await getUserId()

    const { error } = await trackerDb
      .from('symptom_entries')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw error
    }
    writeDeletedEntriesForUser(userId, [])
  }

  return {
    listEntries,
    listDeletedEntries,
    createEntry,
    updateEntry,
    updateEntryWithRevision,
    listRevisionsForEntries,
    deleteEntry,
    deleteEntriesForConditionKey,
    purgeDeletedEntriesForConditionKey,
    removeAllEntriesForConditionKeys,
    restoreEntry,
    purgeDeletedEntry,
    deleteAllEntries
  }
}
