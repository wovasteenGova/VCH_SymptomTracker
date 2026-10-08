import { useState } from '#imports'
import { computed } from 'vue'
import { useSupabaseAuth } from './useSupabaseAuth'

/** Symptom Tracker is free: all features are available to signed-in users. */
export function useEntitlements() {
  const { user } = useSupabaseAuth()
  const isLoading = useState('tracker-entitlements-loading', () => false)
  const loadError = useState('tracker-entitlements-error', () => '')
  const entitlementsLoaded = useState('tracker-entitlements-loaded', () => false)
  const loadedUserId = useState<string | null>('tracker-entitlements-user-id', () => null)

  const isPro = computed(() => true)
  const isClaimBuilderPro = computed(() => false)
  const isComped = computed(() => false)
  const claimBuilderFoundingPro = computed(() => null)
  const claimBuilderCurrentPeriodEnd = computed(() => null)
  const freeConditionKeys = computed(() => [] as string[])
  const canUseLoggingCharts = computed(() => true)
  const canUseAdvancedCharts = computed(() => true)
  const canUseCharts = computed(() => true)
  const canUseFamilyReporting = computed(() => true)
  const canExportPdf = computed(() => true)
  const freeConditionSlotsRemaining = computed(() => Number.POSITIVE_INFINITY)
  const renewalLabel = computed(() => '')
  const canManageBilling = computed(() => false)
  const entitlement = computed(() => null)

  async function loadEntitlements(options: { force?: boolean } = {}) {
    void options.force
    isLoading.value = true
    loadError.value = ''

    try {
      const userId = user.value?.id
      if (!userId) {
        entitlementsLoaded.value = false
        loadedUserId.value = null
        return
      }

      loadedUserId.value = userId
      entitlementsLoaded.value = true
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load account details.'
    } finally {
      isLoading.value = false
    }
  }

  function canTrackCondition(_conditionKey?: string) {
    return true
  }

  function canAddFreeCondition(_conditionKey?: string, _loggedEntryCount = 0) {
    return true
  }

  async function addFreeCondition(_conditionKey?: string) {
    return [] as string[]
  }

  function canReplaceFreeCondition(_conditionKey?: string, _loggedEntryCount = 0) {
    return false
  }

  async function replaceFreeCondition(_conditionKey?: string, _loggedEntryCount = 0) {
    return [] as string[]
  }

  async function syncFreeConditionKey(_conditionKey?: string) {
    return [] as string[]
  }

  return {
    entitlement,
    freeConditionKeys,
    isLoading,
    loadError,
    entitlementsLoaded,
    isPro,
    isClaimBuilderPro,
    isComped,
    claimBuilderFoundingPro,
    claimBuilderCurrentPeriodEnd,
    canUseLoggingCharts,
    canUseAdvancedCharts,
    canUseCharts,
    canUseFamilyReporting,
    canExportPdf,
    freeConditionSlotsRemaining,
    renewalLabel,
    canManageBilling,
    loadEntitlements,
    canTrackCondition,
    canAddFreeCondition,
    addFreeCondition,
    canReplaceFreeCondition,
    replaceFreeCondition,
    syncFreeConditionKey
  }
}
