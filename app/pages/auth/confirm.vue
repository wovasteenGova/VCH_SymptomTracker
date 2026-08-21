<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 px-4 py-8 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <div class="rounded-4xl border border-slate-800 bg-slate-900 p-6">
        <div v-if="status === 'loading'" class="space-y-4 text-center">
          <VchOpeningWorkspaceLoader
            :full-screen="false"
            show-brand
          />
          <h1 class="text-xl font-bold text-white">Confirming your email</h1>
          <p class="text-sm leading-6 text-slate-400">
            Hang tight while we verify your account.
          </p>
        </div>

        <div v-else-if="status === 'success'" class="space-y-4 text-center">
          <div class="mx-auto grid size-12 place-items-center rounded-full bg-emerald-950 ring-1 ring-emerald-800">
            <UIcon name="i-lucide-check-circle" class="size-6 text-emerald-400" />
          </div>
          <h1 class="text-xl font-bold text-white">Email confirmed</h1>
          <p class="text-sm leading-6 text-slate-400">
            You are signed in. Opening the symptom tracker...
          </p>
        </div>

        <div v-else-if="status === 'confirmed'" class="space-y-4 text-center">
          <div class="mx-auto grid size-12 place-items-center rounded-full bg-emerald-950 ring-1 ring-emerald-800">
            <UIcon name="i-lucide-mail-check" class="size-6 text-emerald-400" />
          </div>
          <h1 class="text-xl font-bold text-white">Email confirmed</h1>
          <p class="text-sm leading-6 text-slate-400">
            Your account is verified. Sign in with your password to continue.
          </p>
          <NuxtLink
            to="/?login=1"
            class="inline-flex w-full items-center justify-center rounded-3xl bg-white px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Sign in
          </NuxtLink>
        </div>

        <div v-else class="space-y-4 text-center">
          <div class="mx-auto grid size-12 place-items-center rounded-full bg-red-950 ring-1 ring-red-900">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-red-400" />
          </div>
          <h1 class="text-xl font-bold text-white">Confirmation failed</h1>
          <p class="text-sm leading-6 text-slate-400">
            {{ errorMessage }}
          </p>
          <div class="flex flex-col gap-3">
            <NuxtLink
              to="/?login=1"
              class="inline-flex w-full items-center justify-center rounded-3xl bg-white px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Back to sign in
            </NuxtLink>
            <NuxtLink
              to="/profile"
              class="inline-flex w-full items-center justify-center rounded-3xl border border-slate-700 px-4 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Open profile
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { establishSessionFromEmailLink, isPkceVerifierMissingError } from '~/composables/useAuthEmailLink'

definePageMeta({
  layout: false
})

const router = useRouter()
const status = ref<'loading' | 'success' | 'confirmed' | 'error'>('loading')
const errorMessage = ref('This link may have expired. Request a new confirmation email from the sign-in screen.')

function stripAuthQueryFromUrl() {
  if (!import.meta.client) {
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('token_hash')
  url.searchParams.delete('type')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

onMounted(async () => {
  try {
    const { session, linkType, status: linkStatus } = await establishSessionFromEmailLink()

    if (linkType === 'recovery') {
      await router.replace('/auth/reset-password')
      return
    }

    stripAuthQueryFromUrl()

    if (linkStatus === 'confirmed-needs-sign-in') {
      status.value = 'confirmed'
      return
    }

    if (!session) {
      status.value = 'error'
      return
    }

    status.value = 'success'
    window.sessionStorage.setItem('symptom-tracker-auth-success', '1')

    window.setTimeout(() => {
      router.push('/')
    }, 1800)
  } catch (error) {
    stripAuthQueryFromUrl()

    if (isPkceVerifierMissingError(error)) {
      status.value = 'confirmed'
      return
    }

    status.value = 'error'

    if (error instanceof Error && error.message) {
      errorMessage.value = error.message
    }
  }
})
</script>
