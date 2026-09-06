import { useSupabaseClient } from '#imports'

export const TRACKER_SCHEMA = 'tracker'

/** Production Supabase project ref: verify before migrations. */
export const TRACKER_SUPABASE_PROJECT_REF = 'bszlmqdqrwqocoxbzpyh'

export function useTrackerDb() {
  const supabase = useSupabaseClient()

  return supabase.schema(TRACKER_SCHEMA)
}
