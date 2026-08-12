# Symptom Tracker — Render reminder cron

Netlify used a scheduled function (`netlify/functions/reminder-cron.mjs`, `0 * * * *`). Render does **not** run Netlify schedules. Use a **Render Cron Job** instead.

## What already works on Render

- Web push subscriptions + service worker
- `GET /api/reminders/vapid-public-key`
- `POST /api/reminders/send` (protected by `REMINDER_CRON_SECRET`)

## One-time dashboard setup

1. **VCH_Tracker web service** — confirm env vars:
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
   - `REMINDER_CRON_SECRET` (same value on web + cron)
   - `SUPABASE_SERVICE_KEY`, `APP_URL=https://tracker.veteranscentralhub.us`

2. **Create cron** (Dashboard → New → Cron Job) **or** apply `render.yaml`:
   - Name: `vch-tracker-reminder-cron`
   - Schedule: `0 * * * *` (hourly)
   - Runtime: Node 22
   - Build: `npm install`
   - Start: `node scripts/reminder-cron.mjs`
   - Env: `APP_URL`, `REMINDER_CRON_SECRET` (mark secret **sync: false** in blueprint)

3. **Cost:** Render cron services bill at least ~$1/month per job.

## Verify

```bash
curl -s -X POST "https://tracker.veteranscentralhub.us/api/reminders/send" \
  -H "Authorization: Bearer YOUR_REMINDER_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expect JSON with `"ok": true`.

## Local secrets (gitignored)

Copy `.local/render-cron.env.example` → `.local/render-cron.env` for manual curl tests. Never commit `.local/`.
