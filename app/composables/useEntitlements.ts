import { useState, useSupabaseClient } from '#imports'
import { computed, ref, watch } from 'vue'
import { useSupabaseAuth } from './useSupabaseAuth'
import { useTrackerDb } from './useTrackerDb'
import { resolveCatalogConditionByStoredKey } from '../utils/conditionCatalog'
import {
  FREE_CONDITION_LIMIT,
  PRO_PRODUCT_KEY,
  isActiveEntitlementStatus,
  canManageStripeBilling
} from '../utils/subscription'

function normalizeConditionKeyForComparison(conditionKey: string) {
  return resolveCatalogConditionByStoredKey(conditionKey)?.key ?? conditionKey
}

type EntitlementRow = {
  user_id: string
  product_key: string
  status: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  current_period_end?: string | null
  granted_by?: string | null
  grant_note?: string | null
  unlocked_at?: string | null
}

type ClaimBuilderFoundingPro = {
  source: string
  until: string
} | null

let entitlementsLoadPromise: Promise<void> | null = null
const PENDING_CHECKOUT_SESSION_KEY = 'symptom-tracker-pending-checkout-session'

export function rememberPendingCheckoutSession(sessionId: string) {
  if (import.meta.client && sessionId) {
    window.sessionStorage.setItem(PENDING_CHECKOUT_SESSION_KEY, sessionId)
  }
}

export function readPendingCheckoutSession() {
  if (!import.meta.client) {
    return ''
  }

  return window.sessionStorage.getItem(PENDING_CHECKOUT_SESSION_KEY) || ''
}

export function clearPendingCheckoutSession() {
  if (import.meta.client) {
    window.sessionStorage.removeItem(PENDING_CHECKOUT_SESSION_KEY)
  }
}

export function resolvePendingCheckoutSessionId(sessionIdFromQuery?: string | null) {
  const querySessionId = String(sessionIdFromQuery || '').trim()
  return querySessionId || readPendingCheckoutSession()
}

export function useEntitlements() {
  const supabase = useSupabaseClient()
  const trackerDb = useTrackerDb()
  const { user } = useSupabaseAuth()
  const entitlement = useState<EntitlementRow | null>('tracker-entitlement', () => null)
  const claimBuilderProEntitled = useState('tracker-claimbuilder-pro-entitled', () => false)
  const claimBuilderFoundingPro = useState<ClaimBuilderFoundingPro>('tracker-claimbuilder-founding-pro', () => null)
  const claimBuilderCurrentPeriodEnd = useState<string | null>('tracker-claimbuilder-current-period-end', () => null)
  const freeConditionKeys = useState<string[]>('tracker-free-condition-keys', () => [])
  const isLoading = useState('tracker-entitlements-loading', () => false)
  const loadError = useState('tracker-entitlements-error', () => '')
  const entitlementsLoaded = useState('tracker-entitlements-loaded', () => false)
  const loadedUserId = useState<string | null>('tracker-entitlements-user-id', () => null)

  watch(() => user.value?.id, (userId, previousUserId) => {
    if (userId === previousUserId) {
      return
    }

    if (!userId || (loadedUserId.value && loadedUserId.value !== userId)) {
      entitlement.value = null
      claimBuilderProEntitled.value = false
      claimBuilderFoundingPro.value = null
      claimBuilderCurrentPeriodEnd.value = null
      freeConditionKeys.value = []
      entitlementsLoaded.value = false
      loadedUserId.value = null
    }
  })

  const isClaimBuilderPro = computed(() => {
    return claimBuilderProEntitled.value && !isActiveEntitlementStatus(entitlement.value?.status)
  })
  const isPro = computed(() => isActiveEntitlementStatus(entitlement.value?.status) || claimBuilderProEntitled.value)
  const isComped = computed(() => entitlement.value?.status === 'comped')
  const canManageBilling = computed(() => canManageStripeBilling(entitlement.value))
  const canUseLoggingCharts = computed(() => true)
  const canUseAdvancedCharts = computed(() => isPro.value)
  const canUseCharts = computed(() => isPro.value)
  const canUseFamilyReporting = computed(() => isPro.value)
  const canExportPdf = computed(() => isPro.value)
  const freeConditionSlotsRemaining = computed(() => {
    return Math.max(0, FREE_CONDITION_LIMIT - freeConditionKeys.value.length)
  })
  const renewalLabel = computed(() => {
    if (!entitlement.value?.current_period_end || !isPro.value || isComped.value || isClaimBuilderPro.value) {
      return ''
    }

    return new Date(entitlement.value.current_period_end).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  })

  async function getAccessToken() {
    const { data: existing } = await supabase.auth.getSession()
    const session = existing.session

    if (session?.access_token) {
      const expiresAtMs = session.expires_at ? session.expires_at * 1000 : 0
      if (!expiresAtMs || expiresAtMs - Date.now() > 60_000) {
        return session.access_token
      }
    }

    const { data, error } = await supabase.auth.refreshSession()
    const refreshed = data.session

    if (error || !refreshed?.access_token) {
      throw new Error('Sign in to continue.')
    }

    return refreshed.access_token
  }

  async function persistFreeConditionKeys(userId: string, keys: string[]) {
    const uniqueKeys = [...new Set(keys.filter(Boolean))].slice(0, FREE_CONDITION_LIMIT)

    const { error } = await trackerDb
      .from('user_profiles')
      .upsert({
        user_id: userId,
        free_condition_keys: uniqueKeys,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    freeConditionKeys.value = uniqueKeys
    return uniqueKeys
  }

  function clearEntitlements() {
    entitlement.value = null
    claimBuilderProEntitled.value = false
    claimBuilderFoundingPro.value = null
    claimBuilderCurrentPeriodEnd.value = null
    freeConditionKeys.value = []
    entitlementsLoaded.value = false
    loadedUserId.value = null
  }

  async function loadClaimBuilderProEntitlement() {
    try {
      const accessToken = await getAccessToken()
      const response = await $fetch<{
        entitled: boolean
        planId: string
        currentPeriodEnd?: string | null
        foundingPro: ClaimBuilderFoundingPro
      }>('/api/claimbuilder/pro-entitlement', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      claimBuilderProEntitled.value = response.entitled
      claimBuilderCurrentPeriodEnd.value = response.currentPeriodEnd ?? null
      claimBuilderFoundingPro.value = response.foundingPro ?? null
    } catch {
      claimBuilderProEntitled.value = false
      claimBuilderCurrentPeriodEnd.value = null
      claimBuilderFoundingPro.value = null
    }
  }

  async function loadEntitlements(options: { force?: boolean } = {}) {
    if (options.force) {
      entitlementsLoadPromise = null
    } else if (entitlementsLoadPromise) {
      return entitlementsLoadPromise
    }

    entitlementsLoadPromise = (async () => {
      isLoading.value = true
      loadError.value = ''

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError || !userData.user) {
          clearEntitlements()
          return
        }

        const userId = userData.user.id

        const [
          { data: entitlementData, error: entitlementError },
          { data: profile, error: profileError },
          { data: entries, error: entriesError },
          _
        ] = await Promise.all([
          trackerDb
            .from('user_entitlements')
            .select('user_id, product_key, status, stripe_customer_id, stripe_subscription_id, current_period_end, granted_by, grant_note, unlocked_at')
            .eq('user_id', userId)
            .eq('product_key', PRO_PRODUCT_KEY)
            .maybeSingle(),
          trackerDb
            .from('user_profiles')
            .select('free_condition_keys')
            .eq('user_id', userId)
            .maybeSingle(),
          trackerDb
            .from('symptom_entries')
            .select('condition_key, created_at')
            .eq('user_id', userId)
            .eq('source', 'veteran')
            .order('created_at', { ascending: true }),
          loadClaimBuilderProEntitlement()
        ])

        if (entitlementError) {
          throw entitlementError
        }

        if (profileError) {
          throw profileError
        }

        if (entriesError) {
          throw entriesError
        }

        entitlement.value = entitlementData

        let selectedKeys = [...(profile?.free_condition_keys || [])].filter(Boolean)

        if (!selectedKeys.length && entries?.length) {
          selectedKeys = [...new Set(entries.map((entry) => entry.condition_key).filter(Boolean))].slice(0, FREE_CONDITION_LIMIT)
          if (selectedKeys.length) {
            await persistFreeConditionKeys(userId, selectedKeys)
          }
        } else {
          freeConditionKeys.value = selectedKeys.slice(0, FREE_CONDITION_LIMIT)
        }

        loadedUserId.value = userId
        entitlementsLoaded.value = true
      } catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Could not load plan details.'
      } finally {
        isLoading.value = false
      }
    })()

    try {
      await entitlementsLoadPromise
    } finally {
      entitlementsLoadPromise = null
    }
  }

  function canTrackCondition(conditionKey: string) {
    if (!conditionKey || isPro.value) {
      return true
    }

    const normalized = normalizeConditionKeyForComparison(conditionKey)
    return freeConditionKeys.value.some(
      (key) => normalizeConditionKeyForComparison(key) === normalized
    )
  }

  function canAddFreeCondition(conditionKey: string, loggedEntryCount = 0) {
    if (!conditionKey || isPro.value) {
      return true
    }

    if (canTrackCondition(conditionKey)) {
      return true
    }

    if (loggedEntryCount > 0) {
      return false
    }

    return freeConditionKeys.value.length < FREE_CONDITION_LIMIT
  }

  async function addFreeCondition(conditionKey: string) {
    if (!conditionKey || isPro.value || canTrackCondition(conditionKey)) {
      return freeConditionKeys.value
    }

    if (freeConditionKeys.value.length >= FREE_CONDITION_LIMIT) {
      throw new Error(`Free plan includes ${FREE_CONDITION_LIMIT} conditions. Upgrade to Pro for more.`)
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new Error('Sign in to continue.')
    }

    const normalized = normalizeConditionKeyForComparison(conditionKey)
    return persistFreeConditionKeys(userData.user.id, [...freeConditionKeys.value, normalized])
  }

  function canReplaceFreeCondition(conditionKey: string, loggedEntryCount: number) {
    if (!conditionKey || isPro.value || loggedEntryCount > 0) {
      return false
    }

    if (canTrackCondition(conditionKey)) {
      return false
    }

    return freeConditionKeys.value.length >= FREE_CONDITION_LIMIT
  }

  async function replaceFreeCondition(conditionKey: string, loggedEntryCount: number) {
    if (!canReplaceFreeCondition(conditionKey, loggedEntryCount)) {
      throw new Error('You can only change your free condition before logging your first entry.')
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new Error('Sign in to continue.')
    }

    const normalized = normalizeConditionKeyForComparison(conditionKey)
    return persistFreeConditionKeys(userData.user.id, [normalized])
  }

  async function syncFreeConditionKey(conditionKey: string) {
    if (!conditionKey || isPro.value) {
      return freeConditionKeys.value
    }

    const normalized = normalizeConditionKeyForComparison(conditionKey)
    const existingIndex = freeConditionKeys.value.findIndex(
      (key) => normalizeConditionKeyForComparison(key) === normalized
    )

    if (existingIndex >= 0) {
      const existingKey = freeConditionKeys.value[existingIndex]

      if (existingKey === normalized) {
        return freeConditionKeys.value
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Sign in to continue.')
      }

      const updatedKeys = [...freeConditionKeys.value]
      updatedKeys[existingIndex] = normalized
      return persistFreeConditionKeys(userData.user.id, updatedKeys)
    }

    return freeConditionKeys.value
  }

  async function createEmbeddedCheckoutSession() {
    const accessToken = await getAccessToken()

    try {
      const response = await $fetch<{ clientSecret: string, sessionId: string }>('/api/stripe/create-subscription-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          embedded: true
        }
      })

      if (!response.clientSecret) {
        throw new Error('Stripe checkout secret was missing.')
      }

      rememberPendingCheckoutSession(response.sessionId)

      return response
    } catch (error) {
      const fetchError = error as {
        statusCode?: number
        data?: { message?: string }
        message?: string
      }

      console.error('[checkout] embedded session failed', {
        statusCode: fetchError.statusCode,
        message: fetchError.data?.message || fetchError.message
      })

      throw new Error(fetchError.data?.message || fetchError.message || 'Could not start embedded checkout.')
    }
  }

  async function startCheckout() {
    let accessToken = ''

    try {
      accessToken = await getAccessToken()
    } catch (error) {
      console.error('[checkout] auth unavailable', error)
      throw error
    }

    try {
      const response = await $fetch<{ url: string, sessionId?: string }>('/api/stripe/create-subscription-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (response.sessionId) {
        rememberPendingCheckoutSession(response.sessionId)
      }

      if (!response.url) {
        throw new Error('Stripe checkout URL was missing.')
      }

      if (import.meta.client) {
        window.location.replace(response.url)
      }

      return response.url
    } catch (error) {
      const fetchError = error as {
        statusCode?: number
        data?: { message?: string }
        message?: string
      }

      console.error('[checkout] request failed', {
        statusCode: fetchError.statusCode,
        message: fetchError.data?.message || fetchError.message,
        data: fetchError.data
      })

      throw new Error(fetchError.data?.message || fetchError.message || 'Could not start checkout.')
    }
  }

  async function openBillingPortal() {
    if (!canManageBilling.value) {
      throw new Error('Your Pro access was not set up through a subscription we can manage here. If you think something is wrong, contact us.')
    }

    const accessToken = await getAccessToken()

    try {
      const response = await $fetch<{ url: string }>('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.url) {
        throw new Error('Billing portal URL was missing.')
      }

      if (import.meta.client) {
        window.location.href = response.url
      }

      return response.url
    } catch (error) {
      const fetchError = error as {
        statusCode?: number
        data?: { message?: string }
        message?: string
      }

      throw new Error(
        fetchError.data?.message
        || fetchError.message
        || 'We could not open the billing portal right now. If you think something is wrong, contact us.'
      )
    }
  }

  async function confirmCheckoutSession(sessionId: string) {
    const accessToken = await getAccessToken()

    const response = await $fetch<{ activated?: boolean }>('/api/stripe/confirm-subscription', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: {
        sessionId
      }
    })

    if (!response.activated) {
      throw new Error('Payment succeeded but Pro could not be activated yet.')
    }

    clearPendingCheckoutSession()
    await loadEntitlements({ force: true })
  }

  async function activateCheckoutSession(sessionId: string) {
    const normalizedSessionId = String(sessionId || '').trim()

    if (!normalizedSessionId) {
      throw new Error('Missing checkout session.')
    }

    await confirmCheckoutSession(normalizedSessionId)
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
    syncFreeConditionKey,
    startCheckout,
    createEmbeddedCheckoutSession,
    openBillingPortal,
    confirmCheckoutSession,
    activateCheckoutSession,
    readPendingCheckoutSession,
    clearPendingCheckoutSession,
    resolvePendingCheckoutSessionId
  }
}
