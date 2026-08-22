import { useSupabaseClient } from '#imports'
import { useTrackerDb } from './useTrackerDb'

type UserProfilePayload = {
  full_name?: string | null
  display_name?: string | null
  phone?: string | null
  date_of_birth?: string | null
  service_branch?: string | null
  service_rank?: string | null
  service_start_year?: number | null
  service_end_year?: number | null
  free_condition_keys?: string[]
  tracked_condition_keys?: string[]
  conditions_onboarding_completed?: boolean
  app_welcome_completed?: boolean
  logging_cadence?: 'daily' | 'weekly'
  weekly_log_day?: number
  terms_accepted_at?: string | null
  log_reminders_enabled?: boolean
  reminder_hour?: number
  reminder_evening_hour?: number
  reminder_timezone?: string | null
}
type SupporterProfilePayload = {
  link_label?: string | null
  visible_conditions: string[]
  linked_entry_id?: string | null
  entry_context_summary?: string | null
}

function isMissingProfileColumnError(error: unknown, columnName: string) {
  return Boolean(
    error
    && typeof error === 'object'
    && 'message' in error
    && String((error as { message?: unknown }).message).includes(columnName)
  )
}

async function sha256Hex(value: string) {
  const encodedValue = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedValue)

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function createLinkToken() {
  const randomValues = new Uint8Array(32)
  crypto.getRandomValues(randomValues)

  return Array.from(randomValues)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function useUserProfiles() {
  const supabase = useSupabaseClient()
  const trackerDb = useTrackerDb()

  async function getUserId() {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    if (!data.user) {
      throw new Error('Please sign in first.')
    }

    return data.user.id
  }

  async function getProfile() {
    const userId = await getUserId()

    const { data, error } = await trackerDb
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data
  }

  async function upsertProfile(payload: UserProfilePayload, expectedUserId?: string) {
    const userId = await getUserId()
    if (expectedUserId && userId !== expectedUserId) {
      throw new Error('Your account changed before these profile settings could be saved.')
    }
    const upsertPayload = {
      user_id: userId,
      ...payload,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await trackerDb
      .from('user_profiles')
      .upsert(upsertPayload)
      .select()
      .single()

    if (isMissingProfileColumnError(error, 'reminder_evening_hour')) {
      const { reminder_evening_hour: _reminderEveningHour, ...fallbackPayload } = upsertPayload
      const { data: fallbackData, error: fallbackError } = await trackerDb
        .from('user_profiles')
        .upsert(fallbackPayload)
        .select()
        .single()

      if (fallbackError) {
        throw fallbackError
      }

      return fallbackData
    }

    if (error) {
      throw error
    }

    return data
  }

  async function listSupporterProfiles() {
    const userId = await getUserId()

    const { data, error } = await trackerDb
      .from('supporter_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  }

  async function createSupporterProfile(payload: SupporterProfilePayload) {
    const userId = await getUserId()
    const token = createLinkToken()
    const tokenHash = await sha256Hex(token)

    const linkLabel = payload.link_label?.trim()
    const displayName = linkLabel || 'Private supporter link'

    const { data, error } = await trackerDb
      .from('supporter_profiles')
      .insert({
        user_id: userId,
        display_name: displayName,
        visible_conditions: payload.visible_conditions,
        token_hash: tokenHash,
        linked_entry_id: payload.linked_entry_id || null,
        entry_context_summary: payload.entry_context_summary || null
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      profile: data,
      token
    }
  }

  async function toggleSupporterProfile(id: string, active: boolean) {
    const { data, error } = await trackerDb
      .from('supporter_profiles')
      .update({
        active,
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

  async function createSupporterProfileLink(profileId: string) {
    const userId = await getUserId()
    const token = createLinkToken()
    const tokenHash = await sha256Hex(token)

    const { error } = await trackerDb
      .from('supporter_link_tokens')
      .insert({
        supporter_profile_id: profileId,
        user_id: userId,
        token_hash: tokenHash
      })

    if (error) {
      throw error
    }

    return token
  }

  async function deleteSupporterProfile(id: string) {
    const userId = await getUserId()

    const { error } = await trackerDb
      .from('supporter_profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  }

  return {
    getProfile,
    upsertProfile,
    listSupporterProfiles,
    createSupporterProfile,
    createSupporterProfileLink,
    toggleSupporterProfile,
    deleteSupporterProfile
  }
}
