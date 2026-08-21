<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const { user, isAuthLoading } = useSupabaseAuth()

watch([user, isAuthLoading], async ([nextUser, loading]) => {
  if (loading || !nextUser) return
  await router.replace('/')
})
</script>

<template>
  <main class="flex h-dvh min-h-0 flex-col overflow-hidden bg-default text-default">
    <VchOpeningWorkspaceLoader
      v-if="isAuthLoading"
      full-screen
      show-brand
      label="Making sure things run smoothly"
    />
    <template v-if="!isAuthLoading">
    <section class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pt-4 sm:max-w-lg">
      <header class="sticky top-0 z-40 -mx-4 flex shrink-0 items-center gap-3 border-b border-default/60 bg-default/95 px-4 pb-4 pt-4 backdrop-blur-md">
        <NuxtLink
          to="/"
          class="grid size-10 shrink-0 place-items-center rounded-full border border-default/80 bg-elevated/40 text-highlighted transition hover:bg-elevated/70"
          aria-label="Back to Symptom Tracker"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
        </NuxtLink>

        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Account
          </p>
          <h1 class="mt-0.5 truncate text-xl font-bold tracking-tight text-highlighted">
            Welcome to Symptom Tracker
          </h1>
        </div>
      </header>

      <div class="mt-6 flex min-h-0 flex-1 flex-col">
        <div class="flex-1 overflow-y-auto no-scrollbar">
          <section class="rounded-2xl border border-default/80 bg-elevated/30 p-5">
            <TrackerAuthPanel />
          </section>

          <p class="mt-4 text-center text-xs leading-5 text-muted">
            Local logs stay in your browser until you sign in.
            <NuxtLink
              to="/"
              class="font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition hover:opacity-80"
            >
              Continue without signing in
            </NuxtLink>
          </p>
        </div>
      </div>
    </section>
    </template>
  </main>
</template>
