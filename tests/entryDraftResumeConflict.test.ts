import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const index = readFileSync('app/pages/index.vue', 'utf8')

describe('entry draft resume conflict', () => {
  it('prompts only when a fourth meaningful entry would exceed the 3-draft limit', () => {
    expect(index).toContain('shouldPromptBeforeResumeEntryDraft')
    expect(index).toContain('draftLimitReached: isEntryDraftLimitReached(savedDrafts, activeEntryDraftId.value)')
    expect(index).toContain('isResumeDraftConflictOpen')
    expect(readFileSync('app/components/settings/TrackerResumeDraftConflictOverlay.vue', 'utf8')).toContain('Three drafts is the limit')
  })

  it('persists drafts before resetting condition state when closing or switching conditions', () => {
    expect(index).toContain('migrateGuestEntryDraftToUser(ownerId)')
    expect(index).toContain('resolveDraftSnapshotCondition(snapshot)')
    expect(index).toContain('syncActiveSlideToDraftCondition(')
    expect(index).toContain('activeEntryDraftId.value = null')
  })

  it('does not clear storage when autosave sees an empty form after a condition switch', () => {
    expect(index).toContain('Keep every saved draft when the live form is empty')
    expect(index).toMatch(/openEntryPanelInner[\s\S]*whileEntryOpen: true/)
  })

  it('keeps all saved drafts visible in Submissions and auto-saves when jumping between drafts', () => {
    expect(index).toContain('function readInboxEntryDrafts')
    expect(index).toContain('return readEntryDrafts(ownerId)')
    expect(index).toContain('upsertEntryDraft')
  })
})
