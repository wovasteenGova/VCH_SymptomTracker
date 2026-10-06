/** Block getSession recovery briefly after intentional sign-out (avoids stale UI). */
export function useAuthSessionRecovery() {
  const blockedUntil = useState('tracker-auth-recovery-blocked-until', () => 0)

  function blockAuthSessionRecovery(durationMs = 5000) {
    blockedUntil.value = Date.now() + Math.max(0, durationMs)
  }

  function clearAuthSessionRecoveryBlock() {
    blockedUntil.value = 0
  }

  function isAuthSessionRecoveryBlocked() {
    return Date.now() < blockedUntil.value
  }

  return {
    blockAuthSessionRecovery,
    clearAuthSessionRecoveryBlock,
    isAuthSessionRecoveryBlocked
  }
}
