import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const index = readFileSync('app/pages/index.vue', 'utf8')

describe('entry draft resume conflict', () => {
  it('prompts only when meaningful in-progress work would be replaced', () => {
    expect(index).toContain('shouldPromptBeforeResumeEntryDraft')
    expect(index).toContain('hasVisitedEntryStepTwo')
    expect(index).toContain('isResumeDraftConflictOpen')
    expect(readFileSync('app/components/settings/TrackerResumeDraftConflictOverlay.vue', 'utf8')).toContain('Finish your current entry first?')
    expect(readFileSync('app/components/settings/TrackerResumeDraftConflictOverlay.vue', 'utf8')).toContain('Three drafts is the limit')
  })

  it('keeps persisted drafts when closeEntryPanel runs with the panel already closed', () => {
    expect(index).toContain('migrateGuestEntryDraftToUser(ownerId)')
    expect(index).toContain('} else if (!editingEntryId.value && wasEntryOpen) {')
    expect(index).toContain('activeEntryDraftId.value = null')
  })

  it('does not clear storage when autosave sees an empty form after a condition switch', () => {
    expect(index).toContain('Keep every saved draft when the live form is empty')
    expect(index).toMatch(/openEntryPanelInner[\s\S]*whileEntryOpen: true/)
  })

  it('lists every saved draft except the one open in the entry panel', () => {
    expect(index).toContain('function readInboxEntryDrafts')
    expect(index).toContain('activeEntryDraftId.value === draft.id')
    expect(index).toContain('upsertEntryDraft')
  })
})
