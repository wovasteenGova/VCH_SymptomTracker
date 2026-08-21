<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 px-4 py-8 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <div class="rounded-4xl border border-slate-800 bg-slate-900 p-6 text-center">
        <div v-if="status === 'loading'" class="space-y-4">
          <VchOpeningWorkspaceLoader
            :full-screen="false"
            show-brand
          />
          <h1 class="text-xl font-bold text-white">Completing sign-in</h1>
          <p class="text-sm leading-6 text-slate-400">
            Please wait while we finish connecting your account.
          </p>
        </div>

        <div v-else-if="status === 'success'" class="space-y-4">
          <div class="mx-auto grid size-12 place-items-center rounded-full bg-emerald-950 ring-1 ring-emerald-800">
            <UIcon name="i-lucide-check-circle" class="size-6 text-emerald-400" />
          </div>
          <h1 class="text-xl font-bold text-white">Signed in</h1>
          <p class="text-sm leading-6 text-slate-400">
            Redirecting you to the symptom tracker...
          </p>
        </div>

        <div v-else class="space-y-4">
          <div class="mx-auto grid size-12 place-items-center rounded-full bg-red-950 ring-1 ring-red-900">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-red-400" />
          </div>
          <h1 class="text-xl font-bold text-white">Sign-in failed</h1>
          <p v-if="!isPkceError" class="text-sm leading-6 text-slate-400">
            {{ errorMessage }}
          </p>
          <NuxtLink
            :to="isPkceError ? '/?login=1' : '/'"
            class="inline-flex w-full items-center justify-center rounded-3xl bg-white px-4 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
            @click="handleTryAgainClick"
          >
            {{ isPkceError ? 'It happens — try again' : 'Try again' }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { clearOAuthFlowMarker, establishSessionFromEmailLink, isPkceVerifierMissingError } from '~/composables/useAuthEmailLink'

definePageMeta({
  layout: false
})

const router = useRouter()
const route = useRoute()
const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('We could not complete sign-in. Please try again.')
const isPkceError = ref(false)

function handleTryAgainClick() {
  clearOAuthFlowMarker()
}

function markPkceError(message: string) {
  isPkceError.value = isPkceVerifierMissingError({ message })
  errorMessage.value = message
  status.value = 'error'
}

function stripAuthQueryFromUrl() {
  if (!import.meta.client) {
    return
  }

  const url = new URL(window.location.href)
  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  url.searchParams.delete('error_description')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

onMounted(async () => {
  const oauthError = typeof route.query.error_description === 'string'
    ? route.query.error_description
    : typeof route.query.error === 'string'
      ? route.query.error
      : ''

  if (oauthError) {
    markPkceError(oauthError)
    stripAuthQueryFromUrl()
    return
  }

  try {
    const { session } = await establishSessionFromEmailLink()

    if (!session) {
      status.value = 'error'
      stripAuthQueryFromUrl()
      return
    }

    status.value = 'success'
    window.sessionStorage.setItem('symptom-tracker-auth-success', '1')
    stripAuthQueryFromUrl()

    window.setTimeout(() => {
      router.push('/')
    }, 1200)
  } catch (error) {
    const supabase = useSupabaseClient()
    const { data: { session: recoveredSession } } = await supabase.auth.getSession()

    // Supabase may finish OAuth in the background after our first exchange attempt.
    if (recoveredSession) {
      status.value = 'success'
      window.sessionStorage.setItem('symptom-tracker-auth-success', '1')
      stripAuthQueryFromUrl()

      window.setTimeout(() => {
        router.push('/')
      }, 1200)
      return
    }

    status.value = 'error'

    if (error instanceof Error && error.message) {
      markPkceError(error.message)
    }

    stripAuthQueryFromUrl()
  }
})
</script>
