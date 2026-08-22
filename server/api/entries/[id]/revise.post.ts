import { readBody } from 'h3'
import type { EntryRevisionSnapshot } from '../../../../app/utils/entryEditHistory'
import { requireAuthUser } from '../../../utils/authUser'
import { getSupabaseAdmin } from '../../../utils/supabaseAdmin'

type ReviseEntryBody = {
  beforeSnapshot?: EntryRevisionSnapshot
  payload?: Record<string, unknown>
}

const ALLOWED_REVISION_FIELDS = new Set([
  'condition_key',
  'condition_label',
  'severity',
  'occurred_at',
  'summary',
  'impact',
  'details'
])

function isMissingRevisionRpc(error: { code?: string, message?: string }) {
  return error.code === 'PGRST202'
    || error.code === '42883'
    || /revise_symptom_entry.*not found|schema cache/i.test(error.message || '')
}

async function reviseWithCompatibilityFallback(input: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  entryId: string
  userId: string
  payload: Record<string, unknown>
}) {
  const { supabase, entryId, userId, payload } = input
  const { data: existing, error: fetchError } = await supabase
    .from('symptom_entries')
    .select('condition_key, condition_label, severity, occurred_at, summary, impact, details, edit_count, user_id, source')
    .eq('id', entryId)
    .single()

  if (fetchError || !existing) throw createError({ statusCode: 404, message: 'Symptom entry not found.' })
  if (existing.user_id !== userId) throw createError({ statusCode: 403, message: 'You can only edit your own symptom entries.' })
  if (existing.source === 'family') throw createError({ statusCode: 403, message: 'Signed family observations cannot be rewritten.' })

  const editCount = Number(existing.edit_count) || 0
  if (editCount >= 3) {
    throw createError({
      statusCode: 400,
      message: 'This entry has reached the maximum of 3 edits. Log a new entry if you need to add more detail.'
    })
  }

  const revisionNumber = editCount + 1
  const snapshot = {
    condition_key: existing.condition_key,
    condition_label: existing.condition_label,
    severity: existing.severity,
    occurred_at: existing.occurred_at,
    summary: existing.summary,
    impact: existing.impact,
    details: existing.details
  }
  const { error: revisionError } = await supabase.from('symptom_entry_revisions').insert({
    entry_id: entryId,
    user_id: userId,
    revision_number: revisionNumber,
    snapshot
  })
  if (revisionError) throw createError({ statusCode: 409, message: 'This entry changed while you were editing it. Reload and try again.' })

  const { data, error: updateError } = await supabase
    .from('symptom_entries')
    .update({ ...payload, edit_count: revisionNumber, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', userId)
    .eq('edit_count', editCount)
    .select()
    .single()

  if (updateError || !data) {
    await supabase
      .from('symptom_entry_revisions')
      .delete()
      .eq('entry_id', entryId)
      .eq('user_id', userId)
      .eq('revision_number', revisionNumber)
    throw createError({ statusCode: 409, message: 'This entry changed while you were editing it. Reload and try again.' })
  }

  return data
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

  const rejectedFields = Object.keys(payload).filter(field => !ALLOWED_REVISION_FIELDS.has(field))
  if (rejectedFields.length) {
    throw createError({
      statusCode: 400,
      message: 'The update contains fields that cannot be revised.'
    })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc('revise_symptom_entry', {
    p_entry_id: entryId,
    p_user_id: user.id,
    p_before_snapshot: beforeSnapshot,
    p_payload: payload
  })

  if (error) {
    if (isMissingRevisionRpc(error)) {
      return reviseWithCompatibilityFallback({ supabase, entryId, userId: user.id, payload })
    }
    const isValidationError = error.code === '22023'
    const isForbidden = error.code === '42501'
    const isMissing = error.code === 'P0002'
    throw createError({
      statusCode: isValidationError ? 400 : isForbidden ? 403 : isMissing ? 404 : 500,
      message: error.message
    })
  }

  return data
})
