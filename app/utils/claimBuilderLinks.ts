import { VCH_CLAIMBUILDER_URL } from './subscription'
import { resolveVchClaimBuilderUrl } from './vchHost'

export function buildClaimBuilderUrl(input?: {
  claimBuilderUrl?: string | null
  hostname?: string | null
}) {
  const raw = String(input?.claimBuilderUrl ?? VCH_CLAIMBUILDER_URL).trim() || VCH_CLAIMBUILDER_URL
  return resolveVchClaimBuilderUrl(raw, input?.hostname)
}
