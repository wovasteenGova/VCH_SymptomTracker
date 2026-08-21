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
              @reveal="passwordReveal.start"
              :required="true"
              :minlength="8"
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

          <p v-if="formError" class="rounded-2xl border border-red-900 bg-red-950/60 px-4 py-3 text-sm leading-6 text-red-200">
            {{ formError }}
          </p>

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

        <div v-else class="space-y-4 text-center">
          <div class="mx-auto grid size-12 place-items-center rounded-full bg-red-950 ring-1 ring-red-900">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-red-400" />
          </div>
          <h1 class="text-xl font-bold text-white">Reset link invalid</h1>
          <p class="text-sm leading-6 text-slate-400">
            {{ errorMessage }}
          </p>
          <NuxtLink
            to="/"
            class="inline-flex w-full items-center justify-center rounded-3xl bg-white px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Back to sign in
          </NuxtLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { establishSessionFromEmailLink } from '~/composables/useAuthEmailLink'
import { useTimedPasswordReveal } from '~/composables/useTimedPasswordReveal'

definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const status = ref<'loading' | 'ready' | 'success' | 'error'>('loading')
const errorMessage = ref('This password reset link may have expired. Request a new one from the sign-in screen.')
const password = ref('')
const confirmPassword = ref('')
const passwordReveal = useTimedPasswordReveal()
const formError = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  try {
    const { session } = await establishSessionFromEmailLink()

    if (!session) {
      status.value = 'error'
      return
    }

    status.value = 'ready'
  } catch (error) {
    status.value = 'error'

    if (error instanceof Error && error.message) {
      errorMessage.value = error.message
    }
  }
})

async function handleSubmit() {
  formError.value = ''

  if (password.value.length < 8) {
    formError.value = 'Password must be at least 8 characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    formError.value = 'Passwords do not match.'
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
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Could not update your password.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
