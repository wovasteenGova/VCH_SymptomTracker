<template>
  <main class="relative flex min-h-screen flex-col bg-slate-50 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-950 dark:bg-slate-950 dark:text-white">
    <div class="flex flex-1 items-center">
      <div class="mx-auto grid w-full max-w-7xl items-start gap-10 px-6 py-12 pb-[max(2rem,env(safe-area-inset-bottom))] lg:grid-cols-[1fr_minmax(20rem,28rem)] lg:gap-14 lg:py-16 lg:pb-16 xl:gap-20">
        <div class="flex flex-col justify-center gap-8 lg:pr-2">
          <div class="space-y-6">
            <div class="flex items-center gap-3">
              <div class="size-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
                <img
                  :src="reportBranding.logoPath"
                  alt="Veterans Central Hub"
                  class="size-full object-cover object-center"
                >
              </div>
              <div>
                <p class="text-3xl font-bold tracking-[0.14em] lg:text-4xl">
                  VCH
                </p>
                <p class="mt-1 text-base text-slate-600 dark:text-slate-300 lg:text-lg">
                  Symptom Tracker is a VCH tool.
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <UBadge color="primary" variant="soft" size="lg">
                Live · Free to start
              </UBadge>
              <h1 class="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                Stop trying to remember six months of symptoms during a 30-minute exam.
              </h1>
              <p class="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 lg:text-lg">
                A mobile-first symptom history report for veterans — log as you go, organize functional impact over time,
                and export signed PDFs or personal review summaries before medical visits and claims work.
              </p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <UButton
                :href="trackerAppUrl"
                color="primary"
                size="xl"
                trailing-icon="i-lucide-arrow-right"
              >
                Open Symptom Tracker
              </UButton>
              <UButton
                :href="VCH_HUB_URL"
                external
                target="_blank"
                color="neutral"
                variant="outline"
                size="xl"
              >
                Visit Veterans Central Hub
              </UButton>
            </div>
          </div>

          <TrackerOpenQrCode
            :url="trackerAppUrl"
            class="max-w-md"
          />
        </div>

        <div
          v-if="isDesktopLayout"
          class="mx-auto w-full max-w-[28rem] lg:mx-0 lg:justify-self-end"
        >
          <div class="h-[min(820px,calc(100vh-10rem))] min-h-[620px] overflow-hidden rounded-[2.5rem] bg-slate-950 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <ClientOnly>
              <TrackerLivePreview />
              <template #fallback>
                <div class="grid h-full place-items-center">
                  <VchOpeningWorkspaceLoader
                    :full-screen="false"
                    show-brand
                  />
                </div>
              </template>
            </ClientOnly>
          </div>
          <p class="mt-4 text-center text-xs text-slate-500 dark:text-slate-400 lg:text-right">
            Live preview — click the phone to try it yourself, or
            <NuxtLink to="/" class="font-semibold text-sky-600 underline underline-offset-2 dark:text-sky-400">
              open full screen
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <section class="border-t border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div class="mx-auto max-w-7xl px-6 py-10 lg:py-14">
        <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
          What the Symptom Tracker does
        </h2>
        <p class="mt-4 max-w-4xl text-base leading-relaxed text-slate-600 dark:text-slate-300 lg:text-lg">
          Organize symptom history, functional impairment, and family observations in one place. Review your calendar,
          export a signed Veteran Symptom History Report, or download a personal review summary before exams —
          so you are not reconstructing months of memory in one sitting.
        </p>

        <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="item in highlights"
            :key="item.title"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60"
          >
            <div class="mb-3 inline-flex rounded-xl bg-sky-500/10 p-2.5 text-sky-600 dark:text-sky-300">
              <UIcon :name="item.icon" class="size-5" />
            </div>
            <p class="font-semibold text-slate-950 dark:text-white">
              {{ item.title }}
            </p>
            <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {{ item.copy }}
            </p>
          </li>
        </ul>

        <div class="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-8 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p class="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            VCH Symptom Tracker is for personal recordkeeping — not medical advice, legal advice, or an
            emergency line. In crisis, call 988 and press 1.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:shrink-0">
            <UButton
              :href="trackerAppUrl"
              color="primary"
              size="lg"
            >
              Use now
            </UButton>
            <UButton
              :href="`${VCH_HUB_URL}/symptom-tracker`"
              external
              target="_blank"
              color="neutral"
              variant="ghost"
              size="lg"
            >
              Learn more on VCH
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { reportBranding, resolveTrackerAppUrl } from '../utils/reportBranding'
import { VCH_HUB_URL } from '../utils/subscription'

const config = useRuntimeConfig()

const trackerAppUrl = computed(() => resolveTrackerAppUrl(config.public.siteUrl))

const isDesktopLayout = useMediaQuery('(min-width: 768px)')

onMounted(() => {
  if (import.meta.client) {
    const { hash, search } = window.location
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
    const linkType = hashParams.get('type')
    const hasAuthPayload = hashParams.has('access_token')
      || search.includes('code=')
      || search.includes('token_hash=')

    if (hasAuthPayload) {
      if (linkType === 'recovery') {
        window.location.replace(`/auth/reset-password${search}${hash}`)
        return
      }

      window.location.replace(`/auth/confirm${search}${hash}`)
      return
    }
  }

})

const highlights = [
  {
    title: 'Log as symptoms happen',
    copy: 'Pick your conditions and capture episodes, severity, and daily impact while the details are still fresh.',
    icon: 'i-lucide-activity'
  },
  {
    title: 'Family observations',
    copy: 'Share a private link so a spouse or supporter can add what they noticed — on Pro.',
    icon: 'i-lucide-users'
  },
  {
    title: 'Evidence organizer PDFs',
    copy: 'Export a signed symptom history report or a personal review summary pulled from your own logs — for exams, your VSO, and your records.',
    icon: 'i-lucide-file-text'
  }
]

useHead({
  title: 'VCH Symptom Tracker',
  htmlAttrs: {
    'data-theme': 'classic-warm'
  },
  meta: [
    {
      name: 'description',
      content: 'VCH Symptom Tracker — log symptoms over time and export Veteran Symptom History Reports and personal review summaries for medical visits and your records.'
    }
  ]
})
</script>
