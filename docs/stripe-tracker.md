# Symptom Tracker Stripe lockdown

Tracker **does charge money**: **Symptom Tracker Pro at $6.99/month** via Stripe Checkout (embedded in `/upgrade`, hosted Checkout as fallback). This is **not** a Hub donation flow.

| Account | ID | Use |
|---|---|---|
| **VCH - Tracker sandbox** | `acct_1TpCwZQVbQe31Q8Y` | Local / test (`sk_test_`, `pk_test_`) |
| Tracker live catalog | Prices on the live Tracker account (not Hub) | Production (`sk_live_`, `pk_live_`) |
| **VCH - Main** (Hub) | `acct_1TLVXFHkt60zCzOY` | Donations + ClaimBuilder — **do not use here** |

Hub donate and ClaimBuilder stay on their own repos and Stripe accounts.

## What the app does

- Monthly **subscription** Checkout Sessions (`mode: 'subscription'`). No SetupIntent-only monthly path.
- Dynamic payment methods: code **never** sends `payment_method_types`. Enable methods in the Stripe Dashboard.
- Return URLs follow the **request origin** when it is an allowed host:
  - Production: `https://tracker.veteranscentralhub.us` and `https://tracker.veteranscentralhub.com`
  - Local: `http://localhost:*` / `http://127.0.0.1:*`
  - Preview: `*.onrender.com`, `*.netlify.app`
- Success: `{origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel: `{origin}/upgrade?canceled=1`
- Session + subscription metadata: `user_id`, `product_key=symptom_tracker_pro`, `payment_type=subscription`, `source=tracker`, `app=symptom_tracker`
- Email: signed-in email is passed as `customer_email` (or an existing `stripe_customer_id` is reused) so Stripe can send receipts/invoices.
- Webhook: `POST /api/stripe/webhook` verifies `STRIPE_WEBHOOK_SECRET` (`stripe-signature`) and unlocks `tracker.user_entitlements`.

## Dashboard: create the webhook (required)

The Tracker sandbox currently has **zero** webhook endpoints. Production will not stay in sync (renewals, failures, cancels) until this exists on **both** test and live Tracker accounts.

1. Open the **Tracker** Stripe account (not VCH - Main).
2. Developers → [Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**.
3. Endpoint URL:

```text
https://tracker.veteranscentralhub.us/api/stripe/webhook
```

Same Render service also serves `.com`. One production URL is enough; Stripe will POST to that host.

4. Select these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

5. Copy the signing secret (`whsec_...`) into Render as `STRIPE_WEBHOOK_SECRET`.
6. For local work: `stripe listen --forward-to localhost:3001/api/stripe/webhook` and put that CLI `whsec_` in `.env`.

## Render env vars (Tracker web service)

Set on **vch-tracker** (and keep secrets out of git). Prefer a [restricted API key](https://docs.stripe.com/keys/restricted-api-keys.md) (`rk_live_` / `rk_test_`) over a full `sk_` secret, with Checkout, Customers, Billing Portal, Subscriptions, Prices (read), and Webhooks as needed.

| Variable | Production | Local |
|---|---|---|
| `STRIPE_SECRET_KEY` | `rk_live_...` or `sk_live_...` (Tracker live) | `rk_test_...` / `sk_test_...` (sandbox `acct_1TpCwZQVbQe31Q8Y`) |
| `STRIPE_PUBLIC_KEY` | `pk_live_...` | `pk_test_...` |
| `STRIPE_PRO_PRICE_ID` | `price_1Tz1kBHw2LhhEbB93qqKjuz4` ($6.99/month) | `price_1Tz1XyQVbQe31Q8YakrCXJsP` |
| `STRIPE_WEBHOOK_SECRET` | Production endpoint `whsec_...` | `stripe listen` `whsec_...` |
| `APP_URL` | `https://tracker.veteranscentralhub.us` (`.com` also works; checkout uses the opened host) | `http://localhost:3001` |
| `SUPABASE_SERVICE_KEY` | VCH service role (unlocks Pro in `tracker.user_entitlements`) | same project |

`render.yaml` already declares the Stripe keys as `sync: false` — values must be pasted in the Render Dashboard.

After deploy:

```bash
curl -s https://tracker.veteranscentralhub.us/api/health
```

Production JSON should have `"ok": true`. Local: `http://localhost:3001/api/stripe/config-check` (blocked in production).

## Stripe Dashboard extras

- **Payment methods:** Settings → Payment methods. Do not hardcode types in code.
- **Customer Portal:** Settings → Billing → Customer portal (needed for **Manage billing** on `/upgrade`).
- **API version:** the Node SDK (`stripe@22`) uses **`2026-08-26.dahlia`**. Do not pin `2023-10-16`. Account default in Workbench can stay current; webhooks should use the endpoint’s API version Stripe assigns.
- **Tax:** if you will charge US/EU customers, enable [Stripe Tax](https://docs.stripe.com/billing/taxes/collect-taxes.md) **and** an active registration. Do not turn on `automatic_tax` in code until a registration is live — Stripe will otherwise collect $0 tax with no error.

## Local check

```bash
# .env: test keys + TEST price id + stripe listen whsec
npm run dev
# http://localhost:3001/upgrade  → Sign in → Upgrade to Pro
```

Pro still unlocks on the success page via `POST /api/stripe/confirm-subscription` if the webhook is down, as long as `SUPABASE_SERVICE_KEY` is set.
