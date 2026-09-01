import { isVchProductionHost } from './vchHost'

export const PASSKEY_PRODUCTION_HOST_MESSAGE =
  'Passkeys only work on the Veterans Central Hub production site, not on this address.'

export function isPasskeyProductionHost() {
  if (!import.meta.client) return true
  return isVchProductionHost(window.location.hostname)
}
