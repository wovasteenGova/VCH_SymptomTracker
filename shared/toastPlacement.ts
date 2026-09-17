/** Top-center stack for login, signup, password reset, and confirm-email feedback. */
export const AUTH_ACCOUNT_TOAST_PLACEMENT = 'auth-top' as const

export type VchToastPlacement = typeof AUTH_ACCOUNT_TOAST_PLACEMENT | 'default'

export function isAuthAccountToast(toast: { placement?: string | null }) {
  return toast.placement === AUTH_ACCOUNT_TOAST_PLACEMENT
}
