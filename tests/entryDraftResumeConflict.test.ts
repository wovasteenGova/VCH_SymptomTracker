import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const index = readFileSync('app/pages/index.vue', 'utf8')

describe('entry draft resume conflict', () => {
  it('prompts when the entry panel is open before switching drafts', () => {
    expect(index).toContain('function shouldPromptBeforeResumeDraft')
    expect(index).toContain('if (isEntryOpen.value) {')
    expect(index).toContain('return true')
    expect(index).toContain('isResumeDraftConflictOpen')
    expect(index).toContain('Finish your current entry first?')
  })

  it('keeps persisted drafts when closeEntryPanel runs with the panel already closed', () => {
    expect(index).toContain('migrateGuestEntryDraftToUser(ownerId)')
    expect(index).toContain('} else if (!editingEntryId.value && wasEntryOpen) {')
    expect(index).toContain('const storedDraft = readEntryDraft(ownerId)')
  })
})
