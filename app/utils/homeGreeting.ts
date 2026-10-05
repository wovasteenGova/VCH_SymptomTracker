export function resolveHomeGreetingLine(options: {
  isSignedIn: boolean
  firstName: string
  greetingWord: 'Hello' | 'Hey' | ''
}) {
  const trimmedName = options.firstName.trim()

  if (!options.isSignedIn || !trimmedName) {
    return 'Hey'
  }

  const word = options.greetingWord || 'Hello'
  return `${word}, ${trimmedName}`
}
