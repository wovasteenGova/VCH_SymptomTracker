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
  const storageKey = isDemoMode ? DEMO_TRACKED_CONDITIONS_STORAGE_KEY : TRACKED_CONDITIONS_STORAGE_KEY
  const onboardingKey = isDemoMode ? DEMO_ONBOARDING_COMPLETED_STORAGE_KEY : ONBOARDING_COMPLETED_STORAGE_KEY
  const supabase = useSupabaseClient()
  const trackerDb = useTrackerDb()
  const { user, isAuthLoading } = useSupabaseAuth()
  const initialStoredKeys = readStoredKeys(storageKey)
  const initialOnboardingCompleted = readStoredOnboardingCompleted(onboardingKey) || initialStoredKeys.length > 0
  const trackedConditionKeys = ref<string[]>(normalizeTrackedConditionKeys(initialStoredKeys))
  const onboardingCompleted = ref(initialOnboardingCompleted)
  const isLoading = useState('tracker-conditions-loading', () => false)
  const hasLoadedTrackedConditions = useState('tracker-conditions-loaded', () => isDemoMode)
  const loadError = useState('tracker-conditions-load-error', () => '')

  const needsOnboarding = computed(() => {
    if (isDemoMode || !user.value || isAuthLoading.value) {
      return false
    }

    return !onboardingCompleted.value
  })
  const trackedConditionCount = computed(() => trackedConditionKeys.value.length)

  function applyLocalState(keys: string[], completed: boolean) {
    trackedConditionKeys.value = normalizeTrackedConditionKeys(keys)
    onboardingCompleted.value = completed
    writeLocalState(trackedConditionKeys.value, completed, storageKey, onboardingKey)
  }

  async function persistTrackedConditions(keys: string[], completed = onboardingCompleted.value) {
    const uniqueKeys = normalizeTrackedConditionKeys(keys)
    trackedConditionKeys.value = uniqueKeys
    onboardingCompleted.value = completed
    writeLocalState(uniqueKeys, completed, storageKey, onboardingKey)

    if (isDemoMode) {
      return uniqueKeys
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return uniqueKeys
    }

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
      const localKeys = readStoredKeys(storageKey)
      const localCompleted = readStoredOnboardingCompleted(onboardingKey)
      applyLocalState(localKeys, localCompleted || localKeys.length > 0)
      hasLoadedTrackedConditions.value = true
      return
    }

    const showBootstrapLoading = !hasLoadedTrackedConditions.value
    if (showBootstrapLoading) {
      isLoading.value = true
    }
    loadError.value = ''

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        const localKeys = readStoredKeys(storageKey)
        const localCompleted = readStoredOnboardingCompleted(onboardingKey)

        if (localKeys.length) {
          applyLocalState(localKeys, localCompleted)
          return
        }

        if (entryConditionKeys.length) {
          applyLocalState(entryConditionKeys.slice(0, 12), true)
          return
        }

        applyLocalState([], false)
        return
      }

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

      const localKeys = readStoredKeys(storageKey)
      const localCompleted = readStoredOnboardingCompleted(onboardingKey)

      if (!keys.length && localKeys.length) {
        keys = normalizeTrackedConditionKeys(localKeys)
        completed = localCompleted || localKeys.length > 0
        await persistTrackedConditions(keys, completed)
        return
      }

      trackedConditionKeys.value = keys
      onboardingCompleted.value = completed
      writeLocalState(keys, completed, storageKey, onboardingKey)

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
      loadError.value = error instanceof Error ? error.message : 'Could not load your conditions.'
      trackedConditionKeys.value = normalizeTrackedConditionKeys(readStoredKeys(storageKey))
      onboardingCompleted.value = readStoredOnboardingCompleted(onboardingKey)
    } finally {
      isLoading.value = false
      hasLoadedTrackedConditions.value = true
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
