import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const app = readFileSync('app/app.vue', 'utf8')
const toaster = readFileSync('app/components/VchGroupedToaster.vue', 'utf8')
const groupedToastPlugin = readFileSync('app/plugins/grouped-toast.client.ts', 'utf8')
const laySettings = readFileSync('app/composables/useTrackerLayReportingSettings.ts', 'utf8')
const layOverlay = readFileSync('app/components/settings/TrackerLayReportingSettingsOverlay.vue', 'utf8')
const accountMenu = readFileSync('app/components/TrackerAccountMenu.vue', 'utf8')
const index = readFileSync('app/pages/index.vue', 'utf8')

function functionBody(source: string, name: string) {
  const start = source.indexOf(`async function ${name}`)
  expect(start).toBeGreaterThan(-1)
  const remainder = source.slice(start + 1)
  const nextMatch = remainder.match(/\n\s*async function /)
  const next = nextMatch?.index
  return next === undefined ? source.slice(start) : source.slice(start, start + 1 + next)
}

describe('supporter share link create UX', () => {
  it('uses the grouped app toaster without the default Nuxt toaster', () => {
    expect(app).toContain('<UApp :toaster="null">')
    expect(app).toContain('<VchGroupedToaster')
    expect(toaster).toContain('<ToastPortal')
    expect(toaster).toContain('<ToastViewport')
    expect(groupedToastPlugin).toContain('resolveToastGroupKey')
    expect(groupedToastPlugin).toContain('$vchToast')
    expect(accountMenu).toContain('[data-slot="viewport"]')
    expect(accountMenu).toContain('!activeToast')
  })

  it('creates a link then requires an explicit copy click', () => {
    const createBody = functionBody(laySettings, 'createSupporter')
    const existingCopyBody = functionBody(laySettings, 'copyExistingSupporterLink')
    const copyBody = functionBody(laySettings, 'copyCreatedLink')

    expect(createBody).not.toContain('copyToClipboard')
    expect(createBody).toContain('revealCreatedLink')
    expect(createBody).toContain('Reporting link created. Copy it below.')
    expect(createBody).toContain("tone: 'error'")

    expect(existingCopyBody).not.toContain('copyToClipboard')
    expect(existingCopyBody).toContain('revealCreatedLink')
    expect(existingCopyBody).toContain('Private link ready. Copy it below.')

    expect(copyBody).toContain('copyToClipboard(createdLink.value)')
    expect(layOverlay).toContain('Click Copy link to put this URL on the clipboard.')
    expect(index).toContain('Click Copy link to put this URL on the clipboard.')
  })

  it('uses the tracked-first share condition picker', () => {
    expect(laySettings).toContain('buildShareConditionPickerLabels')
    expect(laySettings).toContain('shareConditionOptions')
    expect(layOverlay).toContain('Conditions to share')
    expect(layOverlay).not.toContain("'PTSD / Mental Health'")
  })
})
