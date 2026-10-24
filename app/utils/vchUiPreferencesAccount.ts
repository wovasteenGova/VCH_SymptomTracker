import type { SupabaseClient } from '@supabase/supabase-js'
import {
  VCH_UI_PREFERENCES_TABLE,
  buildVchUiPreferencesUpsert,
  parseVchUiPreferencesRow,
  type VchColorModePreference
} from '../../shared/vchUiPreferences'
import { isClaimColorThemeId, type ClaimColorThemeId } from '../../shared/claimColorThemes'

export async function fetchAccountUiPreferences(
  client: SupabaseClient,
  userId: string
) {
  const { data, error } = await client
    .from(VCH_UI_PREFERENCES_TABLE)
    .select('color_theme, color_mode, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[vchUiPreferences] fetch failed', error.message)
    return null
  }

  return parseVchUiPreferencesRow(data)
}

let applyingAccountUiPreferences = false

export function isApplyingAccountUiPreferences() {
  return applyingAccountUiPreferences
}

export async function applyAccountUiPreferences(
  client: SupabaseClient,
  userId: string
): Promise<boolean> {
  const record = await fetchAccountUiPreferences(client, userId)
  if (!record?.colorTheme && !record?.colorMode) return false

  applyingAccountUiPreferences = true
  try {
    const { applyTheme } = useClaimColorTheme()
    const colorMode = useColorMode()
    if (record.colorTheme) applyTheme(record.colorTheme)
    if (record.colorMode) colorMode.preference = record.colorMode
  } finally {
    applyingAccountUiPreferences = false
  }
  return true
}

export async function persistAccountUiPreferences(
  client: SupabaseClient,
  userId: string,
  input: {
    colorTheme: ClaimColorThemeId
    colorMode: VchColorModePreference
  }
) {
  if (!isClaimColorThemeId(input.colorTheme)) return

  const { error } = await client
    .from(VCH_UI_PREFERENCES_TABLE)
    .upsert(buildVchUiPreferencesUpsert(userId, input), { onConflict: 'user_id' })

  if (error) {
    console.warn('[vchUiPreferences] persist failed', error.message)
  }
}

export function resolveColorModeForAccount(
  colorMode: ReturnType<typeof useColorMode>
): VchColorModePreference | null {
  if (colorMode.preference === 'light' || colorMode.preference === 'dark') {
    return colorMode.preference
  }
  if (colorMode.value === 'dark') return 'dark'
  if (colorMode.value === 'light') return 'light'
  return null
}
