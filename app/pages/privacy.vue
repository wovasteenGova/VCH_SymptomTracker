<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5 sm:max-w-lg">
      <header class="flex shrink-0 items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Privacy</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-white">Privacy and Data Use</h1>
        </div>

        <NuxtLink
          to="/"
          class="grid size-10 place-items-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-slate-800 transition hover:bg-slate-800"
          aria-label="Back to tracker"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
        </NuxtLink>
      </header>

      <div class="mt-6 flex-1 overflow-y-auto no-scrollbar pb-4">
        <section class="space-y-4 rounded-4xl border border-slate-800 bg-slate-900 p-5 text-sm leading-6 text-slate-300">
          <p>
            Veteran Symptom Tracker stores the information you enter so you can review symptom patterns,
            daily impact, and supporter observations.
          </p>

          <div>
            <h2 class="text-base font-bold text-white">Information we store</h2>
            <ul class="mt-2 list-disc space-y-2 pl-5">
              <li>Account email and profile name.</li>
              <li>Symptom entries, severity, dates, notes, and daily impact details.</li>
              <li>Supporter link settings and the conditions you choose to make visible.</li>
              <li>Supporter observations, reporter name, email, phone, relationship, affirmation, signature name, and timestamp.</li>
            </ul>
          </div>

          <div>
            <h2 class="text-base font-bold text-white">How supporter reports work</h2>
            <p class="mt-2">
              A supporter can only access the private report link you create. They can only see the
              condition labels you selected for that link. They cannot see your full account or full history.
            </p>
          </div>

          <div>
            <h2 class="text-base font-bold text-white">Data provider</h2>
            <p class="mt-2">
              This app uses Supabase for authentication and database storage. Do not enter information
              you are not comfortable storing in a cloud database.
            </p>
          </div>

          <div>
            <h2 class="text-base font-bold text-white">Data deletion</h2>
            <p class="mt-2">
              This beta does not yet have a self-serve delete account button. For now, contact the app owner
              to request deletion before using this with a large public audience.
            </p>
          </div>

          <div class="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
            <p>
              By using VCH Symptom Tracker, you agree to the
              <a
                :href="privacyUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold text-white underline underline-offset-2 hover:text-slate-200"
              >
                Veterans Central Hub privacy policy
              </a>.
            </p>
          </div>
        </section>
      </div>

      <StickyActionBar tone="dark">
        <NuxtLink
          to="/"
          class="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-base font-bold text-slate-950 shadow-lg transition hover:bg-slate-200"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
          Back to tracker
        </NuxtLink>
      </StickyActionBar>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useVchPublicUrls } from '../composables/useVchPublicUrls'

const { privacyUrl } = useVchPublicUrls()
</script>
