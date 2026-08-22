import { onMounted, useRuntimeConfig, useState, useSupabaseClient } from '#imports'
import {
  buildLogReminderPayloads,
  DEFAULT_LOG_REMINDER_EVENING_HOUR,
  defaultLogReminderSettings,
  getBrowserTimezone,
  LOG_REMINDER_TEST_BODY,
  LOG_REMINDER_TEST_MODE,
  LOG_REMINDER_TEST_TITLE,
  markReminderSent,
  readLogReminderHour,
  readLogReminderTimezone,
  readLogRemindersEnabled,
  resolveReminderTimezone,
  wasReminderSent,
  writeLogReminderHour,
  writeLogRemindersEnabled,
  writeLogReminderTimezone,
  type SymptomEntryLike
} from '../utils/logReminders'
import {
  PUSH_NOTIFICATION_BADGE,
  PUSH_NOTIFICATION_ICON,
  PUSH_NOTIFICATION_TAG,
  resolveVapidPublicKey
} from '../utils/pushSubscription'
import type { LoggingCadence } from '../utils/loggingCadence'
import { usePushSubscriptions } from './usePushSubscriptions'

// Registered once per page load so multiple components using this composable
// don't stack duplicate listeners.
let permissionWatchersStarted = false

export function useLogReminders() {
  const config = useRuntimeConfig()
  const {
    subscribeToLogReminders,
    disablePushSubscription,
    syncProfileReminderSettings,
    hasActivePushSubscription
  } = usePushSubscriptions()
  const remindersEnabled = useState('log-reminders-enabled', () => readLogRemindersEnabled())
  const reminderHour = useState('log-reminder-hour', () => readLogReminderHour())
  const reminderEveningHour = useState('log-reminder-evening-hour', () => DEFAULT_LOG_REMINDER_EVENING_HOUR)
  const reminderTimezone = useState('log-reminder-timezone', () => readLogReminderTimezone())
  const permissionState = useState<NotificationPermission | 'unsupported'>('log-reminder-permission-state', () => 'default')
  const pushBackendConfigured = useState<boolean | null>('log-reminder-push-configured', () => null)
  const hasRegisteredPushSubscription = useState<boolean | null>('log-reminder-push-registered', () => null)
  const isReminderTogglePending = useState('log-reminder-toggle-pending', () => false)

  function syncPermissionState() {
    if (!import.meta.client || typeof Notification === 'undefined') {
      permissionState.value = 'unsupported'
      setRemindersEnabled(false)
      return
    }

    permissionState.value = Notification.permission

    if (permissionState.value === 'denied') {
      setRemindersEnabled(false)
      hasRegisteredPushSubscription.value = false
    }
  }

  async function requestReminderPermission() {
    if (!import.meta.client || typeof Notification === 'undefined') {
      permissionState.value = 'unsupported'
      return false
    }

    const result = await Notification.requestPermission()
    permissionState.value = result
    return result === 'granted'
  }

  function setRemindersEnabled(enabled: boolean) {
    remindersEnabled.value = enabled
    writeLogRemindersEnabled(enabled)
  }

  function setReminderHour(hour: number) {
    reminderHour.value = hour
    writeLogReminderHour(hour)
  }

  function setReminderTimezone(timeZone: string) {
    const resolved = resolveReminderTimezone(timeZone)
    reminderTimezone.value = resolved
    writeLogReminderTimezone(resolved)
  }

  function hydrateReminderSettings(input?: {
    log_reminders_enabled?: boolean | null
    reminder_hour?: number | null
    reminder_evening_hour?: number | null
    reminder_timezone?: string | null
  } | null) {
    const defaults = defaultLogReminderSettings()

    if (input?.reminder_hour != null && Number.isFinite(input.reminder_hour)) {
      setReminderHour(Number(input.reminder_hour))
    } else {
      setReminderHour(defaults.hour)
    }

    if (input?.reminder_evening_hour != null && Number.isFinite(input.reminder_evening_hour)) {
      reminderEveningHour.value = Number(input.reminder_evening_hour)
    } else {
      reminderEveningHour.value = defaults.eveningHour
    }

    const browserTimezone = getBrowserTimezone()
    setReminderTimezone(input?.reminder_timezone || browserTimezone)

    if (input?.log_reminders_enabled) {
      setRemindersEnabled(true)
    }

    if (input?.log_reminders_enabled && !input?.reminder_timezone) {
      void syncProfileReminderSettings({
        enabled: true,
        reminderHour: reminderHour.value,
        reminderEveningHour: reminderEveningHour.value,
        reminderTimezone: browserTimezone
      })
    }

    syncPermissionState()
  }

  async function persistReminderSettings(input?: {
    enabled?: boolean
    hour?: number
    timezone?: string
  }) {
    const enabled = input?.enabled ?? remindersEnabled.value
    const hour = input?.hour ?? reminderHour.value
    const timezone = resolveReminderTimezone(input?.timezone ?? reminderTimezone.value)

    setRemindersEnabled(enabled)
    setReminderHour(hour)
    setReminderTimezone(timezone)

    await syncProfileReminderSettings({
      enabled,
      reminderHour: hour,
      reminderEveningHour: reminderEveningHour.value,
      reminderTimezone: timezone
    })
  }

  async function showReminderNotification(title: string, body: string, tag = PUSH_NOTIFICATION_TAG) {
    if (!import.meta.client || permissionState.value !== 'granted') {
      return false
    }

    const options: NotificationOptions = {
      body,
      icon: PUSH_NOTIFICATION_ICON,
      badge: PUSH_NOTIFICATION_BADGE,
      tag,
      data: { url: '/' }
    }

    try {
      const registration = await navigator.serviceWorker?.ready

      if (registration?.showNotification) {
        await registration.showNotification(title, options)
        return true
      }

      return false
    } catch {
      return false
    }
  }

  async function sendTestReminderNotification() {
    syncPermissionState()

    if (permissionState.value !== 'granted') {
      return {
        ok: false as const,
        reason: 'permission' as const,
        message: 'Allow notifications first, then try the test again.'
      }
    }

    try {
      const registration = await navigator.serviceWorker?.ready
      await registration?.update()
    } catch {
      // Test can still proceed with the currently active worker.
    }

    let pushErrorMessage = ''

    // Prefer a real server Web Push so this validates the same path as
    // scheduled reminders (cron → push service → service worker).
    try {
      const supabase = useSupabaseClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (accessToken) {
        await $fetch('/api/reminders/test-push', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        return { ok: true as const, via: 'push' as const }
      }
    } catch (error) {
      pushErrorMessage = extractFetchErrorMessage(error)
    }

    const shown = await showReminderNotification(
      LOG_REMINDER_TEST_MODE ? LOG_REMINDER_TEST_TITLE : 'VCH — Test notification',
      LOG_REMINDER_TEST_MODE ? LOG_REMINDER_TEST_BODY : 'If you can read this, this device can show VCH reminder notifications.',
      'vch-log-reminder-test'
    )

    if (shown) {
      return {
        ok: true as const,
        via: 'local' as const,
        message: pushErrorMessage
          ? 'Local test shown. Background push still needs a fix — turn reminders Off, then Enable again.'
          : undefined
      }
    }

    return {
      ok: false as const,
      reason: 'show-failed' as const,
      message: pushErrorMessage
        || 'Could not show a notification. Turn reminders Off then Enable again, or reinstall the app.'
    }
  }

  async function runLogReminderCheck(input: {
    cadence: LoggingCadence
    weeklyLogDay: number
    entries: SymptomEntryLike[]
    isAuthenticated: boolean
  }) {
    if (!import.meta.client || !input.isAuthenticated || !remindersEnabled.value) {
      return
    }

    // During temporary test mode, always try local delivery so we can verify
    // notifications every couple of minutes without waiting on cron alone.
    if (!LOG_REMINDER_TEST_MODE && hasRegisteredPushSubscription.value) {
      return
    }

    syncPermissionState()

    if (permissionState.value !== 'granted') {
      return
    }

    const payloads = buildLogReminderPayloads({
      cadence: input.cadence,
      weeklyLogDay: input.weeklyLogDay,
      entries: input.entries,
      reminderHour: reminderHour.value,
      reminderEveningHour: reminderEveningHour.value,
      timeZone: reminderTimezone.value
    })

    for (const payload of payloads) {
      if (wasReminderSent(payload.dedupeKey)) {
        continue
      }

      const shown = await showReminderNotification(payload.title, payload.body)

      if (shown) {
        markReminderSent(payload.dedupeKey)
      }
    }
  }

  async function refreshPushReminderStatus() {
    if (isReminderTogglePending.value) {
      return
    }

    const publicKey = await resolveVapidPublicKey(String(config.public.vapidPublicKey || ''))
    pushBackendConfigured.value = Boolean(publicKey)
    syncPermissionState()

    if (!import.meta.client || permissionState.value !== 'granted') {
      hasRegisteredPushSubscription.value = null
      if (permissionState.value === 'denied' || permissionState.value === 'unsupported') {
        hasRegisteredPushSubscription.value = false
        setRemindersEnabled(false)
      }
      return
    }

    hasRegisteredPushSubscription.value = await hasActivePushSubscription()

    // The database + device permission are the source of truth: if this device
    // holds an active registration and the OS allows notifications, reminders
    // are really on (e.g. the user re-allowed them in device settings).
    if (hasRegisteredPushSubscription.value) {
      if (!remindersEnabled.value) {
        setRemindersEnabled(true)
      }
    } else {
      setRemindersEnabled(false)
    }
  }

  async function enableRemindersWithPermission() {
    if (isReminderTogglePending.value) {
      return {
        ok: false as const,
        reason: 'subscribe-failed' as const,
        message: 'Still finishing the last reminder change. Try again in a moment.'
      }
    }

    isReminderTogglePending.value = true

    try {
      const publicKey = await resolveVapidPublicKey(String(config.public.vapidPublicKey || ''))
      const timezone = getBrowserTimezone()

      pushBackendConfigured.value = Boolean(publicKey)
      syncPermissionState()
      setReminderTimezone(timezone)

      if (!reminderHour.value) {
        setReminderHour(defaultLogReminderSettings().hour)
      }

      if (permissionState.value === 'denied') {
        setRemindersEnabled(false)
        hasRegisteredPushSubscription.value = false

        return {
          ok: false as const,
          reason: 'permission-denied' as const
        }
      }

      if (permissionState.value === 'unsupported') {
        setRemindersEnabled(false)
        hasRegisteredPushSubscription.value = false

        return {
          ok: false as const,
          reason: 'unsupported' as const
        }
      }

      if (!publicKey) {
        setRemindersEnabled(false)
        return {
          ok: false as const,
          reason: 'missing-vapid' as const
        }
      }

      await subscribeToLogReminders(publicKey, {
        reminderHour: reminderHour.value,
        reminderEveningHour: reminderEveningHour.value,
        reminderTimezone: timezone
      })

      try {
        const registration = await navigator.serviceWorker?.ready
        await registration?.update()
      } catch {
        // Subscription already saved; SW refresh is best-effort.
      }

      syncPermissionState()
      hasRegisteredPushSubscription.value = await hasActivePushSubscription()

      if (permissionState.value !== 'granted' || !hasRegisteredPushSubscription.value) {
        setRemindersEnabled(false)

        return {
          ok: false as const,
          reason: 'subscribe-failed' as const,
          message: 'Notifications were allowed, but this device did not finish registering. Try Enable again.'
        }
      }

      setRemindersEnabled(true)

      return { ok: true as const }
    } catch (error) {
      setRemindersEnabled(false)
      hasRegisteredPushSubscription.value = false

      return {
        ok: false as const,
        reason: 'subscribe-failed' as const,
        message: error instanceof Error ? error.message : 'Could not register this device for push reminders.'
      }
    } finally {
      isReminderTogglePending.value = false
    }
  }

  async function disableReminders() {
    if (isReminderTogglePending.value) {
      return
    }

    isReminderTogglePending.value = true

    try {
      await disablePushSubscription()
      await syncProfileReminderSettings({
        enabled: false,
        reminderHour: reminderHour.value,
        reminderEveningHour: reminderEveningHour.value,
        reminderTimezone: reminderTimezone.value
      })
      setRemindersEnabled(false)
      hasRegisteredPushSubscription.value = false
      return { ok: true as const }
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : 'Could not turn off reminders.'
      }
    } finally {
      isReminderTogglePending.value = false
    }
  }

  async function updateReminderHour(hour: number) {
    setReminderHour(hour)

    await syncProfileReminderSettings({
      enabled: remindersEnabled.value,
      reminderHour: hour,
      reminderEveningHour: reminderEveningHour.value,
      reminderTimezone: reminderTimezone.value
    })
  }

  async function updateReminderEveningHour(hour: number) {
    reminderEveningHour.value = hour

    await syncProfileReminderSettings({
      enabled: remindersEnabled.value,
      reminderHour: reminderHour.value,
      reminderEveningHour: hour,
      reminderTimezone: reminderTimezone.value
    })
  }

  function startPermissionWatchers() {
    if (!import.meta.client || permissionWatchersStarted) {
      return
    }

    permissionWatchersStarted = true

    // Re-check whenever the user comes back to the app (e.g. after flipping
    // notifications in Samsung/Android/iOS settings).
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshPushReminderStatus()
      }
    })

    // Some browsers fire this live when the OS/browser permission changes,
    // without needing an app switch.
    if ('permissions' in navigator && typeof navigator.permissions?.query === 'function') {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          status.onchange = () => {
            refreshPushReminderStatus()
          }
        })
        .catch(() => undefined)
    }
  }

  onMounted(() => {
    syncPermissionState()
    refreshPushReminderStatus()
    startPermissionWatchers()

    if (import.meta.client && !window.localStorage.getItem('symptom-tracker-log-reminder-timezone')) {
      setReminderTimezone(getBrowserTimezone())
    }
  })

  return {
    remindersEnabled,
    reminderHour,
    reminderEveningHour,
    reminderTimezone,
    permissionState,
    pushBackendConfigured,
    hasRegisteredPushSubscription,
    isReminderTogglePending,
    refreshPushReminderStatus,
    requestReminderPermission,
    enableRemindersWithPermission,
    disableReminders,
    setRemindersEnabled,
    setReminderHour,
    setReminderTimezone,
    hydrateReminderSettings,
    persistReminderSettings,
    updateReminderHour,
    updateReminderEveningHour,
    runLogReminderCheck,
    sendTestReminderNotification,
    syncPermissionState
  }
}

function extractFetchErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return error instanceof Error ? error.message : ''
  }

  const withData = error as {
    message?: string
    data?: { message?: string; statusMessage?: string }
    statusMessage?: string
  }

  return String(
    withData.data?.message
      || withData.data?.statusMessage
      || withData.statusMessage
      || withData.message
      || ''
  ).trim()
}
