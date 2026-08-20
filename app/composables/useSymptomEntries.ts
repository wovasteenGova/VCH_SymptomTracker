import { useSupabaseClient } from '#imports'
import { type EntryRevisionRecord, type EntryRevisionSnapshot, normalizeRevisionRecords } from '../utils/entryEditHistory'
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

async function getAccessToken(supabase: ReturnType<typeof useSupabaseClient>) {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session?.access_token || null
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
