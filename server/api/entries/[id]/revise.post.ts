import { readBody } from 'h3'
import { MAX_ENTRY_EDITS } from '../../../../app/utils/entryEditHistory'
import type { EntryRevisionSnapshot } from '../../../../app/utils/entryEditHistory'
import { requireAuthUser } from '../../../utils/authUser'
import { getSupabaseAdmin } from '../../../utils/supabaseAdmin'

type ReviseEntryBody = {
  beforeSnapshot?: EntryRevisionSnapshot
  payload?: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const { user } = await requireAuthUser(event)
  const entryId = getRouterParam(event, 'id')

  if (!entryId) {
    throw createError({
      statusCode: 400,
      message: 'Entry id is required.'
    })
  }

  const body = await readBody<ReviseEntryBody>(event)
  const beforeSnapshot = body?.beforeSnapshot
  const payload = body?.payload

  if (!beforeSnapshot || !payload) {
    throw createError({
      statusCode: 400,
      message: 'Missing revision snapshot or update payload.'
    })
  }

  const supabase = getSupabaseAdmin()
  const { data: existingEntry, error: fetchError } = await supabase
    .from('symptom_entries')
    .select('edit_count, user_id, source')
    .eq('id', entryId)
    .single()

  if (fetchError || !existingEntry) {
    throw createError({
      statusCode: 404,
      message: 'Symptom entry not found.'
    })
  }

  if (existingEntry.user_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You can only edit your own symptom entries.'
    })
  }

  const editCount = Number(existingEntry.edit_count) || 0

  if (editCount >= MAX_ENTRY_EDITS) {
    throw createError({
      statusCode: 400,
      message: 'This entry has reached the maximum of 3 edits. Log a new entry if you need to add more detail.'
    })
  }

  const revisionNumber = editCount + 1

  const { error: revisionError } = await supabase
    .from('symptom_entry_revisions')
    .insert({
      entry_id: entryId,
      user_id: user.id,
      revision_number: revisionNumber,
      snapshot: beforeSnapshot
    })

  if (revisionError) {
    throw createError({
      statusCode: 500,
      message: revisionError.message
    })
  }

  const { data, error: updateError } = await supabase
    .from('symptom_entries')
    .update({
      ...payload,
      edit_count: revisionNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', entryId)
    .select()
    .single()

  if (updateError) {
    throw createError({
      statusCode: 500,
      message: updateError.message
    })
  }

  return data
})
