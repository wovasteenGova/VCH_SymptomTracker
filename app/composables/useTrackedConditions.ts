import { useState, useSupabaseClient } from '#imports'
import { computed, inject, ref } from 'vue'
import { useSupabaseAuth } from './useSupabaseAuth'
import { useTrackerDb } from './useTrackerDb'
import { TRACKER_DEMO_KEY } from './useTrackerLayout'
import { conditionKeyFromLabel } from '../utils/subscription'
import { normalizeTrackedConditionKeys } from '../utils/conditionCatalog'

const TRACKED_CONDITIONS_STORAGE_KEY = 'symptom-tracker-tracked-condition-keys'
const ONBOARDING_COMPLETED_STORAGE_KEY = 'symptom-tracker-conditions-onboarding-completed'
const DEMO_TRACKED_CONDITIONS_STORAGE_KEY = 'symptom-tracker-demo-tracked-condition-keys'
const DEMO_ONBOARDING_COMPLETED_STORAGE_KEY = 'symptom-tracker-demo-conditions-onboarding-completed'

function scopedStorageKey(baseKey: string, ownerId: string | null, isDemoMode: boolean) {
  return isDemoMode ? baseKey : `${baseKey}:${ownerId || 'guest'}`
}

function readStoredKeys(storageKey: string) {
  if (!import.meta.client) {
    return [] as string[]
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function readStoredOnboardingCompleted(onboardingKey: string) {
  if (!import.meta.client) {
    return false
  }

  return window.localStorage.getItem(onboardingKey) === 'true'
}

function writeLocalState(keys: string[], completed: boolean, storageKey: string, onboardingKey: string) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(keys))
  window.localStorage.setItem(onboardingKey, completed ? 'true' : 'false')
}

export function useTrackedConditions() {
  const isDemoMode = inject(TRACKER_DEMO_KEY, false)
  const storageKeyBase = isDemoMode ? DEMO_TRACKED_CONDITIONS_STORAGE_KEY : TRACKED_CONDITIONS_STORAGE_KEY
  const onboardingKeyBase = isDemoMode ? DEMO_ONBOARDING_COMPLETED_STORAGE_KEY : ONBOARDING_COMPLETED_STORAGE_KEY
  const supabase = useSupabaseClient()
  const trackerDb = useTrackerDb()
  const { user, isAuthLoading } = useSupabaseAuth()
  const initialOwnerId = isDemoMode ? 'demo' : user.value?.id ?? null
  const initialStorageKey = scopedStorageKey(storageKeyBase, initialOwnerId, isDemoMode)
  const initialOnboardingKey = scopedStorageKey(onboardingKeyBase, initialOwnerId, isDemoMode)
  const initialStoredKeys = readStoredKeys(initialStorageKey)
  const initialOnboardingCompleted = readStoredOnboardingCompleted(initialOnboardingKey) || initialStoredKeys.length > 0
  const trackedConditionKeys = ref<string[]>(normalizeTrackedConditionKeys(initialStoredKeys))
  const onboardingCompleted = ref(initialOnboardingCompleted)
  const isLoading = useState('tracker-conditions-loading', () => false)
  const hasLoadedTrackedConditions = useState('tracker-conditions-loaded', () => isDemoMode)
  const loadError = useState('tracker-conditions-load-error', () => '')
  const loadedOwnerId = useState<string | null>('tracker-conditions-owner-id', () => initialOwnerId)

  function localKeys(ownerId = user.value?.id ?? null) {
    return {
      storageKey: scopedStorageKey(storageKeyBase, ownerId, isDemoMode),
      onboardingKey: scopedStorageKey(onboardingKeyBase, ownerId, isDemoMode)
    }
  }

  const needsOnboarding = computed(() => {
    if (isDemoMode || !user.value || isAuthLoading.value) {
      return false
    }

    return !onboardingCompleted.value
  })
  const trackedConditionCount = computed(() => trackedConditionKeys.value.length)

  function applyLocalState(keys: string[], completed: boolean, ownerId = user.value?.id ?? null) {
    if (!isDemoMode && (user.value?.id ?? null) !== ownerId) return
    trackedConditionKeys.value = normalizeTrackedConditionKeys(keys)
    onboardingCompleted.value = completed
    loadedOwnerId.value = isDemoMode ? 'demo' : ownerId
    const scoped = localKeys(ownerId)
    writeLocalState(trackedConditionKeys.value, completed, scoped.storageKey, scoped.onboardingKey)
  }

  async function persistTrackedConditions(keys: string[], completed = onboardingCompleted.value) {
    const uniqueKeys = normalizeTrackedConditionKeys(keys)

    if (isDemoMode) {
      applyLocalState(uniqueKeys, completed, 'demo')
      return uniqueKeys
    }

    const expectedOwnerId = user.value?.id ?? null
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user || !expectedOwnerId) {
      throw userError || new Error('Please sign in before saving tracked conditions.')
    }
    if (userData.user.id !== expectedOwnerId || user.value?.id !== expectedOwnerId) {
      throw new Error('Your account changed before these conditions could be saved.')
    }

    applyLocalState(uniqueKeys, completed, expectedOwnerId)

    const { error } = await trackerDb
      .from('user_profiles')
      .upsert({
        user_id: userData.user.id,
        tracked_condition_keys: uniqueKeys,
        conditions_onboarding_completed: completed,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return uniqueKeys
  }

  async function loadTrackedConditions(entryConditionKeys: string[] = []) {
    if (isDemoMode) {
      const scoped = localKeys('demo')
      const storedKeys = readStoredKeys(scoped.storageKey)
      const localCompleted = readStoredOnboardingCompleted(scoped.onboardingKey)
      applyLocalState(storedKeys, localCompleted || storedKeys.length > 0, 'demo')
      hasLoadedTrackedConditions.value = true
      return
    }

    const expectedOwnerId = user.value?.id ?? null

    const showBootstrapLoading = !hasLoadedTrackedConditions.value
    if (showBootstrapLoading) {
      isLoading.value = true
    }
    loadError.value = ''

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        const scoped = localKeys(null)
        const storedKeys = readStoredKeys(scoped.storageKey)
        const localCompleted = readStoredOnboardingCompleted(scoped.onboardingKey)

        if (storedKeys.length) {
          applyLocalState(storedKeys, localCompleted, null)
          return
        }

        if (entryConditionKeys.length) {
          applyLocalState(entryConditionKeys.slice(0, 12), true, null)
          return
        }

        applyLocalState([], false, null)
        return
      }

      const ownerId = userData.user.id
      if (ownerId !== expectedOwnerId || user.value?.id !== expectedOwnerId) return

      const { data: profile, error: profileError } = await trackerDb
        .from('user_profiles')
        .select('tracked_condition_keys, conditions_onboarding_completed, free_condition_keys')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      let keys = normalizeTrackedConditionKeys([...(profile?.tracked_condition_keys || [])])
      let completed = Boolean(profile?.conditions_onboarding_completed)

      if (!keys.length && entryConditionKeys.length) {
        keys = normalizeTrackedConditionKeys(entryConditionKeys)
        completed = true
        await persistTrackedConditions(keys, completed)
        return
      }

      if (!keys.length && profile?.free_condition_keys?.length && !completed) {
        keys = normalizeTrackedConditionKeys([...profile.free_condition_keys])
        completed = keys.length > 0
        if (completed) {
          await persistTrackedConditions(keys, completed)
          return
        }
      }

      const scoped = localKeys(ownerId)
      const storedKeys = readStoredKeys(scoped.storageKey)
      const localCompleted = readStoredOnboardingCompleted(scoped.onboardingKey)

      if (!keys.length && storedKeys.length) {
        keys = normalizeTrackedConditionKeys(storedKeys)
        completed = localCompleted || storedKeys.length > 0
        await persistTrackedConditions(keys, completed)
        return
      }

      applyLocalState(keys, completed, ownerId)

      const rawKeys = [...(profile?.tracked_condition_keys || [])].filter(Boolean)
      const normalizedFromRaw = normalizeTrackedConditionKeys(rawKeys)
      const needsHeal = rawKeys.some((rawKey) => {
        const trimmed = rawKey?.trim()
        if (!trimmed) {
          return true
        }

        const [canonical] = normalizeTrackedConditionKeys([trimmed])
        return !canonical || canonical !== trimmed
      }) || normalizedFromRaw.length !== rawKeys.filter((rawKey) => rawKey?.trim()).length

      if (needsHeal && normalizedFromRaw.length) {
        await persistTrackedConditions(normalizedFromRaw, completed)
      }
    } catch (error) {
      if ((user.value?.id ?? null) !== expectedOwnerId) return
      loadError.value = error instanceof Error ? error.message : 'Could not load your conditions.'
      const scoped = localKeys(expectedOwnerId)
      applyLocalState(
        normalizeTrackedConditionKeys(readStoredKeys(scoped.storageKey)),
        readStoredOnboardingCompleted(scoped.onboardingKey),
        expectedOwnerId
      )
    } finally {
      if ((user.value?.id ?? null) === expectedOwnerId) {
        isLoading.value = false
        hasLoadedTrackedConditions.value = true
      }
    }
  }

  async function completeOnboarding(keys: string[]) {
    if (!keys.length) {
      throw new Error('Pick at least one condition to continue.')
    }

    return persistTrackedConditions(keys, true)
  }

  async function updateTrackedConditions(keys: string[]) {
    return persistTrackedConditions(keys, true)
  }

  function conditionKeyForLabel(label: string) {
    return conditionKeyFromLabel(label)
  }

  function resetTrackedConditionsLoadState() {
    hasLoadedTrackedConditions.value = false
    isLoading.value = false
    loadError.value = ''
    loadedOwnerId.value = null
  }

  return {
    trackedConditionKeys,
    onboardingCompleted,
    needsOnboarding,
    trackedConditionCount,
    isLoading,
    hasLoadedTrackedConditions,
    loadError,
    loadTrackedConditions,
    resetTrackedConditionsLoadState,
    completeOnboarding,
    updateTrackedConditions,
    applyLocalState,
    conditionKeyForLabel
  }
}
