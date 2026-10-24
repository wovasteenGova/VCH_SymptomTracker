import { describe, expect, it } from 'vitest'
import {
  buildVchUiPreferencesUpsert,
  parseVchUiPreferencesRow
} from '../../shared/vchUiPreferences'

describe('vchUiPreferences', () => {
  it('parses valid theme and color mode rows', () => {
    const parsed = parseVchUiPreferencesRow({
      color_theme: 'pacific-slate',
      color_mode: 'light'
    })
    expect(parsed.colorTheme).toBe('pacific-slate')
    expect(parsed.colorMode).toBe('light')
  })

  it('builds upsert payloads', () => {
    const row = buildVchUiPreferencesUpsert('11111111-1111-4111-8111-111111111111', {
      colorTheme: 'night-ops',
      colorMode: 'dark'
    })
    expect(row.color_mode).toBe('dark')
  })
})
