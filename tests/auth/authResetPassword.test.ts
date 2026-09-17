import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('auth reset password page', () => {
  it('reuses the confirm PKCE exchange path', () => {
    const source = readFileSync('app/composables/useAuthEmailLink.ts', 'utf8')
    expect(source).toContain("const isResetPasswordRoute = routePath === '/auth/reset-password'")
    expect(source).toContain('if (isConfirmRoute || isResetPasswordRoute)')
  })

  it('lets veterans open reset links in any browser and uses privacy loading copy', () => {
    const page = readFileSync('app/pages/auth/reset-password.vue', 'utf8')
    const notices = readFileSync('app/utils/authNotices.ts', 'utf8')
    const mailer = readFileSync('app/utils/passwordResetEmail.ts', 'utf8')

    expect(notices).toContain('passwordResetInvalidLink')
    expect(notices).toContain('passwordResetPrivacy')
    expect(notices).not.toContain('Gmail may have opened')
    expect(page).toContain('AUTH_NOTICES.passwordResetInvalidLink')
    expect(page).toContain('AUTH_NOTICES.passwordResetPrivacy')
    expect(page).toContain('isPkceVerifierMissingError')
    expect(page).toContain('Send a new reset link')
    expect(page).not.toContain('from this browser')
    expect(page).not.toContain('PKCE code verifier not found')
    expect(mailer).toContain("flowType: 'implicit'")
  })

  it('keeps password reset toasts on the panel, not inside sendPasswordReset', () => {
    const auth = readFileSync('app/composables/useSupabaseAuth.ts', 'utf8')
    const start = auth.indexOf('async function sendPasswordReset')
    const end = auth.indexOf('async function signOut', start)
    const body = auth.slice(start, end)

    expect(body).not.toContain('showSubmissionToast')
    expect(body).not.toContain('toast.add')

    const panel = readFileSync('app/components/TrackerAuthPanel.vue', 'utf8')
    expect(panel).toContain('AUTH_NOTICES.passwordResetSent')
    expect(panel).toContain('AUTH_NOTICES.confirmationEmailSent')
  })

  it('keeps recovery query params when confirm forwards to reset-password', () => {
    const confirm = readFileSync('app/pages/auth/confirm.vue', 'utf8')
    expect(confirm).toContain('/auth/reset-password${window.location.search}${window.location.hash}')
  })
})

describe('tracker auth overlay scroll', () => {
  it('uses the ClaimBuilder desktop sign-in card scroll shell', () => {
    const menu = readFileSync('app/components/TrackerAccountMenu.vue', 'utf8')

    expect(menu).toContain('flex h-auto min-h-0 max-h-[min(80dvh,36rem)] flex-col overflow-y-auto overscroll-contain')
    expect(menu).toContain('class="min-h-0"')
    expect(menu).not.toContain("overflow-y-auto overscroll-contain rounded-2xl")
  })
})
