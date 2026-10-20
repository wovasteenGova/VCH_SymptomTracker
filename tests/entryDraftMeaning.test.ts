import { describe, expect, it } from 'vitest'
import {
  buildEntryDraftSnapshot,
  entryDraftSnapshotsEqual,
  isEntryDraftLimitReached,
  isMeaningfulEntryDraft,
  parseEntryDraftStore,
  shouldPromptBeforeResumeEntryDraft,
  upsertEntryDraftList,
  type EntryDraftSnapshot
} from '../app/composables/useEntryDraft'

const condition = {
  title: 'Knee pain',
  category: 'Musculoskeletal',
  description: '',
  image: ''
}

describe('entry draft meaning', () => {
  it('does not save a draft just for opening a condition or navigating to the last step', () => {
    const input = {
      entryStep: 8,
      severityValue: 5,
      selectedSearchCondition: condition,
      customConditionInput: '',
      conditionTitle: condition.title,
      entryForm: {
        date_and_time: '2026-09-13T12:00',
        pdf_condition_statement: 'Prefilled from a prior log'
      }
    }

    expect(isMeaningfulEntryDraft(input)).toBe(false)
    expect(buildEntryDraftSnapshot(input)).toBeNull()
  })

  it('does not turn a custom condition name alone into an entry', () => {
    expect(isMeaningfulEntryDraft({
      entryStep: 2,
      severityValue: 5,
      customConditionInput: 'My condition',
      entryForm: { condition_name: 'My condition' }
    })).toBe(false)
  })

  it('retains drafts with a selected symptom or changed severity', () => {
    expect(isMeaningfulEntryDraft({ entryForm: { daily_impact: 'Could not climb stairs' } })).toBe(true)
    expect(isMeaningfulEntryDraft({ severityValue: 7, entryForm: {} })).toBe(true)
  })

  it('compares stored drafts for resume conflicts', () => {
    const base: EntryDraftSnapshot = {
      version: 1,
      id: 'draft-knee',
      savedAt: '2026-09-13T12:00:00.000Z',
      entryStep: 2,
      severityValue: 6,
      entryForm: { daily_impact: 'Skipped chores' },
      selectedSearchCondition: condition,
      customConditionInput: '',
      conditionTitle: condition.title
    }

    expect(entryDraftSnapshotsEqual(base, { ...base, savedAt: '2026-09-14T12:00:00.000Z' })).toBe(true)
    expect(entryDraftSnapshotsEqual(base, { ...base, severityValue: 7 })).toBe(false)
    expect(entryDraftSnapshotsEqual(base, { ...base, conditionTitle: 'Back pain' })).toBe(false)
    expect(entryDraftSnapshotsEqual(base, { ...base, id: 'draft-other' })).toBe(true)
  })

  it('keeps a saved draft when another log is saved', () => {
    const stored = {
      version: 2,
      drafts: [{
        version: 1,
        id: 'draft-knee',
        savedAt: '2026-10-20T12:00:00.000Z',
        entryStep: 2,
        severityValue: 6,
        entryForm: { daily_impact: 'Skipped chores' },
        selectedSearchCondition: condition,
        customConditionInput: '',
        conditionTitle: 'Knee pain'
      }]
    }

    const existing = parseEntryDraftStore(stored)
    const nextLog = buildEntryDraftSnapshot({
      id: 'draft-back',
      entryStep: 2,
      severityValue: 5,
      entryForm: { what_happened: 'Stiff in the morning' },
      selectedSearchCondition: { ...condition, title: 'Back pain' },
      customConditionInput: '',
      conditionTitle: 'Back pain'
    })

    expect(nextLog).not.toBeNull()
    const saved = upsertEntryDraftList(existing, nextLog!)
    expect(saved.map(draft => draft.id)).toEqual(['draft-back', 'draft-knee'])
  })

  it('blocks a fourth draft and still allows updates to an existing one', () => {
    const drafts = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' }
    ]

    expect(isEntryDraftLimitReached(drafts, null)).toBe(true)
    expect(isEntryDraftLimitReached(drafts, 'b')).toBe(false)
    expect(isEntryDraftLimitReached(drafts.slice(0, 2), null)).toBe(false)
  })

  it('prompts only when a fourth draft would overflow the 3-draft limit', () => {
    expect(shouldPromptBeforeResumeEntryDraft({
      alreadyEditingStoredDraft: false,
      hasMeaningfulCurrentEntry: true,
      draftLimitReached: false
    })).toBe(false)

    expect(shouldPromptBeforeResumeEntryDraft({
      alreadyEditingStoredDraft: false,
      hasMeaningfulCurrentEntry: true,
      draftLimitReached: true
    })).toBe(true)

    expect(shouldPromptBeforeResumeEntryDraft({
      alreadyEditingStoredDraft: true,
      hasMeaningfulCurrentEntry: true,
      draftLimitReached: true
    })).toBe(false)
  })
})
