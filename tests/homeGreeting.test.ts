import { describe, expect, it } from 'vitest'
import { resolveHomeGreetingLine } from '../app/utils/homeGreeting'

describe('resolveHomeGreetingLine', () => {
  it('uses Hey when signed out', () => {
    expect(resolveHomeGreetingLine({
      isSignedIn: false,
      firstName: 'Sam',
      greetingWord: 'Hello'
    })).toBe('Hey')
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
