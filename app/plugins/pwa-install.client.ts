import {
  browserIsStandalone,
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
  const installed = useState('symptom-pwa-installed', () => browserIsStandalone())

  if (window.__symptomTrackerPwaRuntimeReady) return
  window.__symptomTrackerPwaRuntimeReady = true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt.value = event as BeforeInstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    installPrompt.value = null
    installed.value = true
  })
})
