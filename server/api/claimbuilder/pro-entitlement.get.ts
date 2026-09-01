import { getRequestHost } from 'h3'
import { requireAuthUser } from '../../utils/authUser'
import { resolveVchClaimBuilderUrl } from '../../../app/utils/vchHost'

type ClaimBuilderEntitlementResponse = {
  entitled: boolean
  planId: string
  foundingPro: {
    source: string
    until: string
  } | null
}

const FALLBACK: ClaimBuilderEntitlementResponse = {
  entitled: false,
  planId: 'free',
  foundingPro: null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const claimBuilderUrl = resolveVchClaimBuilderUrl(
    config.public.claimBuilderUrl,
    getRequestHost(event, { xForwardedHost: true })
  )

  if (!claimBuilderUrl) {
    return FALLBACK
  }

  let accessToken = ''

  try {
    const auth = await requireAuthUser(event)
    accessToken = auth.accessToken
  } catch {
    return FALLBACK
  }

  try {
    return await $fetch<ClaimBuilderEntitlementResponse>(
      `${claimBuilderUrl}/api/billing/symptom-tracker-entitlement`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
  } catch {
    return FALLBACK
  }
})
