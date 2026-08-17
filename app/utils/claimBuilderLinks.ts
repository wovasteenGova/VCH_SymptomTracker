import { VCH_CLAIMBUILDER_URL } from './subscription'

export function buildClaimBuilderUrl(input?: { claimBuilderUrl?: string | null }) {
  const raw = String(input?.claimBuilderUrl ?? VCH_CLAIMBUILDER_URL).trim() || VCH_CLAIMBUILDER_URL
  return raw.replace(/\/$/, '')
}
