/** Header workspace settings overlays (lay reporting, log notifications). */
export function useTrackerHeaderSettingsOverlays() {
  const layReportingOpen = useState('tracker-lay-reporting-settings-open', () => false)
  const logNotificationsOpen = useState('tracker-log-notifications-settings-open', () => false)

  function closeHeaderSettingsOverlays() {
    layReportingOpen.value = false
    logNotificationsOpen.value = false
  }

  function openLayReportingSettingsOverlay() {
    logNotificationsOpen.value = false
    layReportingOpen.value = true
  }

  function openLogNotificationsSettingsOverlay() {
    layReportingOpen.value = false
    logNotificationsOpen.value = true
  }

  return {
    layReportingOpen,
    logNotificationsOpen,
    closeHeaderSettingsOverlays,
    openLayReportingSettingsOverlay,
    openLogNotificationsSettingsOverlay
  }
}
