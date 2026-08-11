import { computed, onMounted } from 'vue'
import {
  browserIsStandalone,
  resolvePwaInstallPlatform,
  type BeforeInstallPromptChoice,
  type BeforeInstallPromptEvent,
  type PwaInstallPlatform
} from '../utils/pwaInstall'

export function usePwaInstall() {
  const installPrompt = useState<BeforeInstallPromptEvent | null>(
    'symptom-pwa-install-prompt',
    () => null
  )
  const installed = useState('symptom-pwa-installed', () => false)
  const platform = useState<PwaInstallPlatform>('symptom-pwa-platform', () => 'desktop')

  const installPlatform = computed<'ios' | 'android' | 'desktop'>(() => {
    if (platform.value === 'ios-safari' || platform.value === 'ios-other') return 'ios'
    return platform.value
  })
  const canPromptInstall = computed(() => Boolean(installPrompt.value) && !installed.value)

  async function promptInstall(): Promise<BeforeInstallPromptChoice | null> {
    const prompt = installPrompt.value
    if (!prompt || installed.value) return null

    await prompt.prompt()
    const choice = await prompt.userChoice
    installPrompt.value = null
    return choice
  }

  onMounted(() => {
    platform.value = resolvePwaInstallPlatform({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints
    })
    installed.value = browserIsStandalone()
  })

  return {
    installPrompt,
    installed,
    platform,
    installPlatform,
    canPromptInstall,
    promptInstall
  }
}
