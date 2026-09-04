/** FAQ overlay opened from settings — state lives outside the settings panel so UPopover dismiss does not tear it down. */
export function useSettingsSupportOverlays() {
  const faqOpen = useState('symptom-tracker-settings-faq-open', () => false)
  const isOpen = computed(() => faqOpen.value)

  function openFaq() {
    faqOpen.value = true
  }

  function closeFaq() {
    faqOpen.value = false
  }

  function closeAll() {
    faqOpen.value = false
  }

  return {
    faqOpen,
    isOpen,
    openFaq,
    closeFaq,
    closeAll
  }
}
