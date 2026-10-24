import { isClaimColorThemeId, type ClaimColorThemeId } from './claimColorThemes'

export const VCH_UI_PREFERENCES_TABLE = 'user_ui_preferences'

export type VchColorModePreference = 'light' | 'dark'

export type VchUiPreferencesRecord = {
  colorTheme: ClaimColorThemeId | null
  colorMode: VchColorModePreference | null
  updatedAt: string | null
}

export type VchUiPreferencesRow = {
  user_id?: string
  color_theme?: string | null
  color_mode?: string | null
  updated_at?: string | null
}

export function parseVchUiPreferencesRow(
  row: VchUiPreferencesRow | null | undefined
): VchUiPreferencesRecord {
  return {
    colorTheme: isClaimColorThemeId(row?.color_theme) ? row.color_theme : null,
    colorMode: row?.color_mode === 'light' || row?.color_mode === 'dark'
      ? row.color_mode
      : null,
    updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : null
  }
}

export function buildVchUiPreferencesUpsert(
  userId: string,
  input: {
    colorTheme: ClaimColorThemeId
    colorMode: VchColorModePreference
  }
): Required<Pick<VchUiPreferencesRow, 'user_id' | 'color_theme' | 'color_mode' | 'updated_at'>> {
  return {
    user_id: userId,
    color_theme: input.colorTheme,
    color_mode: input.colorMode,
    updated_at: new Date().toISOString()
  }
}
