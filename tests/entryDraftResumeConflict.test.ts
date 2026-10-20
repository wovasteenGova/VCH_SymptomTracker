import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const index = readFileSync('app/pages/index.vue', 'utf8')

describe('entry draft resume conflict', () => {
  it('prompts only when meaningful in-progress work would be replaced', () => {
    expect(index).toContain('shouldPromptBeforeResumeEntryDraft')
    expect(index).toContain('isResumeDraftConflictOpen')
    expect(readFileSync('app/components/settings/TrackerResumeDraftConflictOverlay.vue', 'utf8')).toContain('Finish your current entry first?')
  })

  it('keeps persisted drafts when closeEntryPanel runs with the panel already closed', () => {
    expect(index).toContain('migrateGuestEntryDraftToUser(ownerId)')
    expect(index).toContain('} else if (!editingEntryId.value && wasEntryOpen) {')
    expect(index).toContain('const storedDraft = readEntryDraft(ownerId)')
  })

  it('does not clear storage when autosave sees an empty form after a condition switch', () => {
    expect(index).toContain('Keep the saved draft when the live form is empty')
    expect(index).toMatch(/openEntryPanelInner[\s\S]*whileEntryOpen: true/)
  })

  it('hides the inbox draft row while it matches the open entry panel', () => {
    expect(index).toContain('function readInboxEntryDraftSnapshot')
    expect(index).toContain('entryDraftSnapshotsEqual(snapshot, currentSnapshot)')
    expect(index).toContain('if (!allowWhileEntryOpen && isEntryOpen.value)')
  })
})
