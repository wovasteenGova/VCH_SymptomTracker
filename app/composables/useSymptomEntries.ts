import { useSupabaseClient } from '#imports'
import { MAX_ENTRY_EDITS, type EntryRevisionRecord, type EntryRevisionSnapshot } from '../utils/entryEditHistory'
import { useTrackerDb } from './useTrackerDb'

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

  async function listEntries() {
    const userId = await getUserId()

    const { data, error } = await trackerDb
      .from('symptom_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  }

  async function createEntry(payload: SymptomEntryPayload) {
    const userId = await getUserId()

    const { data, error } = await trackerDb
      .from('symptom_entries')
      .insert({
        user_id: userId,
        source: 'veteran',
        entry_status: 'complete',
        edit_count: 0,
        ...payload
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async function updateEntry(id: string, payload: Partial<SymptomEntryPayload>) {
    const { data, error } = await trackerDb
      .from('symptom_entries')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
    const userId = await getUserId()

    const { data: existingEntry, error: fetchError } = await trackerDb
      .from('symptom_entries')
      .select('edit_count, source')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    const editCount = Number(existingEntry?.edit_count) || 0

    if (editCount >= MAX_ENTRY_EDITS) {
      throw new EntryEditLimitError()
    }

    const revisionNumber = editCount + 1

    const { error: revisionError } = await trackerDb
      .from('symptom_entry_revisions')
      .insert({
        entry_id: id,
        user_id: userId,
        revision_number: revisionNumber,
        snapshot: beforeSnapshot
      })

    if (revisionError) {
      throw revisionError
    }

    const { data, error } = await trackerDb
      .from('symptom_entries')
      .update({
        ...payload,
        edit_count: revisionNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  async function listRevisionsForEntries(entryIds: string[]) {
    if (!entryIds.length) {
      return [] as EntryRevisionRecord[]
    }

    const { data, error } = await trackerDb
      .from('symptom_entry_revisions')
      .select('id, entry_id, revision_number, revised_at, snapshot')
      .in('entry_id', entryIds)
      .order('revision_number', { ascending: true })

    if (error) {
      throw error
    }

    return (data || []) as EntryRevisionRecord[]
  }

  async function deleteEntry(id: string) {
    const { error } = await trackerDb
      .from('symptom_entries')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
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
  }

  return {
    listEntries,
    createEntry,
    updateEntry,
    updateEntryWithRevision,
    listRevisionsForEntries,
    deleteEntry,
    deleteAllEntries
  }
}
