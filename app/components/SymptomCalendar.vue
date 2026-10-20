<template>
  <div class="w-full" data-step-swipe-block data-symptom-calendar>
    <UCalendar
      v-model="calendarSelection"
      v-model:placeholder="calendarPlaceholder"
      color="primary"
      :view-control="false"
      prevent-deselect
      class="mx-auto w-full"
    >
      <template #day="{ day }">
        <span
          class="inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center leading-none"
          :class="hasLoggedEntryOnDay(day) ? 'text-base' : 'text-sm font-semibold'"
          :title="getLoggedDaySeverityTitle(day)"
        >
          {{ getCalendarDayDisplay(day) }}
        </span>
      </template>
    </UCalendar>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import { coerceCalendarDate, getTodayCalendarDate } from '~/utils/symptomDateTime'

defineProps<{
  hasLoggedEntryOnDay: (day: CalendarDate | { year: number, month: number, day: number }) => boolean
  getCalendarDayDisplay: (day: CalendarDate | { year: number, month: number, day: number }) => string
  getLoggedDaySeverityTitle: (day: CalendarDate | { year: number, month: number, day: number }) => string | undefined
}>()

const modelValue = defineModel<CalendarDate>({ required: true })
const placeholder = defineModel<CalendarDate>('placeholder', { required: true })

function resolvedCalendarDate(value: unknown) {
  return coerceCalendarDate(value) ?? getTodayCalendarDate()
}

/** UCalendar can emit null when a day is toggled off; keep a valid date so the panel does not crash. */
const calendarSelection = computed({
  get: () => resolvedCalendarDate(modelValue.value),
  set: (value) => {
    modelValue.value = resolvedCalendarDate(value)
  }
})

const calendarPlaceholder = computed({
  get: () => resolvedCalendarDate(placeholder.value),
  set: (value) => {
    placeholder.value = resolvedCalendarDate(value)
  }
})
</script>
