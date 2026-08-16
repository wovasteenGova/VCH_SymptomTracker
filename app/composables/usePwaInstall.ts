import { computed, onBeforeUnmount, onMounted } from 'vue'
import {
  browserIsStandalone,
  resolvePwaInstallPlatform,
  resolvePwaInstallStatus,
  type BeforeInstallPromptChoice,
  type BeforeInstallPromptEvent,
  type PwaInstallPlatform
} from '../utils/pwaInstall'

function readInstalledRelatedApps() {
  if (typeof navigator === 'undefined' || !('getInstalledRelatedApps' in navigator)) {
    return undefined
  }

  return () => (
    navigator as Navigator & {
      getInstalledRelatedApps: () => Promise<Array<{ platform?: string }>>
    }
  ).getInstalledRelatedApps()
}

export function usePwaInstall() {
  const installPrompt = useState<BeforeInstallPromptEvent | null>(
    'symptom-pwa-install-prompt',
    () => null
  )
  const runningStandalone = useState('symptom-pwa-running-standalone', () => false)
  const installedOnDevice = useState('symptom-pwa-installed-on-device', () => false)
  const platform = useState<PwaInstallPlatform>('symptom-pwa-platform', () => 'desktop')

  const installPlatform = computed<'ios' | 'android' | 'desktop'>(() => {
    if (platform.value === 'ios-safari' || platform.value === 'ios-other') return 'ios'
    return platform.value
  })
  const isIosSafari = computed(() => platform.value === 'ios-safari')
  const isIosOther = computed(() => platform.value === 'ios-other')
  const isAndroid = computed(() => platform.value === 'android')
  const isDesktop = computed(() => platform.value === 'desktop')
  const installed = computed(() => installedOnDevice.value)
  const canPromptInstall = computed(() => Boolean(installPrompt.value) && !installedOnDevice.value)

  async function refreshInstallStatus() {
    const status = await resolvePwaInstallStatus({
      getInstalledRelatedApps: readInstalledRelatedApps()
    })
    runningStandalone.value = status.standalone
    installedOnDevice.value = status.installedOnDevice
  }

  async function promptInstall(): Promise<BeforeInstallPromptChoice | null> {
    const prompt = installPrompt.value
    if (!prompt || installedOnDevice.value) return null

    await prompt.prompt()
    const choice = await prompt.userChoice
    installPrompt.value = null
    if (choice.outcome === 'accepted') {
      installedOnDevice.value = true
      runningStandalone.value = browserIsStandalone()
    } else {
      await refreshInstallStatus()
    }
    return choice
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      void refreshInstallStatus()
    }
  }

  onMounted(() => {
    platform.value = resolvePwaInstallPlatform({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints
    })

    void refreshInstallStatus()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
    installPrompt,
    installed,
    runningStandalone,
    installedOnDevice,
    platform,
    installPlatform,
    isIosSafari,
    isIosOther,
    isAndroid,
    isDesktop,
    canPromptInstall,
    refreshInstallStatus,
    promptInstall
  }
}
