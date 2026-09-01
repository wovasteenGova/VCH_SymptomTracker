<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5 sm:max-w-lg">
      <header class="flex shrink-0 items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Disclaimer</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-white">Important Medical Notice</h1>
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
            Veteran Symptom Tracker is for personal symptom organization and recordkeeping. It is not
            medical advice, diagnosis, treatment, legal advice, or a VA claim decision tool.
          </p>

          <div>
            <h2 class="text-base font-bold text-white">Not for emergencies</h2>
            <p class="mt-2">
              Do not use this app as an emergency or crisis response tool. If you may hurt yourself or
              someone else, or if you are having a medical emergency, call emergency services now.
            </p>
          </div>

          <div>
            <h2 class="text-base font-bold text-white">Veterans Crisis Line</h2>
            <p class="mt-2">
              In the United States, veterans can call 988 and press 1, text 838255, or chat at
              veteranscrisisline.net.
            </p>
          </div>

          <div>
            <h2 class="text-base font-bold text-white">Use with judgment</h2>
            <p class="mt-2">
              Symptom logs and supporter observations may help you remember details, but they do not
              guarantee any medical, legal, benefits, or VA outcome.
            </p>
          </div>

          <div class="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
            <p>
              By using VCH Symptom Tracker, you agree to the
              <a
                :href="termsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold text-white underline underline-offset-2 hover:text-slate-200"
              >
                Veterans Central Hub terms of service
              </a>
              and
              <a
                :href="privacyUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-bold text-white underline underline-offset-2 hover:text-slate-200"
              >
                privacy policy
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

const { privacyUrl, termsUrl } = useVchPublicUrls()
</script>
