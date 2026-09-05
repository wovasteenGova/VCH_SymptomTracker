import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  PRO_PRODUCT_KEY,
  TRACKER_PAYMENT_SOURCE,
  TRACKER_PAYMENT_TYPE_SUBSCRIPTION
} from '../app/utils/subscription'
import {
  isAllowedCheckoutOrigin,
  resolveRequestBaseUrl
} from '../server/utils/stripeClient'
import {
  TRACKER_CHECKOUT_INTEGRATION_PREFIX,
  buildCheckoutIntegrationIdentifier,
  buildSubscriptionCheckoutParams,
  buildSubscriptionLineItems,
  buildTrackerCheckoutMetadata,
  isStripePriceId,
  resolveSubscriptionLineItems
} from '../server/utils/subscriptionCheckoutSession'
import {
  TRACKER_STRIPE_WEBHOOK_EVENTS,
  getInvoiceSubscriptionId,
  getSubscriptionCurrentPeriodEnd,
  isTrackerStripeWebhookEvent,
  stripeObjectId
} from '../server/utils/stripeWebhook'

const STRIPE_SERVER_FILES = [
  'server/utils/stripeClient.ts',
  'server/utils/subscriptionCheckoutSession.ts',
  'server/utils/stripeEntitlements.ts',
  'server/utils/stripeWebhook.ts',
  'server/api/stripe/create-subscription-checkout.post.ts',
  'server/api/stripe/create-portal-session.post.ts',
  'server/api/stripe/confirm-subscription.post.ts',
  'server/api/stripe/webhook.post.ts'
]

describe('Stripe source lockdown', () => {
  it('never sends payment_method_types and does not pin API 2023-10-16', () => {
    for (const file of STRIPE_SERVER_FILES) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toContain('payment_method_types')
      expect(source).not.toContain("apiVersion: '2023-10-16'")
    }

    const client = readFileSync('server/utils/stripeClient.ts', 'utf8')
    expect(client).toContain('apiVersion: Stripe.API_VERSION')
  })

  it('documents the production webhook URL and Render secrets', () => {
    const docs = readFileSync('docs/stripe-tracker.md', 'utf8')
    const envExample = readFileSync('.env.example', 'utf8')
    const render = readFileSync('render.yaml', 'utf8')

    expect(docs).toContain('https://tracker.veteranscentralhub.us/api/stripe/webhook')
    expect(docs).toContain('STRIPE_WEBHOOK_SECRET')
    expect(docs).toContain('Tracker sandbox')
    expect(docs).toContain('$6.99/month')
    expect(envExample).toContain('docs/stripe-tracker.md')
    expect(render).toContain('STRIPE_WEBHOOK_SECRET')
    expect(render).toContain('STRIPE_PRO_PRICE_ID')
    const netlify = readFileSync('netlify.toml', 'utf8')
    expect(netlify).toContain('STRIPE_PUBLIC_KEY')
    expect(netlify).toContain('SECRETS_SCAN_OMIT_PATHS')
  })
})

describe('checkout session params', () => {
  const user = { id: 'user-123', email: 'vet@example.com' }
  const lineItems = [{ price: 'price_abc123', quantity: 1 }]

  it('builds hosted subscription checkout with metadata, email, and return URLs', () => {
    const params = buildSubscriptionCheckoutParams({
      user,
      baseUrl: 'https://tracker.veteranscentralhub.us/',
      lineItems,
      integrationIdentifier: 'vch_tracker_pro_abcdefgh'
    })

    expect(params.mode).toBe('subscription')
    expect(params.customer_email).toBe('vet@example.com')
    expect(params.success_url).toBe(
      'https://tracker.veteranscentralhub.us/upgrade/success?session_id={CHECKOUT_SESSION_ID}'
    )
    expect(params.cancel_url).toBe('https://tracker.veteranscentralhub.us/upgrade?canceled=1')
    expect(params.metadata).toMatchObject({
      user_id: 'user-123',
      product_key: PRO_PRODUCT_KEY,
      payment_type: TRACKER_PAYMENT_TYPE_SUBSCRIPTION,
      source: TRACKER_PAYMENT_SOURCE,
      app: 'symptom_tracker'
    })
    expect(params.subscription_data?.metadata).toMatchObject(params.metadata || {})
    expect(params).not.toHaveProperty('payment_method_types')
    expect((params as { integration_identifier?: string }).integration_identifier)
      .toBe('vch_tracker_pro_abcdefgh')
  })

  it('builds embedded checkout return URL and reuses an existing customer', () => {
    const params = buildSubscriptionCheckoutParams({
      user,
      baseUrl: 'http://localhost:3001',
      lineItems,
      embedded: true,
      existingCustomerId: 'cus_existing'
    })

    expect(params.ui_mode).toBe('embedded')
    expect(params.customer).toBe('cus_existing')
    expect(params.customer_email).toBeUndefined()
    expect(params.return_url).toBe(
      'http://localhost:3001/upgrade/success?session_id={CHECKOUT_SESSION_ID}'
    )
    expect(params.success_url).toBeUndefined()
  })

  it('lets Checkout collect email when the account has none', () => {
    const params = buildSubscriptionCheckoutParams({
      user: { id: 'user-no-email' },
      baseUrl: 'https://tracker.veteranscentralhub.com',
      lineItems
    })

    expect(params.customer_email).toBeUndefined()
    expect(params.customer).toBeUndefined()
  })

  it('requires a catalog Price id instead of creating ad-hoc prices', async () => {
    expect(isStripePriceId('price_1Tz1XyQVbQe31Q8YakrCXJsP')).toBe(true)
    expect(isStripePriceId('prod_abc')).toBe(false)
    expect(buildSubscriptionLineItems('')).toEqual([])
    await expect(resolveSubscriptionLineItems({} as never, '')).rejects.toThrow('STRIPE_PRO_PRICE_ID')
  })

  it('tags Checkout with a tracker integration identifier', () => {
    expect(buildCheckoutIntegrationIdentifier('zzzzzzzz')).toBe('vch_tracker_pro_zzzzzzzz')
    expect(buildTrackerCheckoutMetadata('u1').source).toBe('tracker')
    expect(TRACKER_CHECKOUT_INTEGRATION_PREFIX).toBe('vch_tracker_pro_')
  })
})

describe('checkout origin allowlist', () => {
  it('allows production, local, and preview hosts', () => {
    expect(isAllowedCheckoutOrigin('https://tracker.veteranscentralhub.us')).toBe(true)
    expect(isAllowedCheckoutOrigin('https://tracker.veteranscentralhub.com')).toBe(true)
    expect(isAllowedCheckoutOrigin('http://localhost:3001')).toBe(true)
    expect(isAllowedCheckoutOrigin('https://pr-12.onrender.com')).toBe(true)
    expect(isAllowedCheckoutOrigin('https://deploy-preview-3.netlify.app')).toBe(true)
    expect(isAllowedCheckoutOrigin('https://evil.example')).toBe(false)
    expect(isAllowedCheckoutOrigin('http://tracker.veteranscentralhub.us')).toBe(false)
  })

  it('ignores a spoofed Origin and uses the allowed request host', () => {
    expect(resolveRequestBaseUrl({
      configuredOrigin: 'https://tracker.veteranscentralhub.us',
      isProduction: true,
      originHeader: 'https://evil.example',
      requestHost: 'tracker.veteranscentralhub.us',
      requestProtocol: 'https'
    })).toBe('https://tracker.veteranscentralhub.us')
  })

  it('keeps local checkout on the opened localhost origin', () => {
    expect(resolveRequestBaseUrl({
      configuredOrigin: 'https://tracker.veteranscentralhub.com',
      originHeader: 'http://localhost:3001',
      requestHost: 'localhost:3001',
      requestProtocol: 'http'
    })).toBe('http://localhost:3001')
  })
})

describe('webhook helpers', () => {
  it('reads subscription ids from basil invoice.parent and legacy invoice.subscription', () => {
    expect(getInvoiceSubscriptionId({
      parent: { subscription_details: { subscription: 'sub_parent' } }
    })).toBe('sub_parent')
    expect(getInvoiceSubscriptionId({
      subscription: { id: 'sub_legacy' }
    })).toBe('sub_legacy')
    expect(stripeObjectId('sub_plain')).toBe('sub_plain')
  })

  it('reads current_period_end from subscription items first', () => {
    expect(getSubscriptionCurrentPeriodEnd({
      current_period_end: 10,
      items: { data: [{ current_period_end: 99 }] }
    })).toBe(99)
    expect(getSubscriptionCurrentPeriodEnd({
      current_period_end: 10
    })).toBe(10)
  })

  it('lists the events the webhook route handles', () => {
    expect(TRACKER_STRIPE_WEBHOOK_EVENTS).toContain('checkout.session.completed')
    expect(TRACKER_STRIPE_WEBHOOK_EVENTS).toContain('invoice.paid')
    expect(isTrackerStripeWebhookEvent('customer.subscription.deleted')).toBe(true)
    expect(isTrackerStripeWebhookEvent('charge.succeeded')).toBe(false)

    const webhook = readFileSync('server/api/stripe/webhook.post.ts', 'utf8')
    expect(webhook).toContain('constructEvent')
    expect(webhook).toContain('stripeWebhookSecret')
  })
})
