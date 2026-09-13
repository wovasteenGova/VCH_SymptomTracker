import { describe, expect, it } from 'vitest'
import { buildEntryDraftSnapshot, isMeaningfulEntryDraft } from '../app/composables/useEntryDraft'

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
})
