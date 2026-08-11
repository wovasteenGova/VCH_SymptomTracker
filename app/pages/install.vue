<script setup lang="ts">
import { androidAddToHomeScreenVideoUrl, iosAddToHomeScreenVideoUrl } from '../utils/installGuide'

const { canPromptInstall, promptInstall } = usePwaInstall()
</script>

<template>
  <main class="flex min-h-dvh flex-col bg-slate-950 text-white">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5 sm:max-w-lg">
      <header class="flex shrink-0 items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Install Guide</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-white">Add the app to your phone</h1>
        </div>

        <NuxtLink
          to="/"
          class="grid size-10 place-items-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-slate-800 transition hover:bg-slate-800"
          aria-label="Back to tracker"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5" />
        </NuxtLink>
      </header>

      <div class="mt-6 flex-1 space-y-4 overflow-y-auto no-scrollbar pb-4">
        <section class="rounded-4xl border border-slate-800 bg-slate-900 p-5">
          <h2 class="text-xl font-bold text-white">Computer</h2>
          <p class="mt-3 text-sm leading-6 text-slate-300">
            In Chrome or Edge, use the install icon in the address bar or open the browser menu and choose <span class="font-bold text-white">Install VCH Symptom Tracker</span>.
          </p>
          <button
            v-if="canPromptInstall"
            type="button"
            class="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-200"
            @click="promptInstall"
          >
            Install app
          </button>
        </section>

        <section class="rounded-4xl border border-slate-800 bg-slate-900 p-5">
          <h2 class="text-xl font-bold text-white">iPhone</h2>
          <ol class="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li><span class="font-bold text-white">1.</span> Open this site in Safari.</li>
            <li><span class="font-bold text-white">2.</span> Tap the Share button at the bottom of Safari.</li>
            <li><span class="font-bold text-white">3.</span> Scroll and tap <span class="font-bold text-white">Add to Home Screen</span>.</li>
            <li><span class="font-bold text-white">4.</span> Tap Add. The app will appear with your other apps.</li>
          </ol>

          <a
            :href="iosAddToHomeScreenVideoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-5 flex items-center gap-3 rounded-3xl border border-teal-500/30 bg-teal-950/40 p-4 transition hover:bg-teal-950/60"
          >
            <span class="grid size-12 shrink-0 place-items-center rounded-full bg-teal-500 text-white shadow-lg shadow-teal-950/30">
              <UIcon name="i-lucide-play" class="size-5" />
            </span>
            <span class="min-w-0">
              <span class="block text-base font-bold text-white">Watch the 30-second guide</span>
              <span class="mt-0.5 block text-xs leading-5 text-teal-100/80">Opens in YouTube — follow along in Safari</span>
            </span>
            <UIcon name="i-lucide-external-link" class="ml-auto size-4 shrink-0 text-teal-200/70" />
          </a>
        </section>

        <section class="rounded-4xl border border-slate-800 bg-slate-900 p-5">
          <h2 class="text-xl font-bold text-white">Android</h2>
          <ol class="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li><span class="font-bold text-white">1.</span> Open this site in Chrome.</li>
            <li><span class="font-bold text-white">2.</span> Tap Install app if Chrome shows it.</li>
            <li><span class="font-bold text-white">3.</span> If not, tap the three-dot menu.</li>
            <li><span class="font-bold text-white">4.</span> Tap Add to Home screen or Install app.</li>
            <li><span class="font-bold text-white">5.</span> The process is similar in most other Android browsers.</li>
          </ol>

          <a
            :href="androidAddToHomeScreenVideoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-5 flex items-center gap-3 rounded-3xl border border-teal-500/30 bg-teal-950/40 p-4 transition hover:bg-teal-950/60"
          >
            <span class="grid size-12 shrink-0 place-items-center rounded-full bg-teal-500 text-white shadow-lg shadow-teal-950/30">
              <UIcon name="i-lucide-play" class="size-5" />
            </span>
            <span class="min-w-0">
              <span class="block text-base font-bold text-white">Watch the 30-second guide</span>
              <span class="mt-0.5 block text-xs leading-5 text-teal-100/80">Opens in YouTube — follow along in Chrome</span>
            </span>
            <UIcon name="i-lucide-external-link" class="ml-auto size-4 shrink-0 text-teal-200/70" />
          </a>
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
