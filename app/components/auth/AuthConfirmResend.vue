<script setup lang="ts">
import {
  AUTH_NOTICES,
  AUTH_VALIDATION,
  authErrorToast,
  authNoticeToast,
  handleAuthApiFailure,
  resolveAuthApiErrorMessage
} from '../../utils/authNotices'
import { markPendingConfirmEmail, readPendingConfirmEmail } from '../../utils/pendingConfirmEmail'

const email = ref(readPendingConfirmEmail())
const submitting = ref(false)
const { resendConfirmationEmail, authError } = useSupabaseAuth()
const { showSubmissionToast } = useSubmissionToast()
const { isEmailCooldownActive, resendConfirmationLabel, refreshCooldown } = useAuthEmailCooldown(email)

const fieldClass = 'w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15'
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-300'

async function onResend() {
  if (!email.value.trim()) {
    showSubmissionToast(authErrorToast(AUTH_VALIDATION.enterEmailForResendConfirmation))
    return
  }

  submitting.value = true

  try {
    await resendConfirmationEmail(email.value)
    markPendingConfirmEmail(email.value)
    refreshCooldown()
    showSubmissionToast(authNoticeToast(AUTH_NOTICES.confirmationEmailSent))
  } catch {
    handleAuthApiFailure({
      message: resolveAuthApiErrorMessage(authError.value, 'Could not resend confirmation email.'),
      authEmail: email.value,
      setValidationMessage: () => {},
      clearAuthError: () => {
        authError.value = ''
      },
      showToast: showSubmissionToast
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mt-5 space-y-3 border-t border-slate-800 pt-4 text-left">
    <p class="text-xs leading-5 text-slate-400">
      Need a fresh link? Enter your email and we will send another confirmation message.
    </p>

    <label class="block">
      <span :class="labelClass">Email</span>
      <input
        v-model="email"
        type="email"
        autocomplete="email"
        inputmode="email"
        autocapitalize="none"
        :class="fieldClass"
        placeholder="you@example.com"
        required
      >
    </label>

    <button
      type="button"
      class="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="submitting || isEmailCooldownActive"
      @click="onResend"
    >
      {{ submitting ? 'Sending…' : resendConfirmationLabel }}
    </button>
  </div>
</template>
