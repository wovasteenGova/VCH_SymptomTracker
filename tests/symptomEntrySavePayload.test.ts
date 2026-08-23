import { describe, expect, it } from 'vitest'
import {
  buildSymptomEntrySavePayload,
  buildSymptomEntrySavePayloadFromRecord
} from '../app/utils/symptomEntrySavePayload'

describe('symptom entry save payload', () => {
  it('preserves an existing condition key when editing', () => {
    const payload = buildSymptomEntrySavePayload({
      entryTitle: 'Tracker!',
      severity: 6,
      entryForm: {
        condition_name: 'Tracker!',
        what_happened: 'Updated note'
      },
      conditionKey: 'custom_tracker'
    })

    expect(payload.condition_key).toBe('custom_tracker')
    expect(payload.condition_label).toBe('Tracker!')
    expect(payload.summary).toBe('Updated note')
  })

  it('derives the condition key from the title for new entries', () => {
    const payload = buildSymptomEntrySavePayload({
      entryTitle: 'Tracker!',
      severity: 5,
      entryForm: {
        condition_name: 'Tracker!',
        what_happened: 'First note'
      }
    })

    expect(payload.condition_key).toBe('tracker')
    expect(payload.condition_label).toBe('Tracker!')
  })

  it('keeps the stored key when rebuilding a snapshot from a record', () => {
    const payload = buildSymptomEntrySavePayloadFromRecord(
      {
        condition_key: 'custom_tracker',
        condition_label: 'Tracker!',
        severity: 4,
        summary: 'Original note',
        impact: 'Tired',
        occurred_at: '2026-08-01T10:00:00.000Z',
        details: {
          what_happened: 'Original note',
          daily_impact: 'Tired'
        }
      },
      'Tracker!',
      { customName: 'Tracker!' }
    )

    expect(payload.condition_key).toBe('custom_tracker')
    expect(payload.condition_label).toBe('Tracker!')
  })
})
