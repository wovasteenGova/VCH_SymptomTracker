import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const app = readFileSync('app/app.vue', 'utf8')
const toaster = readFileSync('app/components/VchGroupedToaster.vue', 'utf8')
const groupedToastPlugin = readFileSync('app/plugins/grouped-toast.client.ts', 'utf8')
const profile = readFileSync('app/pages/profile.vue', 'utf8')
const accountMenu = readFileSync('app/components/TrackerAccountMenu.vue', 'utf8')
const index = readFileSync('app/pages/index.vue', 'utf8')

function functionBody(source: string, name: string) {
  const start = source.indexOf(`async function ${name}`)
  expect(start).toBeGreaterThan(-1)
  const next = source.indexOf('\nasync function ', start + 1)
  return source.slice(start, next === -1 ? undefined : next)
}

describe('supporter share link create UX', () => {
  it('uses the grouped app toaster without the default Nuxt toaster', () => {
    expect(app).toContain('<UApp :toaster="null">')
    expect(app).toContain('<VchGroupedToaster')
    expect(toaster).toContain('<ToastPortal')
    expect(toaster).toContain('<ToastViewport')
    expect(groupedToastPlugin).toContain('resolveToastGroupKey')
    expect(accountMenu).toContain('[data-slot="viewport"]')
    expect(accountMenu).toContain('!activeToast')
  })

  it('creates a link then requires an explicit copy click', () => {
    const createBody = functionBody(profile, 'createSupporter')
    const existingCopyBody = functionBody(profile, 'copyExistingSupporterLink')
    const copyBody = functionBody(profile, 'copyCreatedLink')

    expect(createBody).not.toContain('copyToClipboard')
    expect(createBody).toContain('revealCreatedLink')
    expect(createBody).toContain('Reporting link created. Copy it below.')
    expect(createBody).toContain("tone: 'error'")

    expect(existingCopyBody).not.toContain('copyToClipboard')
    expect(existingCopyBody).toContain('revealCreatedLink')
    expect(existingCopyBody).toContain('Private link ready. Copy it below.')

    expect(copyBody).toContain('copyToClipboard(createdLink.value)')
    expect(profile).toContain('Click Copy link to put this URL on the clipboard.')
    expect(index).toContain('Click Copy link to put this URL on the clipboard.')
  })

  it('uses the tracked-first share condition picker', () => {
    expect(profile).toContain('buildShareConditionPickerLabels')
    expect(profile).toContain('shareConditionOptions')
    expect(profile).toContain('Conditions to share')
    expect(profile).not.toContain("'PTSD / Mental Health'")
  })
})
