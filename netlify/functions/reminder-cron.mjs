export default async () => {
  const siteUrl = String(
    process.env.APP_URL
      || process.env.URL
      || process.env.DEPLOY_PRIME_URL
      || 'https://tracker.veteranscentralhub.com'
  ).replace(/\/$/, '')

  const secret = String(process.env.REMINDER_CRON_SECRET || '').trim()

  if (!secret) {
    console.error('[reminder-cron] REMINDER_CRON_SECRET is not set')

    return new Response(JSON.stringify({
      ok: false,
      error: 'REMINDER_CRON_SECRET is not configured.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
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

    return new Response(body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reminder cron failed.'

    console.error('[reminder-cron]', message)

    return new Response(JSON.stringify({
      ok: false,
      error: message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
