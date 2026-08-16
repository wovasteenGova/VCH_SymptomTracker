import {
  resolvePwaInstallStatus,
  type BeforeInstallPromptEvent
} from '../utils/pwaInstall'

declare global {
  interface Window {
    __symptomTrackerPwaRuntimeReady?: boolean
  }
}

export default defineNuxtPlugin(() => {
  const installPrompt = useState<BeforeInstallPromptEvent | null>(
    'symptom-pwa-install-prompt',
    () => null
  )
  const runningStandalone = useState('symptom-pwa-running-standalone', () => false)
  const installedOnDevice = useState('symptom-pwa-installed-on-device', () => false)

  const refreshInstallStatus = () => {
    const getInstalledRelatedApps = 'getInstalledRelatedApps' in navigator
      ? () => navigator.getInstalledRelatedApps()
      : undefined

    void resolvePwaInstallStatus({ getInstalledRelatedApps }).then((status) => {
      runningStandalone.value = status.standalone
      installedOnDevice.value = status.installedOnDevice
    })
  }

  if (window.__symptomTrackerPwaRuntimeReady) return
  window.__symptomTrackerPwaRuntimeReady = true

  refreshInstallStatus()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt.value = event as BeforeInstallPromptEvent
    installedOnDevice.value = false
    runningStandalone.value = false
  })

  window.addEventListener('appinstalled', () => {
    installPrompt.value = null
    installedOnDevice.value = true
    refreshInstallStatus()
  })
})
