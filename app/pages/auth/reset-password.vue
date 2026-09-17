<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 px-4 py-8 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <div class="rounded-4xl border border-slate-800 bg-slate-900 p-6">
        <div v-if="status === 'loading'" class="space-y-4 text-center">
          <VchOpeningWorkspaceLoader
            :full-screen="false"
            show-brand
          />
          <h1 class="text-xl font-bold text-white">Verifying reset link</h1>
          <p class="text-sm leading-6 text-slate-400">
            Checking your secure password reset session.
          </p>
        </div>

        <form v-else-if="status === 'ready'" class="space-y-5" @submit.prevent="handleSubmit">
          <div class="space-y-2 text-center">
            <h1 class="text-xl font-bold text-white">Choose a new password</h1>
            <p class="text-sm leading-6 text-slate-400">
              Enter a new password for your symptom tracker account.
            </p>
          </div>

          <label class="block">
            <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">New password</span>
            <PasswordInput
              v-model="password"
              tone="dark"
              autocomplete="new-password"
              name="new-password"
              placeholder="At least 8 characters"
              :revealed="passwordReveal.visible"
              :countdown="passwordReveal.countdown"
              :required="true"
              :minlength="8"
              @reveal="passwordReveal.start"
            />
          </label>

          <label class="block">
            <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Confirm password</span>
            <PasswordInput
              v-model="confirmPassword"
              tone="dark"
              autocomplete="new-password"
              name="confirm-password"
              placeholder="Repeat new password"
              :revealed="passwordReveal.visible"
              :show-toggle="false"
              :required="true"
              :minlength="8"
            />
          </label>

          <button
            type="submit"
            class="inline-flex w-full items-center justify-center rounded-3xl bg-white px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Saving password...' : 'Update password' }}
          </button>
        </form>

        <div v-else-if="status === 'success'" class="space-y-4 text-center">
          <div class="mx-auto grid size-12 place-items-center rounded-full bg-emerald-950 ring-1 ring-emerald-800">
            <UIcon name="i-lucide-check-circle" class="size-6 text-emerald-400" />
          </div>
          <h1 class="text-xl font-bold text-white">Password updated</h1>
          <p class="text-sm leading-6 text-slate-400">
            Your new password is saved. You can sign in with it now.
          </p>
          <NuxtLink
            to="/"
            class="inline-flex w-full items-center justify-center rounded-3xl bg-white px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Open symptom tracker
          </NuxtLink>
        </div>

        <div v-else class="space-y-4 text-left">
          <div class="space-y-2 text-center">
            <div class="mx-auto grid size-12 place-items-center rounded-full bg-red-950 ring-1 ring-red-900">
              <UIcon name="i-lucide-alert-circle" class="size-6 text-red-400" />
            </div>
            <h1 class="text-xl font-bold text-white">Could not open this reset link</h1>
            <p class="text-sm leading-6 text-slate-400">
              {{ errorMessage }}
            </p>
          </div>

          <form
            class="space-y-3"
            @submit.prevent="onRequestNewLink"
          >
            <label class="block">
              <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Email</span>
              <input
                v-model="resetEmail"
                type="email"
                autocomplete="email"
                class="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/40"
                placeholder="you@example.com"
                :disabled="sendingReset"
                required
              >
            </label>
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-3xl bg-white px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="sendingReset"
            >
              {{ sendingReset ? 'Sending...' : 'Send a new reset link from this browser' }}
            </button>
          </form>

          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            :disabled="googleSubmitting"
            @click="onGoogleSignIn"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { establishSessionFromEmailLink, isPkceVerifierMissingError } from '~/composables/useAuthEmailLink'
import { useTimedPasswordReveal } from '~/composables/useTimedPasswordReveal'
import {
  AUTH_NOTICES,
  AUTH_VALIDATION,
  authErrorToast,
  authNoticeToast
} from '~/utils/authNotices'

definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const { sendPasswordReset, signInWithGoogle, authError } = useSupabaseAuth()
const status = ref<'loading' | 'ready' | 'success' | 'error'>('loading')
const errorMessage = ref(AUTH_NOTICES.passwordResetWrongBrowser)
const password = ref('')
const confirmPassword = ref('')
const resetEmail = ref('')
const passwordReveal = useTimedPasswordReveal()
const isSubmitting = ref(false)
const sendingReset = ref(false)
const googleSubmitting = ref(false)
const { showSubmissionToast } = useSubmissionToast()

onMounted(async () => {
  try {
    const { session, status: linkStatus } = await establishSessionFromEmailLink()

    if (session) {
      status.value = 'ready'
      return
    }

    status.value = 'error'
    if (linkStatus === 'confirmed-needs-sign-in') {
      errorMessage.value = AUTH_NOTICES.passwordResetWrongBrowser
    }
  } catch (error) {
    status.value = 'error'
    errorMessage.value = isPkceVerifierMissingError(error)
      ? AUTH_NOTICES.passwordResetWrongBrowser
      : (error instanceof Error && error.message ? error.message : AUTH_NOTICES.passwordResetWrongBrowser)
  }
})

async function onRequestNewLink() {
  if (!resetEmail.value.trim()) {
    showSubmissionToast(authErrorToast(AUTH_VALIDATION.enterEmailForForgotPassword))
    return
  }

  sendingReset.value = true

  try {
    await sendPasswordReset(resetEmail.value)
    showSubmissionToast(authNoticeToast(AUTH_NOTICES.passwordResetSent))
  } catch {
    showSubmissionToast(authErrorToast(authError.value || 'Could not send reset email.'))
  } finally {
    sendingReset.value = false
  }
}

async function onGoogleSignIn() {
  googleSubmitting.value = true

  try {
    await signInWithGoogle()
  } catch {
    showSubmissionToast(authErrorToast(authError.value || 'Google sign-in failed.'))
    googleSubmitting.value = false
  }
}

async function handleSubmit() {
  if (password.value.length < 8) {
    showSubmissionToast({ message: 'Password must be at least 8 characters.', tone: 'error' })
    return
  }

  if (password.value !== confirmPassword.value) {
    showSubmissionToast({ message: 'Passwords do not match.', tone: 'error' })
    return
  }

  isSubmitting.value = true

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })

    if (error) {
      throw error
    }

    status.value = 'success'
    showSubmissionToast('Password updated.')
  } catch (error) {
    showSubmissionToast({
      message: error instanceof Error ? error.message : 'Could not update your password.',
      tone: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
