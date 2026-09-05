import type Stripe from 'stripe'
import {
  PRO_CHECKOUT_SUBMIT_MESSAGE,
  PRO_PRODUCT_KEY,
  TRACKER_PAYMENT_SOURCE,
  TRACKER_PAYMENT_TYPE_SUBSCRIPTION
} from '../../app/utils/subscription'

type CheckoutUser = {
  id: string
  email?: string | null
}

export const TRACKER_CHECKOUT_INTEGRATION_PREFIX = 'vch_tracker_pro_'

export function isStripePriceId(value: string) {
  return /^price_[A-Za-z0-9]+$/.test(String(value || '').trim())
}

export function buildTrackerCheckoutMetadata(userId: string) {
  return {
    user_id: userId,
    product_key: PRO_PRODUCT_KEY,
    payment_type: TRACKER_PAYMENT_TYPE_SUBSCRIPTION,
    source: TRACKER_PAYMENT_SOURCE,
    app: 'symptom_tracker'
  }
}

export function randomLetterSuffix(length = 8) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  let suffix = ''

  for (let index = 0; index < length; index += 1) {
    suffix += letters[Math.floor(Math.random() * letters.length)]
  }

  return suffix
}

export function buildCheckoutIntegrationIdentifier(suffix = randomLetterSuffix()) {
  return `${TRACKER_CHECKOUT_INTEGRATION_PREFIX}${suffix}`
}

export function buildSubscriptionLineItems(
  configuredPriceId: string
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  if (isStripePriceId(configuredPriceId)) {
    return [{ price: configuredPriceId, quantity: 1 }]
  }

  return []
}

export async function resolveSubscriptionLineItems(
  _stripe: Stripe,
  configuredPriceId: string
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
  const lineItems = buildSubscriptionLineItems(configuredPriceId)

  if (!lineItems.length) {
    throw new Error(
      'STRIPE_PRO_PRICE_ID must be a valid Stripe Price id (price_...). Checkout will not create ad-hoc prices.'
    )
  }

  return lineItems
}

export function buildSubscriptionCheckoutParams(options: {
  user: CheckoutUser
  baseUrl: string
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
  embedded?: boolean
  existingCustomerId?: string | null
  integrationIdentifier?: string
}): Stripe.Checkout.SessionCreateParams {
  const metadata = buildTrackerCheckoutMetadata(options.user.id)
  const baseUrl = String(options.baseUrl || '').replace(/\/$/, '')
  const shared: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: options.lineItems,
    client_reference_id: options.user.id,
    locale: 'auto',
    metadata,
    subscription_data: {
      metadata
    },
    custom_text: {
      submit: {
        message: PRO_CHECKOUT_SUBMIT_MESSAGE
      }
    }
  }

  // Never set payment_method_types — Dashboard + dynamic payment methods.
  if (options.existingCustomerId) {
    shared.customer = options.existingCustomerId
  } else if (options.user.email) {
    shared.customer_email = options.user.email
  }

  const withIntegrationId: Stripe.Checkout.SessionCreateParams = {
    ...shared,
    integration_identifier: options.integrationIdentifier || buildCheckoutIntegrationIdentifier()
  }

  if (options.embedded) {
    return {
      ...withIntegrationId,
      ui_mode: 'embedded',
      redirect_on_completion: 'if_required',
      return_url: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`
    }
  }

  return {
    ...withIntegrationId,
    success_url: `${baseUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/upgrade?canceled=1`
  }
}
