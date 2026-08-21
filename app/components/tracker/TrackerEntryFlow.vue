<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import { computed, ref } from 'vue'
import { useKeyboardAwareScroll } from '../../composables/useKeyboardAwareScroll'
import { VA_CRISIS_LINE_SHORT } from '../../utils/conditionCatalog'
import {
  entryPresetIsSelected,
  isAppendPresetField,
  isMultiSelectPresetField,
  type EntryFieldPreset
} from '../../utils/entryFieldPresets'
import { getSeverityGuidance, severityQuickPresets } from '../../utils/severityGuidance'
import { td } from '../../utils/trackerDesktopTheme'
import {
  isEpisodeDurationField,
  isEpisodeFollowUpField,
  isMedicationsStepField,
  type EntryFieldDef
} from '../../utils/vaConditionFields'

type ConditionPickerResult = {
  title: string
  category: string
  image: string
}

const props = withDefaults(defineProps<{
  variant?: 'mobile' | 'desktop'
  title: string
  image: string
  isEditing: boolean
  entryStep: number
  entryStepsLength: number
  entryProgressWidth: string
  isLastEntryStep: boolean
  currentStepFields: EntryFieldDef[]
  severity: number
  entryForm: Record<string, string | undefined>
  entryDateTimePreview: string
  calendarDate: CalendarDate
  calendarPlaceholder: CalendarDate
  timeHour: number
  timeMinute: number
  timePeriod: 'AM' | 'PM'
  hasLoggedEntryOnDay: (day: CalendarDate | { year: number, month: number, day: number }) => boolean
  getCalendarDayDisplay: (day: CalendarDate | { year: number, month: number, day: number }) => string
  getLoggedDaySeverityTitle: (day: CalendarDate | { year: number, month: number, day: number }) => string | undefined
  isSaving: boolean
  error: string
  activeEntryIsMentalHealth: boolean
  fieldKey: (label: string) => string
  getPresetsForEntryField: (label: string) => EntryFieldPreset[]
  showShareLink?: boolean
  isConditionPickerOpen?: boolean
  customConditionInput?: string
  hasCustomConditionSearch?: boolean
  showCustomConditionEmptyState?: boolean
  debouncedCustomConditionPreview?: string
  filteredPickerConditionResults?: ConditionPickerResult[]
  enableSwipe?: boolean
}>(), {
  variant: 'mobile',
  showShareLink: false,
  isConditionPickerOpen: false,
  customConditionInput: '',
  hasCustomConditionSearch: false,
  showCustomConditionEmptyState: false,
  debouncedCustomConditionPreview: '',
  filteredPickerConditionResults: () => [],
  enableSwipe: true
})

const emit = defineEmits<{
  cancel: []
  'previous-step': []
  'next-step': []
  'primary-action': []
  'share-link': []
  'toggle-condition-picker': []
  'apply-custom-condition': []
  'change-condition': [result: ConditionPickerResult]
  'update:severity': [value: number]
  'update:customConditionInput': [value: string]
  'update:calendarDate': [value: unknown]
  'update:calendarPlaceholder': [value: unknown]
  'update:timeHour': [value: number]
  'update:timeMinute': [value: number]
  'update:timePeriod': [value: 'AM' | 'PM']
  'set-now': []
  'time-change': []
  'apply-severity-preset': [value: number]
  'apply-field-preset': [label: string, value: string]
}>()

const isDesktop = computed(() => props.variant === 'desktop')
const severityGuidance = computed(() => getSeverityGuidance(props.severity))

const stepsRemaining = computed(() => Math.max(0, props.entryStepsLength - props.entryStep - 1))
const stepsRemainingLabel = computed(() => {
  if (stepsRemaining.value === 0) {
    return 'Last step'
  }

  return stepsRemaining.value === 1 ? '1 step left' : `${stepsRemaining.value} steps left`
})

const currentStepHasSliderField = computed(() => (
  props.currentStepFields.some((field) => field.type === 'slider')
))

const currentStepIsEpisodeDetailStep = computed(() => {
  const fields = props.currentStepFields
  return fields.some((field) => isEpisodeDurationField(field))
    && fields.some((field) => isEpisodeFollowUpField(field))
})

const entryActionBarHeight = computed(() => (
  props.showShareLink ? 176 : 112
))

const entryStepScrollEl = ref<HTMLElement | null>(null)

const {
  scrollStyle: entryStepScrollStyle,
  handleFieldFocus: handleEntryFieldFocus,
  keyboardInset: entryKeyboardInset,
  isKeyboardOpen: isEntryKeyboardOpen,
  scrollElementIntoView
} = useKeyboardAwareScroll(entryStepScrollEl, {
  footerHeight: entryActionBarHeight
})

defineExpose({
  getStepScrollEl: () => entryStepScrollEl.value,
  scrollElementIntoView
})

function handleEntrySwipeStart(event: TouchEvent) {
  if (!props.enableSwipe || isDesktop.value) {
    return
  }

  entrySwipeStartedOnControl = isStepSwipeBlockedTarget(event.target)
    || props.currentStepFields.some((field) => field.type === 'datetime')

  entrySwipeStartX = event.touches[0]?.clientX ?? 0
  entrySwipeStartY = event.touches[0]?.clientY ?? 0
}

function handleEntrySwipeEnd(event: TouchEvent) {
  if (!props.enableSwipe || isDesktop.value) {
    return
  }

  if (
    entrySwipeStartedOnControl
    || currentStepHasSliderField.value
    || props.currentStepFields.some((field) => field.type === 'datetime')
  ) {
    entrySwipeStartedOnControl = false
    return
  }

  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  const deltaX = touch.clientX - entrySwipeStartX
  const deltaY = Math.abs(touch.clientY - entrySwipeStartY)

  if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= deltaY) {
    return
  }

  if (deltaX < 0 && !props.isLastEntryStep) {
    emit('next-step')
    return
  }

  if (deltaX > 0 && props.entryStep > 0) {
    emit('previous-step')
  }
}

let entrySwipeStartX = 0
let entrySwipeStartY = 0
let entrySwipeStartedOnControl = false

function isStepSwipeBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(target.closest(
    'input, textarea, select, button, [role="slider"], [data-step-swipe-block], [data-symptom-calendar], [data-slot="day"], [role="gridcell"], .ucalendar, table td, table th'
  ))
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
      :class="isDesktop ? 'mx-auto w-full max-w-xl px-5 pt-4' : ''"
    >
      <div
        class="shrink-0 flex items-center gap-4"
        :class="isDesktop ? 'mb-5' : 'mb-6'"
      >
        <img
          :src="image"
          :alt="title"
          class="shrink-0 rounded-2xl object-cover"
          :class="isDesktop ? 'size-14' : 'size-16'"
        >

        <div class="min-w-0 flex-1">
          <p
            :class="isDesktop
              ? td.captionWide
              : 'text-xs font-semibold uppercase tracking-[0.2em] text-muted'"
          >
            {{ isEditing ? (isDesktop ? 'Edit entry' : 'Edit Entry') : (isDesktop ? 'New entry' : 'New Entry') }}
          </p>
          <div class="mt-1.5 flex items-center gap-2">
            <h2
              class="min-w-0 truncate font-bold text-highlighted"
              :class="isDesktop ? td.titleXl : 'text-xl'"
            >
              {{ title }}
            </h2>
            <button
              v-if="!isDesktop"
              type="button"
              class="grid size-8 shrink-0 place-items-center rounded-full transition"
              :class="isConditionPickerOpen
                ? 'bg-primary text-white'
                : 'bg-muted text-toned hover:bg-accented'"
              :aria-label="isConditionPickerOpen ? 'Close condition picker' : 'Change condition'"
              :aria-expanded="isConditionPickerOpen"
              @click="emit('toggle-condition-picker')"
            >
              <UIcon name="i-lucide-pencil" class="size-4" />
            </button>
          </div>
          <p
            v-if="!isDesktop"
            class="mt-1 text-xs leading-5 text-muted"
          >
            Log what you know right now.
          </p>
        </div>

        <button
          v-if="isDesktop"
          type="button"
          :class="td.ghostBtn"
          @click="emit('cancel')"
        >
          Cancel
        </button>
      </div>

      <Transition
        v-if="!isDesktop"
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-1 opacity-0"
      >
        <div
          v-if="isConditionPickerOpen"
          class="mb-4 overflow-hidden rounded-2xl border border-default bg-elevated"
        >
          <div class="border-b border-default px-3 py-3">
            <label class="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              Custom condition
            </label>
            <div class="flex gap-2">
              <input
                :value="customConditionInput"
                type="text"
                placeholder="Example: tinnitus, sinusitis, skin flare-up..."
                class="min-w-0 flex-1 rounded-xl border border-default bg-muted px-3 py-2.5 text-sm font-semibold text-highlighted outline-none placeholder:text-dimmed focus:border-primary"
                @input="emit('update:customConditionInput', ($event.target as HTMLInputElement).value)"
                @keydown.enter.prevent="emit('apply-custom-condition')"
              >
              <button
                type="button"
                class="inline-flex shrink-0 items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                :disabled="!customConditionInput.trim()"
                @click="emit('apply-custom-condition')"
              >
                Use
              </button>
            </div>
          </div>

          <div class="border-b border-default px-3 py-2">
            <p class="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
              {{ hasCustomConditionSearch
                ? (filteredPickerConditionResults.length ? 'Matching conditions' : 'No matches')
                : 'Or pick from the list' }}
            </p>
          </div>

          <div class="no-scrollbar max-h-52 space-y-0.5 overflow-y-auto p-2">
            <div
              v-if="showCustomConditionEmptyState"
              class="rounded-xl px-3 py-4 text-center"
            >
              <p class="text-sm font-bold text-highlighted">
                No results
              </p>
              <p class="mt-1 text-xs leading-5 text-muted">
                Tap <span class="font-bold text-highlighted">Use</span> to add
                <span class="font-semibold text-toned">"{{ debouncedCustomConditionPreview.trim() }}"</span>
                as a custom condition.
              </p>
            </div>

            <button
              v-for="result in filteredPickerConditionResults"
              :key="result.title"
              type="button"
              class="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition"
              :class="result.title === title
                ? 'bg-muted ring-1 ring-default'
                : 'hover:bg-accented/30'"
              @click="emit('change-condition', result)"
            >
              <img
                :src="result.image"
                :alt="result.title"
                class="size-10 shrink-0 rounded-xl object-cover"
              >

              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-bold text-highlighted">{{ result.title }}</span>
                <span class="mt-0.5 block truncate text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  {{ result.category }}
                </span>
              </span>

              <UIcon
                v-if="result.title === title"
                name="i-lucide-check"
                class="size-4 shrink-0 text-highlighted"
              />
            </button>
          </div>
        </div>
      </Transition>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          v-if="!isEntryKeyboardOpen"
          class="relative z-10 shrink-0 flex items-center justify-between gap-4 px-1"
          :class="isDesktop ? 'mb-4' : 'mb-6'"
          data-step-swipe-block
        >
          <button
            type="button"
            class="grid place-items-center rounded-full bg-elevated/80 text-highlighted ring-1 ring-default/70 transition hover:bg-accented disabled:opacity-30"
            :class="isDesktop ? 'size-11' : 'size-10'"
            :disabled="entryStep === 0"
            aria-label="Previous entry step"
            @click.stop="emit('previous-step')"
          >
            <UIcon name="i-lucide-chevron-left" class="size-5" />
          </button>

          <div class="min-w-0 flex-1">
            <p
              class="text-center font-bold uppercase tracking-[0.18em] text-muted"
              :class="isDesktop ? 'text-sm' : 'text-xs'"
            >
              Step {{ entryStep + 1 }} of {{ entryStepsLength }}
            </p>
            <p
              class="mt-1 text-center text-xs font-semibold text-toned"
              :class="isDesktop ? 'text-sm' : ''"
            >
              {{ stepsRemainingLabel }}
            </p>
            <div
              class="mt-2.5 overflow-hidden rounded-full bg-muted"
              :class="isDesktop ? 'h-2.5' : 'h-1.5'"
            >
              <div
                class="h-full rounded-full bg-primary transition-all duration-300"
                :style="{ width: entryProgressWidth }"
              />
            </div>
          </div>

          <button
            type="button"
            class="grid place-items-center rounded-full bg-elevated/80 text-highlighted ring-1 ring-default/70 transition hover:bg-accented disabled:opacity-30"
            :class="isDesktop ? 'size-11' : 'size-10'"
            :disabled="isLastEntryStep"
            aria-label="Next entry step"
            @click.stop="emit('next-step')"
          >
            <UIcon name="i-lucide-chevron-right" class="size-5" />
          </button>
        </div>

        <div
          class="flex min-h-0 flex-1 flex-col overflow-hidden"
          @touchstart.capture.passive="handleEntrySwipeStart"
          @touchend="handleEntrySwipeEnd"
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
              ref="entryStepScrollEl"
              :key="entryStep"
              class="flex min-h-0 flex-1 flex-col"
              :class="currentStepHasSliderField && currentStepFields.length === 1
                ? 'justify-start overflow-y-auto custom-scrollbar px-1 py-4'
                : currentStepIsEpisodeDetailStep
                  ? 'mt-8 justify-start space-y-12 overflow-y-auto custom-scrollbar pt-2'
                  : 'mt-6 justify-start space-y-6 overflow-y-auto custom-scrollbar'"
              :style="entryStepScrollStyle"
              @focusin="handleEntryFieldFocus"
            >
              <component
                :is="field.type === 'datetime' ? 'div' : 'label'"
                v-for="(field, fieldIndex) in currentStepFields"
                :key="field.label"
                class="block w-full"
                :role="field.type === 'datetime' ? 'group' : undefined"
                :aria-label="field.type === 'datetime' ? 'When did this happen' : undefined"
                :class="fieldIndex > 0 && isEpisodeFollowUpField(field)
                  ? 'border-t border-default/80 pt-10'
                  : ''"
              >
                <span
                  v-if="field.type !== 'datetime' && field.type !== 'slider'"
                  class="mb-4 block text-xs font-bold uppercase tracking-[0.14em] text-muted"
                  :class="isEpisodeDurationField(field) || isEpisodeFollowUpField(field) ? 'mb-5' : ''"
                >
                  {{ field.label }}
                </span>
                <p
                  v-if="field.helper"
                  class="-mt-2 mb-4 text-xs leading-5 text-muted"
                >
                  {{ field.helper }}
                </p>

                <div
                  v-if="field.type === 'slider'"
                  data-step-swipe-block
                  data-demo-field="severity-slider"
                  class="flex w-full min-h-0 flex-1 flex-col"
                >
                  <div class="shrink-0 space-y-1 pb-5 text-center">
                    <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                      How much did today affect you?
                    </p>
                    <p class="text-xs leading-5 text-muted">
                      Slide between a best day and a worst day for this condition.
                    </p>
                  </div>

                  <div class="w-full space-y-5">
                  <div class="flex items-center justify-between text-xs font-semibold text-muted">
                    <span>Best day</span>
                    <span>Worst day</span>
                  </div>

                  <USlider
                    :model-value="severity"
                    :min="0"
                    :max="10"
                    :step="1"
                    :size="isDesktop ? 'lg' : 'xl'"
                    color="neutral"
                    tooltip
                    @update:model-value="emit('update:severity', $event)"
                  />

                  <div class="flex flex-wrap justify-center gap-2">
                    <button
                      v-for="preset in severityQuickPresets"
                      :key="preset.label"
                      type="button"
                      class="rounded-full border px-3 py-1.5 text-xs font-bold transition"
                      :class="severity === preset.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-default bg-elevated text-toned hover:bg-accented/40'"
                      @click="emit('apply-severity-preset', preset.value)"
                    >
                      {{ preset.label }}
                    </button>
                  </div>

                  <div class="min-h-[5rem] overflow-hidden">
                    <Transition
                      name="severity-guide"
                      mode="out-in"
                    >
                      <div
                        :key="severity"
                        class="rounded-2xl bg-muted/80 px-5 py-4"
                      >
                        <p class="text-sm font-bold text-highlighted">
                          {{ severityGuidance.title }}
                        </p>
                        <p class="mt-2 text-sm leading-7 text-toned">
                          {{ severityGuidance.text }}
                        </p>
                      </div>
                    </Transition>
                  </div>
                  </div>
                </div>

                <div
                  v-else-if="field.type === 'datetime'"
                  data-demo-field="datetime"
                  class="space-y-4"
                >
                  <div>
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <span class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                        When did this happen?
                      </span>
                      <button
                        type="button"
                        class="inline-flex shrink-0 items-center gap-1 rounded-full border border-default bg-elevated px-3 py-2 text-xs font-bold text-highlighted shadow-sm transition hover:bg-accented/40"
                        aria-label="Set date and time to now"
                        @pointerdown.stop
                        @mousedown.stop
                        @touchstart.stop
                        @click.stop="emit('set-now')"
                      >
                        <UIcon name="i-lucide-clock-3" class="size-3.5" />
                        Now
                      </button>
                    </div>
                    <p class="text-sm leading-6 font-medium text-highlighted">
                      {{ entryDateTimePreview }}
                    </p>
                  </div>

                  <div
                    class="mt-3 space-y-4"
                    data-step-swipe-block
                    @click.stop
                    @pointerdown.stop
                    @touchstart.stop
                    @touchend.stop
                  >
                    <SymptomCalendar
                      :model-value="calendarDate"
                      :placeholder="calendarPlaceholder"
                      :has-logged-entry-on-day="hasLoggedEntryOnDay"
                      :get-calendar-day-display="getCalendarDayDisplay"
                      :get-logged-day-severity-title="getLoggedDaySeverityTitle"
                      @update:model-value="emit('update:calendarDate', $event)"
                      @update:placeholder="emit('update:calendarPlaceholder', $event)"
                    />

                    <div data-step-swipe-block @click.stop @touchstart.stop @touchend.stop>
                      <TimeOfDayPicker
                        :hour="timeHour"
                        :minute="timeMinute"
                        :period="timePeriod"
                        class="mt-6 pb-6"
                        @update:hour="emit('update:timeHour', $event)"
                        @update:minute="emit('update:timeMinute', $event)"
                        @update:period="emit('update:timePeriod', $event)"
                        @change="emit('time-change')"
                      />
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="isEpisodeDurationField(field) || isEpisodeFollowUpField(field) || isMedicationsStepField(field) || getPresetsForEntryField(field.label).length"
                  :data-entry-field-key="fieldKey(field.label)"
                  class="space-y-5"
                >
                  <div class="flex flex-wrap gap-2.5">
                    <button
                      v-for="preset in getPresetsForEntryField(field.label)"
                      :key="`${preset.fromLastEntry ? 'last' : 'catalog'}-${preset.value}`"
                      type="button"
                      class="rounded-full px-3 py-1.5 text-xs font-bold transition"
                      :class="(isMultiSelectPresetField(field.label) || isAppendPresetField(field.label)
                        ? entryPresetIsSelected(entryForm[fieldKey(field.label)], preset.value, field.label)
                        : entryForm[fieldKey(field.label)] === preset.value)
                        ? 'bg-primary text-white'
                        : preset.fromLastEntry
                          ? 'bg-muted text-toned hover:bg-accented'
                          : 'bg-muted text-toned hover:bg-accented'"
                      @click="emit('apply-field-preset', field.label, preset.value)"
                    >
                      {{ preset.label }}
                    </button>
                  </div>
                  <Transition name="crisis-line">
                    <p
                      v-if="field.label === 'Daily impact' && activeEntryIsMentalHealth"
                      key="entry-crisis-line"
                      class="text-xs leading-5 text-muted"
                    >
                      {{ VA_CRISIS_LINE_SHORT }}
                    </p>
                  </Transition>
                  <textarea
                    v-if="field.type === 'textarea'"
                    v-model="entryForm[fieldKey(field.label)]"
                    :data-entry-field-key="fieldKey(field.label)"
                    :placeholder="field.placeholder"
                    rows="4"
                    class="w-full resize-none border-0 border-b border-default/80 bg-transparent px-0 py-4 text-base font-medium leading-7 text-highlighted outline-none placeholder:text-dimmed focus:border-primary"
                  />
                  <input
                    v-else
                    v-model="entryForm[fieldKey(field.label)]"
                    :data-entry-field-key="fieldKey(field.label)"
                    type="text"
                    :placeholder="field.placeholder"
                    class="w-full border-0 bg-transparent px-0 py-3 text-base font-medium text-highlighted outline-none placeholder:text-dimmed"
                  >
                </div>
                <textarea
                  v-else-if="field.type === 'textarea'"
                  v-model="entryForm[fieldKey(field.label)]"
                  :data-entry-field-key="fieldKey(field.label)"
                  :placeholder="field.placeholder"
                  rows="4"
                  class="w-full resize-none border-0 border-b border-default/80 bg-transparent px-0 py-4 text-base font-medium leading-7 text-highlighted outline-none placeholder:text-dimmed focus:border-primary"
                />
                <input
                  v-else-if="field.type !== 'slider' && field.type !== 'datetime' && !isEpisodeDurationField(field) && !isEpisodeFollowUpField(field) && !isMedicationsStepField(field) && !getPresetsForEntryField(field.label).length"
                  v-model="entryForm[fieldKey(field.label)]"
                  :data-entry-field-key="fieldKey(field.label)"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  class="w-full border-0 border-b border-default/80 bg-transparent px-0 py-4 text-base font-medium text-highlighted outline-none placeholder:text-dimmed focus:border-primary"
                >
              </component>
            </div>
          </Transition>
        </div>
      </div>

      <div
        v-if="!isEntryKeyboardOpen"
        class="mt-auto shrink-0"
        :class="isDesktop ? 'border-t border-default/80 pt-3' : ''"
      >
        <StickyActionBar
          v-if="!isDesktop"
          class="-mx-5 rounded-none border-x-0 border-default bg-default/95"
          :keyboard-offset="entryKeyboardInset"
        >
          <button
            v-if="showShareLink && !isEntryKeyboardOpen"
            type="button"
            class="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-muted px-5 py-3.5 text-sm font-bold text-highlighted transition hover:bg-accented"
            @click="emit('share-link')"
          >
            <UIcon name="i-lucide-link" class="size-4" />
            Create private link for this entry
          </button>

          <button
            v-if="!isEntryKeyboardOpen"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white shadow-lg transition hover:opacity-90"
            :disabled="isSaving"
            @click="emit('primary-action')"
          >
            {{ isSaving ? 'Saving...' : isLastEntryStep ? (isEditing ? 'Save changes' : 'Finish') : 'Continue' }}
            <UIcon :name="isLastEntryStep ? 'i-lucide-check' : 'i-lucide-arrow-right'" class="size-5" />
          </button>
          <p v-if="error" class="mt-3 text-center text-sm font-medium text-red-300" aria-live="assertive">
            {{ error }}
          </p>
        </StickyActionBar>

        <template v-else>
          <button
            v-if="showShareLink"
            type="button"
            :class="['mb-3 w-full', td.secondaryBtn]"
            @click="emit('share-link')"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <UIcon name="i-lucide-link" class="size-4" />
              Create private link for this entry
            </span>
          </button>

          <button
            type="button"
            :class="['w-full', td.primaryBtnBlock]"
            :disabled="isSaving"
            @click="emit('primary-action')"
          >
            {{ isSaving ? 'Saving...' : isLastEntryStep ? (isEditing ? 'Save changes' : 'Finish') : 'Continue' }}
            <UIcon :name="isLastEntryStep ? 'i-lucide-check' : 'i-lucide-arrow-right'" class="size-5" />
          </button>
          <p v-if="error" class="mt-3 text-center text-sm font-medium text-error" aria-live="assertive">
            {{ error }}
          </p>
        </template>
      </div>

      <p
        v-if="isEntryKeyboardOpen && error"
        class="mt-3 shrink-0 text-center text-sm font-medium"
        :class="isDesktop ? 'text-error' : 'text-red-300'"
        aria-live="assertive"
      >
        {{ error }}
      </p>
    </div>
  </div>
</template>
