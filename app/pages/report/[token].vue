<template>
  <main class="app-shell overflow-hidden flex flex-col bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white">
    <section class="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden px-4 pt-4 pb-0 sm:max-w-lg">
      <header class="flex shrink-0 items-center justify-between gap-3 pb-4">
        <div class="flex min-w-0 items-center gap-2.5">
          <div class="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-slate-700">
            <img
              src="/brand/vch-symptom-tracker-logo.png"
              alt="Veterans Central Hub"
              class="size-10 object-cover object-center"
            >
          </div>
          <div class="min-w-0">
            <p class="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Family observation
            </p>
            <h1 class="truncate text-lg font-bold text-slate-950 dark:text-white">
              {{ supporterProfile?.display_name || 'Supporter report' }}
            </h1>
          </div>
        </div>

        <VchThemeToggle size="md" />
      </header>

      <section v-if="isLoading" class="flex flex-1 items-center justify-center py-12 text-center text-slate-500 dark:text-slate-400">
        Loading link...
      </section>

      <section v-else-if="pageError" class="flex flex-1 items-center justify-center py-12">
        <div class="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {{ pageError }}
        </div>
      </section>

      <div
        v-else-if="isSubmitted"
        class="flex min-h-0 flex-1 flex-col items-center justify-center px-2 py-10 text-center"
      >
        <span class="grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
          <UIcon name="i-lucide-check-circle-2" class="size-9" />
        </span>
        <h2 class="mt-5 text-2xl font-bold text-slate-950 dark:text-white">Observation submitted</h2>
        <p class="mt-3 max-w-sm text-base leading-7 text-slate-600 dark:text-slate-300">
          Thank you. The veteran will review this note before deciding whether to use it in their records.
        </p>
        <button
          type="button"
          class="mt-8 w-full max-w-sm rounded-2xl bg-slate-950 px-5 py-4 text-base font-bold text-white transition hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          @click="startAnotherObservation"
        >
          Submit another observation
        </button>
      </div>

      <form
        v-else
        class="flex min-h-0 flex-1 flex-col overflow-hidden"
        @submit.prevent="handleObservationPrimaryAction"
      >
        <div
          v-if="supporterProfile?.entry_context_summary"
          class="mb-4 shrink-0 rounded-3xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-500/30 dark:bg-teal-950/30"
        >
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-200">About this entry</p>
          <p class="mt-2 text-base leading-6 text-teal-950/90 dark:text-teal-50/90">
            {{ supporterProfile.entry_context_summary }}
          </p>
        </div>

        <div class="relative z-10 mb-4 shrink-0 flex items-center justify-between gap-4 px-1">
          <button
            type="button"
            class="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-950 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            :disabled="observationStep === 0"
            aria-label="Previous step"
            @click="showPreviousObservationStep"
          >
            <UIcon name="i-lucide-chevron-left" class="size-5" />
          </button>

          <div class="min-w-0 flex-1">
            <p class="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Step {{ observationStep + 1 }} of {{ observationStepCount }}
            </p>
            <p class="mt-1 truncate text-center text-base font-semibold text-slate-950 dark:text-white">
              {{ currentStepTitle }}
            </p>
            <div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                class="h-full rounded-full bg-slate-950 transition-all duration-300 dark:bg-white"
                :style="{ width: observationProgressWidth }"
              />
            </div>
          </div>

          <button
            type="button"
            class="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-950 transition hover:bg-slate-200 disabled:opacity-30 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            :disabled="isLastObservationStep"
            aria-label="Next step"
            @click="tryAdvanceObservationStep"
          >
            <UIcon name="i-lucide-chevron-right" class="size-5" />
          </button>
        </div>

        <div
          class="flex min-h-0 flex-1 flex-col overflow-hidden"
          @touchstart.passive="handleObservationSwipeStart"
          @touchend="handleObservationSwipeEnd"
        >
          <Transition
            mode="out-in"
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-x-4 opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="-translate-x-4 opacity-0"
          >
            <div
              ref="observationStepScrollEl"
              :key="observationStep"
              class="flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar px-1"
              :class="observationStep === 2
                ? 'justify-center gap-5 py-6'
                : 'justify-start space-y-6 py-2'"
              :style="observationStepScrollStyle"
              @focusin="handleObservationFieldFocus"
            >
              <template v-if="observationStep === 0">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Your information</p>
                  <p class="mt-2 text-base leading-6 text-slate-600 dark:text-slate-400">
                    This appears on the report as the person who observed it. Enter your own details.
                  </p>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label class="block">
                    <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">First name</span>
                    <input
                      v-model="form.first_name"
                      type="text"
                      autocomplete="given-name"
                      class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                      :class="fieldInputClass('first_name')"
                      placeholder="First name"
                    >
                    <p v-if="fieldError('first_name')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                      {{ fieldError('first_name') }}
                    </p>
                  </label>

                  <label class="block">
                    <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Last name</span>
                    <input
                      v-model="form.last_name"
                      type="text"
                      autocomplete="family-name"
                      class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                      :class="fieldInputClass('last_name')"
                      placeholder="Last name"
                    >
                    <p v-if="fieldError('last_name')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                      {{ fieldError('last_name') }}
                    </p>
                  </label>
                </div>

                <label class="block">
                  <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Email</span>
                  <input
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                    :class="fieldInputClass('email')"
                    placeholder="you@example.com"
                  >
                  <p v-if="fieldError('email')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                    {{ fieldError('email') }}
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Phone</span>
                  <input
                    v-model="form.phone"
                    type="tel"
                    autocomplete="tel"
                    class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                    :class="fieldInputClass('phone')"
                    placeholder="(555) 555-5555"
                  >
                  <p v-if="fieldError('phone')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                    {{ fieldError('phone') }}
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">My relationship to them</span>
                  <input
                    v-model="form.relationship"
                    type="text"
                    class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                    :class="fieldInputClass('relationship')"
                    placeholder="Partner, spouse, parent, friend, caregiver"
                  >
                  <p v-if="fieldError('relationship')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                    {{ fieldError('relationship') }}
                  </p>
                  <div class="mt-3 flex flex-wrap gap-2 px-1">
                    <button
                      v-for="suggestion in relationshipSuggestions"
                      :key="suggestion.label"
                      type="button"
                      class="rounded-full border px-3 py-1.5 text-xs font-bold transition"
                      :class="relationshipChipClass(suggestion)"
                      @click="form.relationship = suggestion.label"
                    >
                      {{ suggestion.label }}
                    </button>
                  </div>
                </label>
              </template>

              <template v-else-if="observationStep === 1">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">What I observed</p>
                  <p class="mt-2 text-base leading-6 text-slate-600 dark:text-slate-400">
                    Choose the condition and when I noticed it.
                  </p>
                </div>

                <label class="block">
                  <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Condition</span>
                  <select
                    v-model="form.condition_label"
                    class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:focus:border-slate-400 dark:[color-scheme:dark]"
                    :class="fieldInputClass('condition_label')"
                  >
                    <option value="" disabled>Select condition</option>
                    <option
                      v-for="condition in supporterProfile?.visible_conditions || []"
                      :key="condition"
                      :value="condition"
                    >
                      {{ condition }}
                    </option>
                  </select>
                  <p v-if="fieldError('condition_label')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                    {{ fieldError('condition_label') }}
                  </p>
                </label>

                <label class="block">
                  <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Date I noticed this</span>
                  <input
                    v-model="observedDate"
                    type="date"
                    :max="maxObservedDate"
                    class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:focus:border-slate-400 dark:[color-scheme:dark]"
                    :class="fieldInputClass('observed_at')"
                  >
                </label>

                <TimeOfDayPicker
                  :hour="observedTimeHour"
                  :minute="observedTimeMinute"
                  :period="observedTimePeriod"
                  @update:hour="observedTimeHour = $event"
                  @update:minute="observedTimeMinute = $event"
                  @update:period="observedTimePeriod = $event"
                  @change="syncObservedAtFromParts"
                />
                <p v-if="fieldError('observed_at')" class="px-1 text-sm font-medium text-red-600 dark:text-red-300">
                  {{ fieldError('observed_at') }}
                </p>
              </template>

              <template v-else-if="observationStep === 2">
                <div data-step-swipe-block class="space-y-5">
                  <div class="space-y-1 text-center">
                    <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      How severe it seemed to me
                    </p>
                    <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Based on what I saw — not a medical rating.
                    </p>
                  </div>

                  <div class="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Mild</span>
                    <span class="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white dark:bg-slate-700 dark:text-slate-100">
                      {{ severityValue }}/10
                    </span>
                    <span>Severe</span>
                  </div>

                  <USlider
                    v-model="severityValue"
                    :min="0"
                    :max="10"
                    :step="1"
                    size="xl"
                    color="neutral"
                    tooltip
                  />

                  <div class="flex flex-wrap justify-center gap-2">
                    <button
                      v-for="preset in supporterSeverityQuickPresets"
                      :key="preset.label"
                      type="button"
                      class="rounded-full border px-3 py-1.5 text-xs font-bold transition"
                      :class="severityValue === preset.value
                        ? 'border-slate-950 bg-slate-950 text-white dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'"
                      @click="severityValue = preset.value"
                    >
                      {{ preset.label }}
                    </button>
                  </div>

                  <div class="min-h-[5.25rem] overflow-hidden">
                    <Transition name="severity-guide" mode="out-in">
                      <div
                        :key="severityValue"
                        class="rounded-2xl bg-slate-100/80 px-5 py-4 dark:bg-slate-800/80"
                      >
                        <p class="text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          {{ severityGuidance.title }}
                        </p>
                        <p class="mt-2 text-center text-base leading-6 text-slate-600 dark:text-slate-300">
                          {{ severityGuidance.text }}
                        </p>
                      </div>
                    </Transition>
                  </div>
                </div>
              </template>

              <template v-else-if="observationStep === 3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Impact I noticed</p>
                  <p class="mt-2 text-base leading-6 text-slate-600 dark:text-slate-400">
                    Describe how this seemed to affect their day — work, sleep, mood, chores, or activity.
                  </p>
                </div>

                <div class="space-y-5">
                  <div class="flex flex-wrap gap-2.5">
                    <button
                      v-for="preset in supporterImpactPresets"
                      :key="preset.label"
                      type="button"
                      class="rounded-full px-3 py-1.5 text-xs font-bold transition"
                      :class="supporterImpactPresetIsSelected(form.impact, preset.value)
                        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'"
                      @click="toggleImpactPreset(preset.value)"
                    >
                      {{ preset.label }}
                    </button>
                  </div>

                  <label class="block">
                    <span class="mb-4 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">What I noticed</span>
                    <textarea
                      v-model="form.impact"
                      rows="4"
                      class="w-full resize-none border-0 border-b bg-transparent px-0 py-4 text-base font-medium leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                      :class="fieldInputClass('impact', true)"
                      placeholder="I noticed they had trouble..., It seemed to affect..., They appeared to..."
                    />
                    <p v-if="fieldError('impact')" class="mt-2 text-sm font-medium text-red-600 dark:text-red-300">
                      {{ fieldError('impact') }}
                    </p>
                  </label>

                  <label class="block">
                    <span class="mb-4 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Extra notes (optional)</span>
                    <textarea
                      v-model="form.notes"
                      rows="3"
                      class="w-full resize-none border-0 border-b border-slate-300/80 bg-transparent px-0 py-4 text-base font-medium leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                      placeholder="Anything else I want to add"
                    />
                  </label>
                </div>
              </template>

              <template v-else>
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Sign & submit</p>
                  <p class="mt-2 text-base leading-6 text-slate-600 dark:text-slate-400">
                    I review the affirmation below and sign with my full legal name.
                  </p>
                </div>

                <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <p class="text-base leading-6 text-slate-600 dark:text-slate-300">
                    {{ declarationText }}
                  </p>

                  <p
                    v-if="reporterFullName"
                    class="mt-3 rounded-2xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-base text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                  >
                    This report will list me as:
                    <span class="font-bold text-slate-950 dark:text-white">{{ reporterFullName }}</span>
                    <span v-if="form.email"> · {{ form.email }}</span>
                    <span v-if="form.phone"> · {{ form.phone }}</span>
                    <span v-if="form.relationship"> · {{ form.relationship }}</span>
                  </p>

                  <label class="mt-4 flex cursor-pointer items-start gap-3">
                    <input
                      v-model="hasAffirmedDeclaration"
                      type="checkbox"
                      class="mt-1 size-5 shrink-0 rounded border-slate-300 bg-white text-slate-950 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200"
                      :class="fieldError('affirmation') ? 'border-red-400 ring-1 ring-red-300 dark:border-red-500 dark:ring-red-500/40' : ''"
                    >
                    <span class="text-base font-semibold leading-6 text-slate-950 dark:text-white">
                      I affirm that this statement is true and accurate to the best of my knowledge, and I agree that my name and contact information above will appear on this report.
                    </span>
                  </label>
                  <p v-if="fieldError('affirmation')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                    {{ fieldError('affirmation') }}
                  </p>

                  <label class="mt-4 block">
                    <span class="mb-2 block px-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">My electronic signature</span>
                    <input
                      v-model="form.signature_name"
                      type="text"
                      autocomplete="name"
                      class="w-full rounded-3xl border bg-white px-4 py-4 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:bg-slate-800/70 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-400"
                      :class="fieldInputClass('signature_name')"
                      placeholder="Type my full legal name"
                      @input="signatureManuallyEdited = true"
                    >
                    <p v-if="fieldError('signature_name')" class="mt-2 px-1 text-sm font-medium text-red-600 dark:text-red-300">
                      {{ fieldError('signature_name') }}
                    </p>
                    <p v-else class="mt-2 px-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Include first and last name (capitalization does not matter).
                    </p>
                  </label>
                </div>
              </template>
            </div>
          </Transition>
        </div>

        <div
          class="shrink-0"
          :style="{ minHeight: isObservationKeyboardOpen ? '0px' : `${observationActionBarHeight}px` }"
        >
        <StickyActionBar
          class="-mx-4 rounded-none border-x-0 sm:-mx-0"
          :keyboard-offset="observationKeyboardInset"
        >
          <p v-if="submitError" class="mb-4 text-center text-base font-medium text-red-600 dark:text-red-300">{{ submitError }}</p>

          <button
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Submitting...' : isLastObservationStep ? 'Submit observation' : 'Continue' }}
            <UIcon :name="isLastObservationStep ? 'i-lucide-check' : 'i-lucide-arrow-right'" class="size-5" />
          </button>
        </StickyActionBar>
        </div>
      </form>

      <footer
        v-if="!isLoading && !pageError"
        class="flex shrink-0 items-center justify-center gap-3 py-4 text-xs font-semibold text-slate-500"
      >
        <NuxtLink to="/privacy" class="hover:text-slate-700 dark:hover:text-slate-300">Privacy</NuxtLink>
        <NuxtLink to="/disclaimer" class="hover:text-slate-700 dark:hover:text-slate-300">Disclaimer</NuxtLink>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useKeyboardAwareScroll } from '../../composables/useKeyboardAwareScroll'
import { signatureMatchesReporter } from '../../utils/signatureMatch'
import {
  getSupporterSeverityGuidance,
  supporterImpactPresetIsSelected,
  supporterImpactPresets,
  supporterSeverityQuickPresets,
  toggleSupporterImpactPreset
} from '../../utils/supporterObservationCopy'
import {
  formatPartsToTime24,
  getMaxEntryDateLocal,
  parseTime24ToParts,
  splitEntryDateTimeLocal
} from '../../utils/symptomDateTime'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const declarationText =
  'By submitting this observation, I confirm that the information reflects what I personally observed and is submitted in good faith. My name, email, phone number, and relationship will be stored on this report for the veteran’s review.'

const observationStepTitles = [
  'Your information',
  'What you observed',
  'How severe it seemed',
  'Impact you noticed',
  'Sign & submit'
]

const observationStepCount = observationStepTitles.length

const relationshipSuggestions = [
  { label: 'Partner', tone: 'partner' },
  { label: 'Spouse', tone: 'default' },
  { label: 'Parent', tone: 'default' },
  { label: 'Child', tone: 'default' },
  { label: 'Sibling', tone: 'default' },
  { label: 'Friend', tone: 'default' },
  { label: 'Caregiver', tone: 'default' },
  { label: 'Neighbor', tone: 'default' },
  { label: 'Other', tone: 'default' }
] as const

const route = useRoute()
const trackerDb = useTrackerDb()
const { showSubmissionToast } = useSubmissionToast()
const token = String(route.params.token || '')

definePageMeta({
  layout: false,
  ssr: false
})

const supporterProfile = ref<null | {
  id: string
  display_name: string
  visible_conditions: string[]
  linked_entry_id?: string | null
  entry_context_summary?: string | null
}>(null)
const observationStep = ref(0)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const hasAffirmedDeclaration = ref(false)
const signatureManuallyEdited = ref(false)
const severityValue = ref(5)
const pageError = ref('')
const submitError = ref('')
const showStepValidation = ref(false)
const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  relationship: '',
  condition_label: '',
  observed_at: '',
  impact: '',
  notes: '',
  signature_name: ''
})

const observedDate = ref('')
const observedTimeHour = ref('12')
const observedTimeMinute = ref('00')
const observedTimePeriod = ref<'AM' | 'PM'>('PM')
const maxObservedDate = getMaxEntryDateLocal()

const observationStepScrollEl = ref<HTMLElement | null>(null)
const observationActionBarHeight = 112
const {
  scrollStyle: observationStepScrollStyle,
  handleFieldFocus: handleObservationFieldFocus,
  keyboardInset: observationKeyboardInset,
  isKeyboardOpen: isObservationKeyboardOpen
} = useKeyboardAwareScroll(observationStepScrollEl, {
  footerHeight: observationActionBarHeight
})

const observationSwipeStartX = ref<number | null>(null)
const observationSwipeStartedOnControl = ref(false)

function isStepSwipeBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(target.closest(
    'input, textarea, select, button, [role="slider"], [data-step-swipe-block]'
  ))
}

const reporterFullName = computed(() => {
  return [form.value.first_name, form.value.last_name].filter(Boolean).join(' ').trim()
})

const severityGuidance = computed(() => getSupporterSeverityGuidance(severityValue.value))

const currentStepTitle = computed(() => observationStepTitles[observationStep.value] || '')

const isLastObservationStep = computed(() => observationStep.value >= observationStepCount - 1)

const observationProgressWidth = computed(() => {
  return `${((observationStep.value + 1) / observationStepCount) * 100}%`
})

const signatureMatchesName = computed(() => {
  return signatureMatchesReporter(
    form.value.signature_name,
    form.value.first_name,
    form.value.last_name
  )
})

const canSubmit = computed(() => getAllSubmitBlockers().length === 0)

type ObservationFieldKey =
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'relationship'
  | 'condition_label'
  | 'observed_at'
  | 'impact'
  | 'affirmation'
  | 'signature_name'

type ObservationFieldErrors = Partial<Record<ObservationFieldKey, string>>

function getStepFieldErrors(step: number): ObservationFieldErrors {
  const errors: ObservationFieldErrors = {}

  if (step === 0) {
    if (!form.value.first_name.trim()) {
      errors.first_name = 'Enter your first name.'
    }

    if (!form.value.last_name.trim()) {
      errors.last_name = 'Enter your last name.'
    }

    if (!form.value.email.trim()) {
      errors.email = 'Enter your email address.'
    } else if (!isValidEmail(form.value.email)) {
      errors.email = 'Enter a valid email address.'
    }

    if (!form.value.phone.trim()) {
      errors.phone = 'Enter your phone number.'
    }

    if (!form.value.relationship.trim()) {
      errors.relationship = 'Enter your relationship to the veteran.'
    }
  }

  if (step === 1) {
    if (!form.value.condition_label) {
      errors.condition_label = 'Choose a condition.'
    }

    if (!form.value.observed_at) {
      errors.observed_at = 'Choose when you observed this.'
    }
  }

  if (step === 3) {
    if (!form.value.impact.trim()) {
      errors.impact = 'Describe the impact you noticed.'
    }
  }

  if (step === 4) {
    if (!hasAffirmedDeclaration.value) {
      errors.affirmation = 'Check the affirmation box.'
    }

    if (!form.value.signature_name.trim()) {
      errors.signature_name = 'Type your electronic signature (full legal name).'
    } else if (!signatureMatchesName.value) {
      errors.signature_name = 'Signature should include your first and last name.'
    }
  }

  return errors
}

function getAllSubmitBlockers() {
  return observationStepTitles.flatMap((_, index) => Object.values(getStepFieldErrors(index)))
}

const currentStepFieldErrors = computed(() => {
  if (!showStepValidation.value) {
    return {} as ObservationFieldErrors
  }

  return getStepFieldErrors(observationStep.value)
})

function fieldError(field: ObservationFieldKey) {
  return currentStepFieldErrors.value[field] || ''
}

function fieldInputClass(field: ObservationFieldKey, underline = false) {
  const hasError = Boolean(fieldError(field))

  if (underline) {
    return hasError
      ? 'border-red-400 dark:border-red-500'
      : 'border-slate-300/80 dark:border-slate-600'
  }

  return hasError
    ? 'border-red-400 dark:border-red-500 dark:border-slate-600/70'
    : 'border-slate-300 dark:border-slate-600/70'
}

function toggleImpactPreset(presetValue: string) {
  form.value.impact = toggleSupporterImpactPreset(form.value.impact, presetValue)
}

function relationshipChipClass(suggestion: typeof relationshipSuggestions[number]) {
  const isSelected = form.value.relationship === suggestion.label

  if (isSelected) {
    if (suggestion.tone === 'partner') {
      return 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100 ring-1 ring-fuchsia-400/50 dark:border-fuchsia-400 dark:bg-fuchsia-500/20 dark:text-fuchsia-100'
    }

    return 'border-slate-950 bg-slate-950 text-white dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100'
  }

  if (suggestion.tone === 'partner') {
    return 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-700 hover:bg-fuchsia-500/15 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-200 dark:hover:bg-fuchsia-500/20'
  }

  return 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'
}

function handleObservationSwipeStart(event: TouchEvent) {
  observationSwipeStartedOnControl.value = isStepSwipeBlockedTarget(event.target)
  observationSwipeStartX.value = event.touches[0]?.clientX ?? null
}

function handleObservationSwipeEnd(event: TouchEvent) {
  if (observationSwipeStartedOnControl.value || observationStep.value === 2) {
    observationSwipeStartedOnControl.value = false
    observationSwipeStartX.value = null
    return
  }

  const startX = observationSwipeStartX.value
  const endX = event.changedTouches[0]?.clientX

  if (startX === null || endX === undefined) {
    return
  }

  const deltaX = endX - startX

  if (deltaX <= -60) {
    tryAdvanceObservationStep()
  } else if (deltaX >= 60) {
    showPreviousObservationStep()
  }

  observationSwipeStartX.value = null
}

watch(observedDate, () => {
  syncObservedAtFromParts()
})

watch(reporterFullName, (fullName) => {
  if (!signatureManuallyEdited.value && fullName) {
    form.value.signature_name = fullName
  }
})

watch(hasAffirmedDeclaration, (affirmed) => {
  if (affirmed && !form.value.signature_name.trim() && reporterFullName.value) {
    form.value.signature_name = reporterFullName.value
    signatureManuallyEdited.value = false
  }
})

onMounted(async () => {
  setDefaultObservedAt()
  await loadSupporterProfile()
})

function syncObservedAtFromParts() {
  if (!observedDate.value) {
    form.value.observed_at = ''
    return
  }

  const time24 = formatPartsToTime24(
    observedTimeHour.value,
    observedTimeMinute.value,
    observedTimePeriod.value
  )

  form.value.observed_at = `${observedDate.value}T${time24}`
}

function syncPartsFromObservedAt() {
  if (!form.value.observed_at) {
    return
  }

  const { date, time } = splitEntryDateTimeLocal(form.value.observed_at)
  const parts = parseTime24ToParts(time)

  observedDate.value = date
  observedTimeHour.value = parts.hour12
  observedTimeMinute.value = parts.minute
  observedTimePeriod.value = parts.period
}

function setDefaultObservedAt() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60000
  form.value.observed_at = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16)
  syncPartsFromObservedAt()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function resetObservationForm() {
  form.value.impact = ''
  form.value.notes = ''
  severityValue.value = 5
  observationStep.value = 0
  submitError.value = ''
  showStepValidation.value = false
  resetReporterFields()
  setDefaultObservedAt()
}

function resetReporterFields() {
  form.value.first_name = ''
  form.value.last_name = ''
  form.value.email = ''
  form.value.phone = ''
  form.value.relationship = ''
  form.value.signature_name = ''
  hasAffirmedDeclaration.value = false
  signatureManuallyEdited.value = false
}

function startAnotherObservation() {
  isSubmitted.value = false
  resetObservationForm()
}

function showPreviousObservationStep() {
  if (observationStep.value > 0) {
    submitError.value = ''
    showStepValidation.value = false
    observationStep.value -= 1
  }
}

function tryAdvanceObservationStep() {
  if (!validateCurrentStep()) {
    return
  }

  showStepValidation.value = false

  if (!isLastObservationStep.value) {
    observationStep.value += 1
  }
}

function validateCurrentStep() {
  const errors = getStepFieldErrors(observationStep.value)
  const isValid = Object.keys(errors).length === 0

  showStepValidation.value = !isValid
  submitError.value = ''

  return isValid
}

function handleObservationPrimaryAction() {
  if (!validateCurrentStep()) {
    return
  }

  showStepValidation.value = false

  if (isLastObservationStep.value) {
    submitObservation()
    return
  }

  observationStep.value += 1
}

async function loadSupporterProfile() {
  isLoading.value = true
  pageError.value = ''

  const { data, error } = await trackerDb.rpc('get_supporter_profile_by_token', {
    link_token: token
  })

  if (error) {
    pageError.value = error.message
    isLoading.value = false
    return
  }

  supporterProfile.value = data?.[0] || null

  if (!supporterProfile.value) {
    pageError.value = 'This supporter link is invalid or disabled.'
  } else {
    form.value.condition_label = supporterProfile.value.visible_conditions[0] || ''
  }

  isLoading.value = false
}

async function submitObservation() {
  if (!isValidEmail(form.value.email)) {
    submitError.value = 'Enter a valid email address.'
    return
  }

  if (!canSubmit.value) {
    showStepValidation.value = true
    submitError.value = ''
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  const { error } = await trackerDb.rpc('submit_supporter_observation', {
    link_token: token,
    condition_label: form.value.condition_label,
    observed_at: new Date(form.value.observed_at).toISOString(),
    severity: severityValue.value,
    impact: form.value.impact,
    notes: form.value.notes || null,
    declaration_text: declarationText,
    signature_name: form.value.signature_name.trim(),
    reporter_first_name: form.value.first_name.trim(),
    reporter_last_name: form.value.last_name.trim(),
    reporter_email: form.value.email.trim(),
    reporter_phone: form.value.phone.trim(),
    reporter_relationship: form.value.relationship.trim()
  })

  if (error) {
    submitError.value = error.message
  } else {
    showSubmissionToast({
      message: 'Observation submitted. Thank you.',
      highlight: '✓'
    })
    isSubmitted.value = true
  }

  isSubmitting.value = false
}
</script>

<style scoped>
.severity-guide-enter-active,
.severity-guide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.severity-guide-enter-from {
  opacity: 0;
  transform: translateY(0.35rem);
}

.severity-guide-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}
</style>
