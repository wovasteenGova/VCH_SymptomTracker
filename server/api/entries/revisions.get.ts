import { getQuery } from 'h3'
import { requireAuthUser } from '../../utils/authUser'
import { getSupabaseAdmin } from '../../utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuthUser(event)
  const query = getQuery(event)
  const rawIds = query.entryIds

  const entryIds = typeof rawIds === 'string'
    ? rawIds.split(',').map((id) => id.trim()).filter(Boolean)
    : Array.isArray(rawIds)
      ? rawIds.map((id) => String(id).trim()).filter(Boolean)
      : []

  if (!entryIds.length) {
    return { revisions: [] }
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('symptom_entry_revisions')
    .select('id, entry_id, revision_number, revised_at, snapshot')
    .eq('user_id', user.id)
    .in('entry_id', entryIds)
    .order('revision_number', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message
    })
  }

  return { revisions: data || [] }
})
