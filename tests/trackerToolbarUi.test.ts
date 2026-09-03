import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildClaimBuilderUrl } from '../app/utils/claimBuilderLinks'
import { CLAIMBUILDER_ACTION, LAY_REPORTING_ACTION } from '../app/utils/trackerToolbarUi'

describe('tracker toolbar actions', () => {
  it('defines ClaimBuilder and Lay Reporting labels', () => {
    expect(CLAIMBUILDER_ACTION.label).toBe('Open ClaimBuilder')
    expect(LAY_REPORTING_ACTION.label).toBe('Lay Reporting')
  })

  it('builds a normalized ClaimBuilder URL', () => {
    expect(buildClaimBuilderUrl({ claimBuilderUrl: 'https://claimbuilder.veteranscentralhub.com/' }))
      .toBe('https://claimbuilder.veteranscentralhub.com')
    expect(buildClaimBuilderUrl()).toBe('https://claimbuilder.veteranscentralhub.com')
  })

  it('keeps ClaimBuilder on the current TLD', () => {
    expect(buildClaimBuilderUrl({
      claimBuilderUrl: 'https://claimbuilder.veteranscentralhub.us/',
      hostname: 'tracker.veteranscentralhub.com'
    })).toBe('https://claimbuilder.veteranscentralhub.com')
  })

  it('renders Open ClaimBuilder left of Lay Reporting in the tracker header', () => {
    const index = readFileSync('app/pages/index.vue', 'utf8')
    const toolbar = index.slice(
      index.indexOf('CLAIMBUILDER_ACTION.tooltip'),
      index.indexOf('LAY_REPORTING_ACTION.tooltip')
    )
    expect(toolbar).toContain('openClaimBuilder')
    expect(toolbar).toContain('{{ CLAIMBUILDER_ACTION.label }}')
    expect(index.indexOf('CLAIMBUILDER_ACTION.tooltip')).toBeLessThan(index.indexOf('LAY_REPORTING_ACTION.tooltip'))
  })
})
