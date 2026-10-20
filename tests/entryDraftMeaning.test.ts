import { describe, expect, it } from 'vitest'
import {
  buildEntryDraftSnapshot,
  entryDraftSnapshotsEqual,
  isMeaningfulEntryDraft,
  shouldPromptBeforeResumeEntryDraft,
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
  })

  it('only prompts before resume when meaningful work would be replaced', () => {
    const stored: EntryDraftSnapshot = {
      version: 1,
      savedAt: '2026-09-13T12:00:00.000Z',
      entryStep: 2,
      severityValue: 6,
      entryForm: { daily_impact: 'Skipped chores' },
      selectedSearchCondition: condition,
      customConditionInput: '',
      conditionTitle: condition.title
    }

    const emptyNewEntry = {
      entryStep: 3,
      severityValue: 5,
      entryForm: { pdf_condition_statement: 'Prefilled' },
      selectedSearchCondition: condition,
      customConditionInput: ''
    }

    expect(shouldPromptBeforeResumeEntryDraft({
      editingEntryId: null,
      stored,
      current: emptyNewEntry,
      currentMeaningfulSnapshot: buildEntryDraftSnapshot({
        ...emptyNewEntry,
        conditionTitle: 'Other condition'
      })
    })).toBe(false)

    expect(shouldPromptBeforeResumeEntryDraft({
      editingEntryId: null,
      stored,
      current: {
        entryStep: 2,
        severityValue: 5,
        entryForm: { daily_impact: 'New note' },
        selectedSearchCondition: condition,
        customConditionInput: ''
      },
      currentMeaningfulSnapshot: buildEntryDraftSnapshot({
        entryStep: 2,
        severityValue: 5,
        entryForm: { daily_impact: 'New note' },
        selectedSearchCondition: condition,
        customConditionInput: '',
        conditionTitle: condition.title
      })
    })).toBe(true)

    expect(shouldPromptBeforeResumeEntryDraft({
      editingEntryId: 'entry-1',
      stored,
      current: emptyNewEntry,
      currentMeaningfulSnapshot: null
    })).toBe(true)
  })
})
