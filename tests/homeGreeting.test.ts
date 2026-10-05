import { describe, expect, it } from 'vitest'
import {
  resolveGuestGreetingLine,
  resolveHomeGreetingLine,
  resolveTimeOfDayPhrase
} from '../app/utils/homeGreeting'

describe('resolveTimeOfDayPhrase', () => {
  it('picks morning, afternoon, evening, and night', () => {
    expect(resolveTimeOfDayPhrase(new Date('2026-10-05T09:00:00'))).toBe('good morning')
    expect(resolveTimeOfDayPhrase(new Date('2026-10-05T14:00:00'))).toBe('good afternoon')
    expect(resolveTimeOfDayPhrase(new Date('2026-10-05T19:00:00'))).toBe('good evening')
    expect(resolveTimeOfDayPhrase(new Date('2026-10-05T23:00:00'))).toBe('good night')
  })
})

describe('resolveHomeGreetingLine', () => {
  it('uses a time-of-day hey greeting when signed out', () => {
    expect(resolveHomeGreetingLine({
      isSignedIn: false,
      firstName: 'Sam',
      greetingWord: 'Hello',
      now: new Date('2026-10-05T09:00:00')
    })).toBe('Hey, good morning!')
  })

  it('uses Hey when signed in without a first name', () => {
    expect(resolveHomeGreetingLine({
      isSignedIn: true,
      firstName: '',
      greetingWord: 'Hello'
    })).toBe('Hey')
  })

  it('uses the greeting word and first name when both are available', () => {
    expect(resolveHomeGreetingLine({
      isSignedIn: true,
      firstName: 'Jordan',
      greetingWord: 'Hey'
    })).toBe('Hey, Jordan')
  })
})

describe('resolveGuestGreetingLine', () => {
  it('formats the guest greeting with an exclamation', () => {
    expect(resolveGuestGreetingLine(new Date('2026-10-05T14:30:00'))).toBe('Hey, good afternoon!')
  })
})
