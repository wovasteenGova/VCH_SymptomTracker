/**
 * Render Cron Job entrypoint — hourly log-reminder dispatch.
 * Calls the existing Nitro route; same behavior as netlify/functions/reminder-cron.mjs.
 */
const siteUrl = String(
  process.env.APP_URL
  || process.env.RENDER_EXTERNAL_URL
  || 'https://tracker.veteranscentralhub.us'
).replace(/\/$/, '')

const secret = String(process.env.REMINDER_CRON_SECRET || '').trim()

if (!secret) {
  console.error('[reminder-cron] REMINDER_CRON_SECRET is not set')
  process.exit(1)
}

try {
  const response = await fetch(`${siteUrl}/api/reminders/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json'
    }
  })

  const body = await response.text()
  console.info('[reminder-cron]', response.status, body)

  if (!response.ok) {
    process.exit(1)
  }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Reminder cron failed.'
  console.error('[reminder-cron]', message)
  process.exit(1)
}
