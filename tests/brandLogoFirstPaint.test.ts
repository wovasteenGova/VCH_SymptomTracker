import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('VCH brand logo first paint', () => {
  it('preloads and eagerly decodes the tracker header logo', () => {
    const component = readFileSync('app/components/VchBrandMark.vue', 'utf8')
    const config = readFileSync('nuxt.config.ts', 'utf8')

    expect(component).toContain('loading="eager"')
    expect(component).toContain('decoding="sync"')
    expect(component).toContain('fetchpriority="high"')
    expect(component).not.toContain('loading="lazy"')
    expect(config).toContain("href: '/brand/vch-symptom-tracker-logo.png'")
    expect(config).toContain("rel: 'preload'")
  })
})
