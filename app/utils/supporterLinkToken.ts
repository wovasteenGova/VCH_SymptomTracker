/** Raw token size for new family report links (128-bit; stored as SHA-256 hash). */
export const SUPPORTER_LINK_TOKEN_BYTE_LENGTH = 16

export function createSupporterLinkToken(
  byteLength: number = SUPPORTER_LINK_TOKEN_BYTE_LENGTH
) {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('This browser cannot create a private link. Open the app over HTTPS and try again.')
  }

  const randomValues = new Uint8Array(byteLength)
  crypto.getRandomValues(randomValues)

  return Array.from(randomValues)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
