import type Stripe from 'stripe'
import { PRO_PRODUCT_KEY } from '../../app/utils/subscription'
import { getSupabaseAdmin } from './supabaseAdmin'
import { getStripeClient } from './stripeClient'
import { getSubscriptionCurrentPeriodEnd, stripeObjectId } from './stripeWebhook'

type EntitlementUpsert = {
  user_id: string
  product_key: string
  status: 'active' | 'canceled' | 'past_due' | 'comped'
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  stripe_price_id?: string | null
  current_period_end?: string | null
  unlocked_at?: string
}

type SubscriptionSyncFallback = {
  userId?: string | null
  productKey?: string | null
}

export function mapSubscriptionStatus(status: Stripe.Subscription.Status) {
  if (status === 'active' || status === 'trialing') {
    return 'active' as const
  }

  if (status === 'past_due' || status === 'unpaid') {
    return 'past_due' as const
  }

  return 'canceled' as const
}

export async function upsertEntitlement(payload: EntitlementUpsert) {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('user_entitlements')
    .upsert({
      ...payload,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,product_key'
    })

  if (error) {
    throw error
  }
}

async function findExistingEntitlementBySubscription(subscriptionId: string) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('user_entitlements')
    .select('user_id, product_key')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function syncSubscriptionEntitlement(
  subscription: Stripe.Subscription,
  fallback: SubscriptionSyncFallback = {}
) {
  const existingEntitlement = subscription.metadata?.user_id || fallback.userId
    ? null
    : await findExistingEntitlementBySubscription(subscription.id)
  const userId = subscription.metadata?.user_id || fallback.userId || existingEntitlement?.user_id

  if (!userId) {
    throw new Error('Subscription is missing user_id metadata.')
  }

  const status = mapSubscriptionStatus(subscription.status)
  const priceId = subscription.items.data[0]?.price?.id || null
  const periodEndUnix = getSubscriptionCurrentPeriodEnd(subscription)
  const periodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null

  await upsertEntitlement({
    user_id: userId,
    product_key: subscription.metadata?.product_key || fallback.productKey || existingEntitlement?.product_key || PRO_PRODUCT_KEY,
    status,
    stripe_customer_id: stripeObjectId(subscription.customer),
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_end: periodEnd,
    unlocked_at: new Date().toISOString()
  })

  return true
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id || session.client_reference_id

  if (!userId) {
    throw new Error('Checkout session is missing user_id metadata.')
  }

  if (session.mode === 'subscription' && session.subscription) {
    const stripe = getStripeClient()
    const subscriptionId = stripeObjectId(session.subscription)

    if (!subscriptionId) {
      throw new Error('Checkout session is missing subscription id.')
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return syncSubscriptionEntitlement(subscription, {
      userId,
      productKey: session.metadata?.product_key || PRO_PRODUCT_KEY
    })
  }

  await upsertEntitlement({
    user_id: userId,
    product_key: session.metadata?.product_key || PRO_PRODUCT_KEY,
    status: 'active',
    stripe_customer_id: stripeObjectId(session.customer),
    unlocked_at: new Date().toISOString()
  })

  return true
}
