<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  readAppWelcomeStep,
  WEEKLY_LOG_DAY_OPTIONS,
  writeAppWelcomeStep,
  type LoggingCadence
} from '../utils/loggingCadence'
import {
  DEFAULT_LOG_REMINDER_HOUR,
  LOG_REMINDER_HOUR_OPTIONS,
  formatLogReminderHour,
  formatTimezoneLabel,
  getBrowserTimezone
} from '../utils/logReminders'

const props = defineProps<{
  installPlatform: 'ios' | 'android' | 'desktop'
  installInstructionText: string
  installGuideVideoUrl: string | null
  canPromptInstall: boolean
}>()

const emit = defineEmits<{
  complete: [payload: {
    loggingCadence: LoggingCadence
    weeklyLogDay: number
    termsAcceptedAt: string
    enableLogReminders: boolean
    reminderHour: number
    reminderTimezone: string
  }]
  promptInstall: []
}>()

const activeStep = ref(readAppWelcomeStep())
const loggingCadence = ref<LoggingCadence>('weekly')
const weeklyLogDay = ref(0)
const termsAccepted = ref(false)
const enableLogReminders = ref(true)
const reminderHour = ref(DEFAULT_LOG_REMINDER_HOUR)
const reminderTimezone = ref(getBrowserTimezone())
const isSaving = ref(false)

watch(activeStep, (step) => {
  writeAppWelcomeStep(step)
})

const reminderTimezoneLabel = computed(() => formatTimezoneLabel(reminderTimezone.value))

const totalSteps = 3

const canContinue = computed(() => {
  if (activeStep.value === 2) {
    return termsAccepted.value
  }

  return true
})

const continueLabel = computed(() => {
  if (activeStep.value === 2) {
    return isSaving.value ? 'Saving...' : 'Accept and start'
  }

  if (activeStep.value === totalSteps - 1) {
    return 'Continue'
  }

  return 'Next'
})

function showPreviousStep() {
  if (activeStep.value > 0) {
    activeStep.value -= 1
  }
}

function showNextStep() {
  if (activeStep.value < totalSteps - 1) {
    activeStep.value += 1
    return
  }

  finishWelcome()
}

async function finishWelcome() {
  if (!termsAccepted.value || isSaving.value) {
    return
  }

  isSaving.value = true

  try {
    emit('complete', {
      loggingCadence: loggingCadence.value,
      weeklyLogDay: weeklyLogDay.value,
      termsAcceptedAt: new Date().toISOString(),
      enableLogReminders: enableLogReminders.value,
      reminderHour: reminderHour.value,
      reminderTimezone: reminderTimezone.value
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <AppOverlayShell
    :dismissible="false"
    backdrop-class="bg-slate-950/80 backdrop-blur-sm"
  >
    <section class="app-overlay-panel app-overlay-panel--stack rounded-[1.75rem] border border-teal-200 bg-teal-50 shadow-2xl shadow-teal-950/15 dark:border-teal-500/30 dark:bg-slate-900 dark:shadow-black/40">
      <div class="shrink-0 border-b border-teal-200/80 px-5 py-4 dark:border-teal-500/20">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-200">
          Step {{ activeStep + 1 }} of {{ totalSteps }}
        </p>
        <div class="mt-3 flex justify-center gap-2">
          <span
            v-for="stepIndex in totalSteps"
            :key="stepIndex - 1"
            class="h-2 rounded-full transition-all"
            :class="stepIndex - 1 === activeStep ? 'w-7 bg-slate-950 dark:bg-white' : 'w-2 bg-teal-300 dark:bg-slate-600'"
          />
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto no-scrollbar px-5 py-5">
        <div v-if="activeStep === 0">
          <h2 class="text-2xl font-bold text-slate-950 dark:text-white">Use it like a mobile app</h2>
          <p class="mt-3 leading-6 text-teal-950/90 dark:text-teal-50/90">
            {{ installInstructionText }}
          </p>
          <p class="mt-3 leading-6 text-slate-600 dark:text-slate-300">
            Adding this to your home screen makes logging faster and keeps the app one tap away.
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-if="canPromptInstall"
              type="button"
              class="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm dark:bg-white dark:text-slate-950"
              @click="emit('promptInstall')"
            >
              Install app
            </button>

            <a
              v-if="installGuideVideoUrl"
              :href="installGuideVideoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 ring-1 ring-teal-200 dark:bg-slate-800 dark:text-white dark:ring-teal-500/30"
            >
              <UIcon name="i-lucide-play" class="size-4" />
              Watch how
            </a>

            <NuxtLink
              to="/install"
              class="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 ring-1 ring-teal-200 dark:bg-slate-800 dark:text-white dark:ring-teal-500/30"
            >
              Step-by-step guide
            </NuxtLink>
          </div>
        </div>

        <div v-else-if="activeStep === 1">
          <h2 class="text-2xl font-bold text-slate-950 dark:text-white">How often will you log?</h2>
          <p class="mt-3 leading-6 text-slate-600 dark:text-slate-300">
            For mental health conditions like PTSD, many veterans prefer logging once at the end of the week instead of revisiting painful events every day.
          </p>
          <p class="mt-3 leading-6 text-slate-600 dark:text-slate-300">
            You can still log early when you need to: we will just remind you of your plan.
          </p>

          <div class="mt-5 grid gap-3">
            <button
              type="button"
              class="rounded-3xl border px-4 py-4 text-left transition"
              :class="loggingCadence === 'weekly'
                ? 'border-slate-950 bg-white shadow-sm dark:border-white dark:bg-slate-800'
                : 'border-teal-200 bg-white/70 dark:border-slate-700 dark:bg-slate-800/50'"
              @click="loggingCadence = 'weekly'"
            >
              <span class="block text-base font-bold text-slate-950 dark:text-white">End of the week</span>
              <span class="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                Recommended for PTSD and mental health: capture the week without daily triggers.
              </span>
            </button>

            <button
              type="button"
              class="rounded-3xl border px-4 py-4 text-left transition"
              :class="loggingCadence === 'daily'
                ? 'border-slate-950 bg-white shadow-sm dark:border-white dark:bg-slate-800'
                : 'border-teal-200 bg-white/70 dark:border-slate-700 dark:bg-slate-800/50'"
              @click="loggingCadence = 'daily'"
            >
              <span class="block text-base font-bold text-slate-950 dark:text-white">Every day</span>
              <span class="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                Best when you want fresh details while symptoms are still recent.
              </span>
            </button>
          </div>

          <div v-if="loggingCadence === 'weekly'" class="mt-5">
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Preferred log day
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="option in WEEKLY_LOG_DAY_OPTIONS"
                :key="option.value"
                type="button"
                class="rounded-full px-3 py-2 text-sm font-bold transition"
                :class="weeklyLogDay === option.value
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'bg-white text-slate-700 ring-1 ring-teal-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'"
                @click="weeklyLogDay = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="mt-5 rounded-3xl border border-teal-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
            <label class="flex items-start gap-3">
              <input
                v-model="enableLogReminders"
                type="checkbox"
                class="mt-1 size-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900"
              >
              <span class="text-sm leading-6 text-slate-700 dark:text-slate-200">
                Remind me to log
                <span class="mt-1 block text-slate-500 dark:text-slate-400">
                  Default {{ formatLogReminderHour(reminderHour) }} your time ({{ reminderTimezoneLabel }}). You can change this in Profile.
                </span>
              </span>
            </label>

            <div v-if="enableLogReminders" class="mt-4">
              <label class="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Reminder time
              </label>
              <select
                v-model.number="reminderHour"
                class="mt-2 w-full rounded-2xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option
                  v-for="option in LOG_REMINDER_HOUR_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-else>
          <h2 class="text-2xl font-bold text-slate-950 dark:text-white">Before you start</h2>
          <div class="mt-4 space-y-3 rounded-3xl border border-teal-200 bg-white/80 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
            <p>
              This tracker helps you organize symptoms for your own records. It is not medical advice, legal advice, or a VA decision tool.
            </p>
            <p>
              If you are in crisis, call 988 and press 1, text 838255, or visit veteranscrisisline.net.
            </p>
            <p>
              Backdated entries in PDF exports show when the symptom happened and when you entered it.
            </p>
          </div>

          <label class="mt-5 flex items-start gap-3 rounded-3xl border border-teal-200 bg-white/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/80">
            <input
              v-model="termsAccepted"
              type="checkbox"
              class="mt-1 size-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900"
            >
            <span class="text-sm leading-6 text-slate-700 dark:text-slate-200">
              I understand this app is for personal recordkeeping, I have read the
              <NuxtLink to="/disclaimer" class="font-bold underline underline-offset-2">disclaimer</NuxtLink>
              and
              <NuxtLink to="/privacy" class="font-bold underline underline-offset-2">privacy policy</NuxtLink>,
              and I agree to use the tracker responsibly.
            </span>
          </label>
        </div>
      </div>

      <div class="shrink-0 border-t border-teal-200/80 px-5 py-4 dark:border-teal-500/20">
        <div class="flex gap-3">
          <button
            v-if="activeStep > 0"
            type="button"
            class="rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
            @click="showPreviousStep"
          >
            Back
          </button>

          <button
            type="button"
            class="ml-auto flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            :disabled="!canContinue || isSaving"
            @click="showNextStep"
          >
            {{ continueLabel }}
          </button>
        </div>
      </div>
    </section>
  </AppOverlayShell>
</template>
