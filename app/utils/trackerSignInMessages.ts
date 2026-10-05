export const TRACKER_SIGN_IN = {
  saveEntries: 'Please sign in before saving symptom entries.',
  saveTrackedConditions: 'Please sign in before saving tracked conditions.',
  saveCustomConditions: 'Please sign in before saving custom conditions.',
  manageEntries: 'Please sign in to manage entries.'
} as const

function authFailureMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object') {
    const failure = error as { message?: string, msg?: string, code?: string, error_code?: string }
    return failure.message || failure.msg || failure.error_code || failure.code || ''
  }

  return String(error ?? '')
}

export function isAuthSessionMissingError(error: unknown) {
  const message = authFailureMessage(error)
  const code = error && typeof error === 'object'
    ? String((error as { code?: string, error_code?: string }).error_code
      || (error as { code?: string }).code
      || '')
    : ''

  return /auth session missing|session_not_found|session.*(does not exist|not found|invalid|missing)/i.test(message)
    || /session_not_found|refresh_token_not_found/i.test(code)
}

export function resolveTrackerSignInMessage(error: unknown, fallback: string) {
  if (isAuthSessionMissingError(error)) {
    return fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  const message = authFailureMessage(error)
  return message || 'Something went wrong. Please try again.'
}
