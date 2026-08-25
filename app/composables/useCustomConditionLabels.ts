import { useState, useSupabaseClient } from '#imports'
import { inject, ref } from 'vue'
import {
  customConditionLabelsChanged,
  mergeStoredCustomConditionLabels,
  normalizeCustomConditionLabels,
  shouldUploadLocalCustomConditionLabels
} from '../utils/customConditionLabels'
import { resolveTrackedConditionKey } from '../utils/conditionCatalog'
import { useSupabaseAuth } from './useSupabaseAuth'
import { useTrackerDb } from './useTrackerDb'
import { TRACKER_DEMO_KEY } from './useTrackerLayout'

const CUSTOM_CONDITION_LABELS_STORAGE_PREFIX = 'symptom-tracker-custom-condition-labels'

function scopedStorageKey(ownerId: string | null, isDemoMode: boolean) {
  if (isDemoMode) {
    return `${CUSTOM_CONDITION_LABELS_STORAGE_PREFIX}:demo`
  }

  return ownerId
    ? `${CUSTOM_CONDITION_LABELS_STORAGE_PREFIX}:${ownerId}`
    : CUSTOM_CONDITION_LABELS_STORAGE_PREFIX
}

function readLocalCustomConditionLabels(storageKey: string) {
  if (!import.meta.client) {
    return {} as Record<string, string>
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return {}
    }

    return normalizeCustomConditionLabels(JSON.parse(raw))
  } catch {
    return {}
  }
}

function writeLocalCustomConditionLabels(storageKey: string, labels: Record<string, string>) {
  if (!import.meta.client) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(labels))
}

function isMissingCustomConditionLabelsColumn(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: unknown }).message)
    : ''

  return /custom_condition_labels/i.test(message) && /column|schema cache/i.test(message)
}

export function useCustomConditionLabels() {
  const isDemoMode = inject(TRACKER_DEMO_KEY, false)
  const supabase = useSupabaseClient()
  const trackerDb = useTrackerDb()
  const { user } = useSupabaseAuth()
  const initialOwnerId = isDemoMode ? 'demo' : user.value?.id ?? null
  const initialStorageKey = scopedStorageKey(initialOwnerId, isDemoMode)
  const persistedCustomConditionLabels = ref<Record<string, string>>(
    readLocalCustomConditionLabels(initialStorageKey)
  )
  const isLoading = useState('tracker-custom-labels-loading', () => false)
  const hasLoadedCustomConditionLabels = useState('tracker-custom-labels-loaded', () => isDemoMode)
  const loadError = useState('tracker-custom-labels-load-error', () => '')
  const loadedOwnerId = useState<string | null>('tracker-custom-labels-owner-id', () => initialOwnerId)

  function storageKeyForOwner(ownerId = user.value?.id ?? null) {
    return scopedStorageKey(isDemoMode ? 'demo' : ownerId, isDemoMode)
  }

  function applyLocalLabels(labels: Record<string, string>, ownerId = user.value?.id ?? null) {
    if (!isDemoMode && (user.value?.id ?? null) !== ownerId) {
      return
    }

    persistedCustomConditionLabels.value = labels
    loadedOwnerId.value = isDemoMode ? 'demo' : ownerId
    writeLocalCustomConditionLabels(storageKeyForOwner(ownerId), labels)
  }

  async function persistCustomConditionLabels(
    labels: Record<string, string>,
    expectedOwnerId = user.value?.id ?? null
  ) {
    const normalized = normalizeCustomConditionLabels(labels)

    if (isDemoMode) {
      applyLocalLabels(normalized, 'demo')
      return normalized
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user || !expectedOwnerId) {
      throw userError || new Error('Please sign in before saving custom conditions.')
    }

    if (userData.user.id !== expectedOwnerId || user.value?.id !== expectedOwnerId) {
      throw new Error('Your account changed before custom conditions could be saved.')
    }

    applyLocalLabels(normalized, expectedOwnerId)

    const { error } = await trackerDb
      .from('user_profiles')
      .upsert({
        user_id: userData.user.id,
        custom_condition_labels: normalized,
        updated_at: new Date().toISOString()
      })

    if (error) {
      if (isMissingCustomConditionLabelsColumn(error)) {
        return normalized
      }

      throw error
    }

    return normalized
  }

  async function loadCustomConditionLabels() {
    const expectedOwnerId = isDemoMode ? 'demo' : user.value?.id ?? null
    const storageKey = storageKeyForOwner(expectedOwnerId)

    if (isDemoMode) {
      applyLocalLabels(readLocalCustomConditionLabels(storageKey), 'demo')
      hasLoadedCustomConditionLabels.value = true
      return
    }

    const showBootstrapLoading = !hasLoadedCustomConditionLabels.value
    if (showBootstrapLoading) {
      isLoading.value = true
    }
    loadError.value = ''

    const localLabels = readLocalCustomConditionLabels(storageKey)
    applyLocalLabels(localLabels, expectedOwnerId)

    if (!expectedOwnerId) {
      hasLoadedCustomConditionLabels.value = true
      isLoading.value = false
      return
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        return
      }

      if (userData.user.id !== expectedOwnerId || user.value?.id !== expectedOwnerId) {
        return
      }

      const { data: profile, error: profileError } = await trackerDb
        .from('user_profiles')
        .select('custom_condition_labels')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (profileError) {
        if (isMissingCustomConditionLabelsColumn(profileError)) {
          return
        }

        throw profileError
      }

      const remoteLabels = normalizeCustomConditionLabels(profile?.custom_condition_labels)
      const mergedLabels = mergeStoredCustomConditionLabels(remoteLabels, localLabels)
      applyLocalLabels(mergedLabels, expectedOwnerId)

      if (shouldUploadLocalCustomConditionLabels(remoteLabels, localLabels)) {
        await persistCustomConditionLabels(mergedLabels, expectedOwnerId)
      }
    } catch (error) {
      if ((user.value?.id ?? null) !== expectedOwnerId) {
        return
      }

      loadError.value = error instanceof Error ? error.message : 'Could not load custom conditions.'
      applyLocalLabels(readLocalCustomConditionLabels(storageKey), expectedOwnerId)
    } finally {
      if ((user.value?.id ?? null) === expectedOwnerId || isDemoMode) {
        isLoading.value = false
        hasLoadedCustomConditionLabels.value = true
      }
    }
  }

  function reloadPersistedCustomConditionLabels() {
    applyLocalLabels(readLocalCustomConditionLabels(storageKeyForOwner()), user.value?.id ?? null)
  }

  async function rememberCustomConditionLabel(key: string, label: string) {
    const trimmedKey = key.trim()
    const trimmedLabel = label.trim()

    if (!trimmedKey || !trimmedLabel) {
      return
    }

    const nextLabels = {
      ...persistedCustomConditionLabels.value,
      [trimmedKey]: trimmedLabel
    }

    await persistCustomConditionLabels(nextLabels)
  }

  async function forgetCustomConditionLabel(key: string) {
    const normalizedTarget = resolveTrackedConditionKey(key) ?? key.trim()
    if (!normalizedTarget) {
      return
    }

    const nextLabels = { ...persistedCustomConditionLabels.value }
    let changed = false

    for (const existingKey of Object.keys(nextLabels)) {
      const normalizedExisting = resolveTrackedConditionKey(existingKey) ?? existingKey
      if (normalizedExisting === normalizedTarget) {
        delete nextLabels[existingKey]
        changed = true
      }
    }

    if (!changed) {
      return
    }

    await persistCustomConditionLabels(nextLabels)
  }

  function resetCustomConditionLabelsLoadState() {
    hasLoadedCustomConditionLabels.value = false
    isLoading.value = false
    loadError.value = ''
    loadedOwnerId.value = null
  }

  function resetCustomConditionLabels() {
    applyLocalLabels({}, user.value?.id ?? null)
  }

  return {
    persistedCustomConditionLabels,
    isLoading,
    hasLoadedCustomConditionLabels,
    loadError,
    loadCustomConditionLabels,
    reloadPersistedCustomConditionLabels,
    rememberCustomConditionLabel,
    forgetCustomConditionLabel,
    resetCustomConditionLabels,
    resetCustomConditionLabelsLoadState
  }
}
