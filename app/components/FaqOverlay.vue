<script setup lang="ts">
import { ref } from 'vue'
import {
  FREE_CONDITION_LIMIT,
  PRO_ANNUAL_PRICE_LABEL
} from '../utils/subscription'
import { useVchPublicUrls } from '../composables/useVchPublicUrls'

const { privacyUrl } = useVchPublicUrls()

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  'open-contact': []
}>()

type FaqItem = {
  id: string
  question: string
  answer: string
}

const faqPanelClass = 'flex w-[min(calc(100vw-2rem),32rem)] max-w-[32rem] max-h-[min(75dvh,28rem)] flex-col overflow-hidden rounded-[1.75rem] border border-default/80 bg-default shadow-2xl'
const faqScrollClass = 'max-h-[min(calc(75dvh-5.5rem),22rem)] overflow-y-scroll overscroll-contain px-5 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] [scrollbar-gutter:stable]'

const faqItems: FaqItem[] = [
  {
    id: 'what-is-tracker',
    question: 'What is Symptom Tracker?',
    answer: 'Symptom Tracker helps veterans log symptoms over time — severity, impact, and notes — so patterns are easier to review for yourself or a claim. Log from the home screen, browse your history, and export PDF reports when you need them.'
  },
  {
    id: 'how-logging-works',
    question: 'How does logging work?',
    answer: 'Pick a condition, rate severity, describe what happened and how it affected your day, then save. You can log daily or once a week (weekly is recommended for PTSD and mental health). Your entries stay on your account and appear in charts and exports.'
  },
  {
    id: 'free-vs-pro',
    question: 'What is the difference between Free and Pro?',
    answer: `Free includes ${FREE_CONDITION_LIMIT} condition with unlimited entries, calendar charts, and entry PDFs with weekly symptom counts. Pro (${PRO_ANNUAL_PRICE_LABEL}) unlocks unlimited conditions, family reporting links, severity trends in PDFs, and personal review summaries.`
  },
  {
    id: 'reminders',
    question: 'How do log reminders work?',
    answer: 'Turn on reminders in Account Settings. You will get a morning nudge at your chosen time and an 8 PM follow-up if you have not logged yet. Install the app to your home screen for background alerts. Reminders use push notifications — allow them when prompted.'
  },
  {
    id: 'family-reporting',
    question: 'What are family, friends, and other reporting links?',
    answer: 'Pro users can create private links for someone they trust. The supporter opens the link, enters their own contact info, and submits a signed observation about how your condition affects you. You manage links from Account Settings — create, copy, disable, or delete them anytime.'
  },
  {
    id: 'passkeys',
    question: 'What are passkeys?',
    answer: 'Passkeys let you sign in with your fingerprint, face, or device PIN instead of a password. They stay on your device and are harder to phish. Add one under Account Settings → Passkeys after you have an account.'
  },
  {
    id: 'privacy-data',
    question: 'Who can see my data? Can I export or delete logs?',
    answer: 'Your symptom entries are private to your account. Export PDFs from the tracker when you need a report. Deleted entries go to the recovery bin first; you can restore or permanently remove them. Delete all logs from Account Settings if you want a fresh start — your profile and plan stay saved. See our privacy policy for more.'
  },
  {
    id: 'contact',
    question: 'Still need help?',
    answer: 'Use Contact us in Account Settings to send a message. We reply by email, usually within a few business days.'
  }
]

const openItemId = ref<string | null>(null)

function toggleItem(id: string) {
  openItemId.value = openItemId.value === id ? null : id
}

function handleOpenContact() {
  emit('close')
  emit('open-contact')
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <AppOverlayShell
      v-if="open"
      settings-support-overlay
      :z-index="120"
      backdrop-class="bg-black/55 lg:bg-black/55"
      @dismiss="$emit('close')"
    >
      <section
        v-if="open"
        :class="faqPanelClass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="faq-title"
      >
        <div class="flex shrink-0 items-start justify-between gap-3 border-b border-default/60 px-5 py-4">
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Help
            </p>
            <h2 id="faq-title" class="mt-1 text-xl font-bold text-highlighted">
              Frequently asked questions
            </h2>
          </div>
          <button
            type="button"
            class="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-elevated/60 hover:text-highlighted"
            aria-label="Close FAQ"
            @click="$emit('close')"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div :class="faqScrollClass">
          <div
            v-for="item in faqItems"
            :key="item.id"
            class="border-b border-default/60 last:border-b-0"
          >
            <button
              type="button"
              class="flex w-full items-start justify-between gap-3 py-3.5 text-left"
              :aria-expanded="openItemId === item.id"
              @click="toggleItem(item.id)"
            >
              <span class="min-w-0 flex-1 font-semibold text-highlighted">{{ item.question }}</span>
              <UIcon
                :name="openItemId === item.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="mt-0.5 size-5 shrink-0 text-muted"
              />
            </button>

            <div
              v-show="openItemId === item.id"
              class="pb-3.5 text-sm leading-6 text-muted"
            >
              <p>{{ item.answer }}</p>
              <template v-if="item.id === 'privacy-data'">
                <a
                  :href="privacyUrl"
                  target="_blank"
                  rel="noopener"
                  class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary underline decoration-primary/30 underline-offset-2 hover:opacity-80"
                >
                  Privacy policy
                  <UIcon name="i-lucide-external-link" class="size-3.5" />
                </a>
              </template>
              <button
                v-if="item.id === 'contact'"
                type="button"
                class="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                @click="handleOpenContact"
              >
                Contact us
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppOverlayShell>
  </Transition>
</template>
