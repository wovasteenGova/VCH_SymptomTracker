import { useAppWelcome } from './useAppWelcome'
import { useLogReminders } from './useLogReminders'
import { useSubmissionToast } from './useSubmissionToast'
import { useUserProfiles } from './useUserProfiles'
import { WEEKLY_LOG_DAY_OPTIONS, type LoggingCadence } from '../utils/loggingCadence'
import {
  describeLogReminderSchedule,
  formatTimezoneLabel,
  LOG_REMINDER_HOUR_OPTIONS
} from '../utils/logReminders'

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return 'Something went wrong. Please try again.'
}

export function useTrackerLogNotificationsSettingsPanel() {
  const { showSubmissionToast } = useSubmissionToast()
  const { getProfile } = useUserProfiles()
  const {
    loggingCadence,
    weeklyLogDay,
    updateLoggingCadence
  } = useAppWelcome()
  const {
    remindersEnabled,
    reminderHour,
    reminderEveningHour,
    reminderTimezone,
    permissionState: logReminderPermissionState,
    pushBackendConfigured,
    hasRegisteredPushSubscription,
    isReminderTogglePending,
    refreshPushReminderStatus,
    enableRemindersWithPermission,
    disableReminders,
    hydrateReminderSettings,
    updateReminderHour,
    updateReminderEveningHour,
    sendTestReminderNotification,
    syncPermissionState
  } = useLogReminders()

  const isSendingTestReminder = ref(false)
  const weeklyLogDayOptions = WEEKLY_LOG_DAY_OPTIONS
  const logReminderHourOptions = LOG_REMINDER_HOUR_OPTIONS

  const logReminderScheduleDescription = computed(() => {
    return describeLogReminderSchedule(
      loggingCadence.value,
      weeklyLogDay.value,
      reminderHour.value,
      reminderTimezone.value,
      reminderEveningHour.value
    )
  })

  const logReminderTimezoneLabel = computed(() => formatTimezoneLabel(reminderTimezone.value))

  const logReminderStatusLabel = computed(() => {
    if (logReminderPermissionState.value === 'denied') {
      return 'Blocked in device settings'
    }

    if (logReminderPermissionState.value === 'unsupported') {
      return 'Not supported on this browser'
    }

    if (pushBackendConfigured.value === false) {
      return 'Server setup needed'
    }

    if (hasRegisteredPushSubscription.value === false) {
      return 'Needs setup on this device'
    }

    if (logReminderPermissionState.value === 'granted' && !remindersEnabled.value) {
      return 'Device allowed; VCH reminders off'
    }

    return remindersEnabled.value ? 'On for this device' : 'Off'
  })

  const logReminderButtonLabel = computed(() => {
    if (remindersEnabled.value && hasRegisteredPushSubscription.value) {
      return 'On'
    }

    if (logReminderPermissionState.value === 'denied') {
      return 'Blocked'
    }

    return 'Enable'
  })

  const logReminderDevicePermissionLabel = computed(() => {
    if (logReminderPermissionState.value === 'granted') {
      return 'Allowed'
    }

    if (logReminderPermissionState.value === 'denied') {
      return 'Blocked in device settings'
    }

    if (logReminderPermissionState.value === 'unsupported') {
      return 'Not supported here'
    }

    return 'Not decided yet'
  })

  async function prepareLogNotificationsPanel() {
    syncPermissionState()
    try {
      const profile = await getProfile()
      hydrateReminderSettings(profile)
    } catch {
      // Profile may be unavailable briefly after sign-in; reminder state still loads from storage.
    }
    await refreshPushReminderStatus()
  }

  async function saveLoggingCadence(cadence: LoggingCadence) {
    try {
      await updateLoggingCadence(cadence, weeklyLogDay.value)
      showSubmissionToast({ message: 'Logging rhythm saved.' })
    } catch (error) {
      showSubmissionToast({ message: getErrorMessage(error), tone: 'error' })
    }
  }

  async function saveWeeklyLogDay(day: number) {
    try {
      await updateLoggingCadence('weekly', day)
      showSubmissionToast({ message: 'Preferred log day saved.' })
    } catch (error) {
      showSubmissionToast({ message: getErrorMessage(error), tone: 'error' })
    }
  }

  async function toggleLogReminders() {
    if (isReminderTogglePending.value) {
      return
    }

    if (remindersEnabled.value) {
      const result = await disableReminders()
      if (!result?.ok) {
        showSubmissionToast({
          message: result?.message || 'Could not turn off reminders. Please try again.',
          tone: 'error'
        })
        return
      }
      await refreshPushReminderStatus()
      showSubmissionToast({ message: 'VCH reminders turned off.' })
      return
    }

    const result = await enableRemindersWithPermission()

    if (result.ok) {
      showSubmissionToast({ message: 'Log reminders turned on for this device.' })
      return
    }

    if (result.reason === 'missing-vapid') {
      showSubmissionToast({
        message: 'Push reminders are not configured on the server yet. Add VAPID keys in Render, redeploy, then try again.',
        tone: 'error'
      })
      return
    }

    if (result.reason === 'permission-denied') {
      showSubmissionToast({
        message: 'Notifications are blocked for this app. Enable them in phone or browser settings, then tap Enable again.',
        tone: 'error'
      })
      return
    }

    if (result.reason === 'unsupported') {
      showSubmissionToast({
        message: 'Notifications are not supported in this browser.',
        tone: 'error'
      })
      return
    }

    if (result.reason === 'subscribe-failed') {
      showSubmissionToast({
        message: result.message || 'Could not register this device for push reminders.',
        tone: 'error'
      })
      return
    }

    showSubmissionToast({
      message: 'Allow notifications to turn on reminders.',
      tone: 'error'
    })
  }

  async function handleReminderHourChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const hour = Number(target.value)

    if (!Number.isFinite(hour)) {
      return
    }

    try {
      await updateReminderHour(hour)
      showSubmissionToast({
        message: `Reminder time set to ${logReminderHourOptions.find((option) => option.value === hour)?.label || 'your chosen time'}.`
      })
    } catch (error) {
      showSubmissionToast({ message: getErrorMessage(error), tone: 'error' })
    }
  }

  async function handleReminderEveningHourChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const hour = Number(target.value)

    if (!Number.isFinite(hour)) {
      return
    }

    try {
      await updateReminderEveningHour(hour)
      showSubmissionToast({
        message: `Evening reminder set to ${logReminderHourOptions.find((option) => option.value === hour)?.label || 'your chosen time'}.`
      })
    } catch (error) {
      showSubmissionToast({ message: getErrorMessage(error), tone: 'error' })
    }
  }

  async function sendTestLogReminder() {
    if (isSendingTestReminder.value) {
      return
    }

    isSendingTestReminder.value = true

    try {
      const result = await sendTestReminderNotification()

      if (result.ok) {
        showSubmissionToast({
          message: result.via === 'push'
            ? 'Background push test sent. Check your notification shade.'
            : result.message || 'Test notification shown. Check your notification shade.'
        })
        return
      }

      showSubmissionToast({
        message: result.message || 'Could not send a test notification.',
        tone: 'error'
      })
    } finally {
      isSendingTestReminder.value = false
    }
  }

  return {
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
  }
}
