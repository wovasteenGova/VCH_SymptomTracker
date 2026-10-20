<script setup lang="ts">
import TrackerWorkspaceSettingsShell from './TrackerWorkspaceSettingsShell.vue'
import { useTrackerLogNotificationsSettingsPanel } from '../../composables/useTrackerLogNotificationsSettingsPanel'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const {
  loggingCadence,
  weeklyLogDay,
  weeklyLogDayOptions,
  logReminderScheduleDescription,
  logReminderPermissionState,
  logReminderDevicePermissionLabel,
  pushBackendConfigured,
  hasRegisteredPushSubscription,
  logReminderStatusLabel,
  remindersEnabled,
  isReminderTogglePending,
  logReminderButtonLabel,
  reminderHour,
  logReminderHourOptions,
  reminderEveningHour,
  logReminderTimezoneLabel,
  reminderTimezone,
  isSendingTestReminder,
  prepareLogNotificationsPanel,
  saveLoggingCadence,
  saveWeeklyLogDay,
  toggleLogReminders,
  handleReminderHourChange,
  handleReminderEveningHourChange,
  sendTestLogReminder
} = useTrackerLogNotificationsSettingsPanel()

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    void prepareLogNotificationsPanel()
  }
}, { immediate: true })
</script>

<template>
  <TrackerWorkspaceSettingsShell
    :open="open"
    title="Log notifications"
    description="Choose when you log symptoms and when this device should remind you."
    desktop-max-width="lg:max-w-lg"
    desktop-max-height="lg:max-h-[min(85dvh,44rem)]"
    @close="emit('close')"
  >
    <section class="pb-6">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Logging rhythm
      </p>
      <h3 class="mt-1 text-base font-bold text-highlighted">
        When you log symptoms
      </h3>
      <p class="mt-2 text-sm leading-6 text-muted">
        Weekly logging is recommended for PTSD and mental health so you are not revisiting painful events every day.
      </p>

      <div class="mt-4 grid gap-3">
        <button
          type="button"
          class="rounded-3xl border px-4 py-4 text-left transition"
          :class="loggingCadence === 'weekly'
            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
            : 'border-default bg-elevated/30'"
          @click="saveLoggingCadence('weekly')"
        >
          <span class="block font-bold text-highlighted">End of the week</span>
          <span class="mt-1 block text-sm leading-6 text-muted">Log once and capture the week together.</span>
        </button>

        <button
          type="button"
          class="rounded-3xl border px-4 py-4 text-left transition"
          :class="loggingCadence === 'daily'
            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
            : 'border-default bg-elevated/30'"
          @click="saveLoggingCadence('daily')"
        >
          <span class="block font-bold text-highlighted">Every day</span>
          <span class="mt-1 block text-sm leading-6 text-muted">Best when you want details while they are fresh.</span>
        </button>
      </div>

      <div v-if="loggingCadence === 'weekly'" class="mt-4">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Preferred log day
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="option in weeklyLogDayOptions"
            :key="option.value"
            type="button"
            class="rounded-full px-3 py-2 text-sm font-bold transition"
            :class="weeklyLogDay === option.value
              ? 'bg-primary text-inverted'
              : 'bg-elevated text-muted ring-1 ring-default'"
            @click="saveWeeklyLogDay(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="border-t border-default/70 pt-6">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        Reminders
      </p>
      <h3 class="mt-1 text-base font-bold text-highlighted">
        Logging notifications
      </h3>
      <p class="mt-2 text-sm leading-6 text-muted">
        {{ logReminderScheduleDescription }}
      </p>
      <p class="mt-2 text-xs leading-5 text-muted">
        Device permission: {{ logReminderDevicePermissionLabel }}. Turning VCH reminders off stops app reminders but does not change your device notification permission.
      </p>

      <p v-if="logReminderPermissionState === 'unsupported'" class="mt-3 text-sm leading-6 text-amber-200">
        Notifications are not supported in this browser.
      </p>
      <p v-else-if="logReminderPermissionState === 'denied'" class="mt-3 text-sm leading-6 text-amber-200">
        Notifications are blocked for this app. Enable them in your phone or browser settings, then come back and tap Enable.
      </p>
      <p v-else-if="pushBackendConfigured === false" class="mt-3 text-sm leading-6 text-amber-200">
        Background push is not configured on the server yet (missing VAPID keys in server setup). Reminders cannot reach this device until that is fixed.
      </p>
      <p v-else-if="hasRegisteredPushSubscription === false" class="mt-3 text-sm leading-6 text-amber-200">
        This device is not registered for push reminders yet. Tap Enable after notifications are allowed.
      </p>

      <div class="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-default bg-elevated/30 px-4 py-4">
        <div>
          <p class="font-bold text-highlighted">
            Log reminders
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ logReminderStatusLabel }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-full px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
          :class="remindersEnabled
            ? 'bg-primary text-inverted'
            : 'bg-elevated text-muted ring-1 ring-default'"
          :disabled="isReminderTogglePending"
          @click="toggleLogReminders"
        >
          {{ isReminderTogglePending ? 'Working...' : logReminderButtonLabel }}
        </button>
      </div>

      <div class="mt-4 rounded-3xl border border-default bg-elevated/30 px-4 py-4">
        <label class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">
          {{ loggingCadence === 'daily' ? 'Morning reminder' : 'Reminder time' }}
        </label>
        <select
          :value="reminderHour"
          class="mt-2 w-full rounded-2xl border border-default bg-default px-4 py-3 text-sm font-semibold text-highlighted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
          @change="handleReminderHourChange"
        >
          <option
            v-for="option in logReminderHourOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div
        v-if="loggingCadence === 'daily'"
        class="mt-4 rounded-3xl border border-default bg-elevated/30 px-4 py-4"
      >
        <label class="block text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Evening reminder
        </label>
        <select
          :value="reminderEveningHour"
          class="mt-2 w-full rounded-2xl border border-default bg-default px-4 py-3 text-sm font-semibold text-highlighted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
          @change="handleReminderEveningHourChange"
        >
          <option
            v-for="option in logReminderHourOptions"
            :key="`evening-${option.value}`"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <p class="mt-3 text-xs leading-5 text-muted">
        Uses your local timezone: {{ logReminderTimezoneLabel }} ({{ reminderTimezone }}).
        Install the app for background alerts when closed. On Android, set notification channel to Sound and pop-up if alerts only appear in the shade.
      </p>

      <div class="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-default bg-elevated/30 px-4 py-4">
        <div class="min-w-0">
          <p class="font-bold text-highlighted">
            Test notification
          </p>
          <p class="mt-1 text-sm text-muted">
            Sends a real OS notification now so you can confirm this device is set up.
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-full bg-elevated px-4 py-2 text-sm font-bold text-muted ring-1 ring-default transition hover:bg-accented disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isReminderTogglePending || isSendingTestReminder"
          @click="sendTestLogReminder"
        >
          {{ isSendingTestReminder ? 'Sending...' : 'Send test' }}
        </button>
      </div>
    </section>
  </TrackerWorkspaceSettingsShell>
</template>
