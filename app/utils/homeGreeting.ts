export function resolveTimeOfDayPhrase(date: Date) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return 'good morning'
  }

  if (hour >= 12 && hour < 17) {
    return 'good afternoon'
  }

  if (hour >= 17 && hour < 22) {
    return 'good evening'
  }

  return 'good night'
}

export function resolveGuestGreetingLine(now = new Date()) {
  return `Hey, ${resolveTimeOfDayPhrase(now)}!`
}

export function resolveHomeGreetingLine(options: {
  isSignedIn: boolean
  firstName: string
  greetingWord: 'Hello' | 'Hey' | ''
  now?: Date
}) {
  if (!options.isSignedIn) {
    return resolveGuestGreetingLine(options.now ?? new Date())
  }

  const trimmedName = options.firstName.trim()

  if (!trimmedName) {
    return 'Hey'
  }

  const word = options.greetingWord || 'Hello'
  return `${word}, ${trimmedName}`
}
