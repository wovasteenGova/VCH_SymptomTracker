import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const index = readFileSync('app/pages/index.vue', 'utf8')
const profile = readFileSync('app/pages/profile.vue', 'utf8')

describe('header settings overlays', () => {
  it('opens dedicated overlays from the tracker header', () => {
    expect(index).toContain("import TrackerLayReportingSettingsOverlay from '../components/settings/TrackerLayReportingSettingsOverlay.vue'")
    expect(index).toContain('TrackerLayReportingSettingsOverlay')
    expect(index).toContain('TrackerLogNotificationsSettingsOverlay')
    expect(index).toContain('openLayReportingSettingsOverlay')
    expect(index).toContain('openLogNotificationsSettingsOverlay')
    expect(index).not.toContain("section: 'settings-supporters'")
    expect(index).not.toContain("section: 'settings-reminders'")
  })

  it('removes lay reporting and log notifications from profile nav', () => {
    expect(profile).not.toContain("id: 'settings-logging'")
    expect(profile).not.toContain("id: 'settings-reminders'")
    expect(profile).not.toContain("id: 'settings-supporters'")
    expect(profile).not.toContain('id="settings-logging"')
    expect(profile).not.toContain('id="settings-reminders"')
    expect(profile).not.toContain('id="settings-supporters"')
  })
})
