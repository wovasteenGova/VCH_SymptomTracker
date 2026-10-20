import { useUserProfiles } from './useUserProfiles'
import { useSubmissionToast } from './useSubmissionToast'
import { useTrackedConditions } from './useTrackedConditions'
import { useCustomConditionLabels } from './useCustomConditionLabels'
import { buildShareConditionPickerLabels } from '../utils/conditionCatalog'
import { copyToClipboard } from '../utils/copyToClipboard'

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return 'Something went wrong. Please try again.'
}

export function useTrackerLayReportingSettings() {
  const route = useRoute()
  const { showSubmissionToast } = useSubmissionToast()
  const { trackedConditionKeys, loadTrackedConditions } = useTrackedConditions()
  const { persistedCustomConditionLabels } = useCustomConditionLabels()
  const {
    listSupporterProfiles,
    createSupporterProfile,
    createSupporterProfileLink,
    toggleSupporterProfile,
    deleteSupporterProfile
  } = useUserProfiles()

  const supporterForm = ref({
    link_label: '',
    visible_conditions: [] as string[]
  })
  const supporterProfiles = useState<any[]>('profile-page-supporters', () => [])
  const createdLink = ref('')
  const createdLinkCopied = ref(false)
  const createdLinkPanelEl = ref<HTMLElement | null>(null)
  const supporterError = ref('')
  const linkedEntryId = ref<string | null>(null)
  const linkedEntryContext = ref<null | { summary: string, condition: string }>(null)
  const isCreatingSupporter = ref(false)
  const isDeletingSupporterId = ref<string | null>(null)
  const isCopyingSupporterId = ref<string | null>(null)
  const copiedSupporterId = ref<string | null>(null)
  const pendingDeleteSupporter = ref<null | { id: string, display_name: string }>(null)

  const shareConditionOptions = computed(() => buildShareConditionPickerLabels({
    trackedKeys: trackedConditionKeys.value,
    customLabels: persistedCustomConditionLabels.value
  }))

  function applySupporterLinkFromRoute() {
    const entryId = typeof route.query.entry === 'string' ? route.query.entry : null
    const condition = typeof route.query.condition === 'string' ? route.query.condition : null
    const label = typeof route.query.label === 'string' ? route.query.label : null
    const summary = typeof route.query.summary === 'string' ? route.query.summary : null

    linkedEntryId.value = entryId

    if (condition) {
      supporterForm.value.visible_conditions = [condition]
    }

    if (label) {
      supporterForm.value.link_label = label
    }

    if (summary && condition) {
      linkedEntryContext.value = {
        summary,
        condition
      }
    }
  }

  async function prepareLayReportingPanel() {
    applySupporterLinkFromRoute()
    await loadTrackedConditions()
    await refreshSupporters()
  }

  async function refreshSupporters() {
    supporterProfiles.value = await listSupporterProfiles()
  }

  async function revealCreatedLink(url: string, toastMessage: string) {
    createdLink.value = url
    createdLinkCopied.value = false
    await nextTick()
    createdLinkPanelEl.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    showSubmissionToast({
      message: toastMessage,
      durationMs: 3600
    })
  }

  async function createSupporter() {
    supporterError.value = ''
    createdLink.value = ''

    if (!supporterForm.value.visible_conditions.length) {
      const message = 'Choose at least one condition to share.'
      supporterError.value = message
      showSubmissionToast({ message, tone: 'error' })
      return
    }

    isCreatingSupporter.value = true

    try {
      const payload = {
        ...supporterForm.value,
        linked_entry_id: linkedEntryId.value,
        entry_context_summary: linkedEntryContext.value?.summary || null
      }
      const { token } = await createSupporterProfile(payload)
      supporterForm.value = {
        link_label: '',
        visible_conditions: []
      }
      linkedEntryId.value = null
      linkedEntryContext.value = null
      await revealCreatedLink(
        `${window.location.origin}/report/${token}`,
        'Reporting link created. Copy it below.'
      )
      await refreshSupporters()
    } catch (error) {
      const message = getErrorMessage(error)
      supporterError.value = message
      showSubmissionToast({ message, tone: 'error' })
    } finally {
      isCreatingSupporter.value = false
    }
  }

  async function toggleSupporter(profile: any) {
    try {
      await toggleSupporterProfile(profile.id, !profile.active)
      await refreshSupporters()
    } catch (error) {
      showSubmissionToast({ message: getErrorMessage(error), tone: 'error' })
    }
  }

  async function copyCreatedLink() {
    if (!createdLink.value) {
      return
    }

    const copied = await copyToClipboard(createdLink.value)
    createdLinkCopied.value = copied
    if (copied) {
      supporterError.value = ''
      showSubmissionToast('Private link copied.')
      return
    }

    const message = 'Could not copy link. Copy it from the box below.'
    supporterError.value = message
    showSubmissionToast({ message, tone: 'error' })
  }

  async function copyExistingSupporterLink(profile: any) {
    supporterError.value = ''
    copiedSupporterId.value = null
    isCopyingSupporterId.value = profile.id

    try {
      const token = await createSupporterProfileLink(profile.id)
      const link = `${window.location.origin}/report/${token}`
      await revealCreatedLink(link, 'Private link ready. Copy it below.')
    } catch (error) {
      const message = getErrorMessage(error)
      supporterError.value = message
      showSubmissionToast({ message, tone: 'error' })
    } finally {
      isCopyingSupporterId.value = null
    }
  }

  function requestDeleteSupporter(profile: any) {
    pendingDeleteSupporter.value = {
      id: profile.id,
      display_name: profile.display_name || 'Private reporting link'
    }
  }

  function cancelDeleteSupporter() {
    pendingDeleteSupporter.value = null
  }

  async function confirmDeleteSupporter() {
    if (!pendingDeleteSupporter.value) {
      return
    }

    isDeletingSupporterId.value = pendingDeleteSupporter.value.id

    try {
      await deleteSupporterProfile(pendingDeleteSupporter.value.id)
      pendingDeleteSupporter.value = null
      showSubmissionToast('Reporting link deleted.')
      await refreshSupporters()
    } catch (error) {
      showSubmissionToast({
        message: getErrorMessage(error),
        tone: 'error'
      })
    } finally {
      isDeletingSupporterId.value = null
    }
  }

  return {
    supporterForm,
    supporterProfiles,
    createdLink,
    createdLinkCopied,
    createdLinkPanelEl,
    supporterError,
    linkedEntryContext,
    isCreatingSupporter,
    isDeletingSupporterId,
    isCopyingSupporterId,
    copiedSupporterId,
    pendingDeleteSupporter,
    shareConditionOptions,
    applySupporterLinkFromRoute,
    prepareLayReportingPanel,
    createSupporter,
    toggleSupporter,
    copyCreatedLink,
    copyExistingSupporterLink,
    requestDeleteSupporter,
    cancelDeleteSupporter,
    confirmDeleteSupporter
  }
}
