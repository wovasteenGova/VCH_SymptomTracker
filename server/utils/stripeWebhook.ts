import type Stripe from 'stripe'

export const TRACKER_STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
] as const

export type TrackerStripeWebhookEvent = typeof TRACKER_STRIPE_WEBHOOK_EVENTS[number]

export function isTrackerStripeWebhookEvent(type: string): type is TrackerStripeWebhookEvent {
  return (TRACKER_STRIPE_WEBHOOK_EVENTS as readonly string[]).includes(type)
}

export function getInvoiceSubscriptionId(invoice: {
  subscription?: string | { id?: string } | null
  parent?: {
    subscription_details?: {
      subscription?: string | { id?: string } | null
    } | null
  } | null
}): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription
  const fromLegacy = invoice.subscription
  const raw = fromParent ?? fromLegacy

  if (!raw) {
    return null
  }

  return typeof raw === 'string' ? raw : raw.id || null
}

export function getSubscriptionCurrentPeriodEnd(subscription: {
  current_period_end?: number | null
  items?: { data?: Array<{ current_period_end?: number | null }> }
}): number | null {
  const itemEnd = subscription.items?.data?.[0]?.current_period_end

  if (typeof itemEnd === 'number') {
    return itemEnd
  }

  if (typeof subscription.current_period_end === 'number') {
    return subscription.current_period_end
  }

  return null
}

export function stripeObjectId(value: string | { id?: string } | null | undefined) {
  if (!value) {
    return null
  }

  return typeof value === 'string' ? value : value.id || null
}

export async function syncInvoiceSubscription(
  invoice: Stripe.Invoice,
  retrieveSubscription: (subscriptionId: string) => Promise<Stripe.Subscription>,
  syncSubscription: (subscription: Stripe.Subscription) => Promise<unknown>
) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)

  if (!subscriptionId) {
    return false
  }

  const subscription = await retrieveSubscription(subscriptionId)
  await syncSubscription(subscription)
  return true
}
