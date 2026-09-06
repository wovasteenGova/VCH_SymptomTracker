import webpush from 'web-push'
import { getVapidPrivateKey, getVapidPublicKey } from './pushReminderAuth'

const VAPID_SUBJECT = 'mailto:hello@veteranscentralhub.com'

export type PushSubscriptionRecord = {
  id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

export function assertWebPushConfigured() {
  const publicKey = getVapidPublicKey()
  const privateKey = getVapidPrivateKey()

  if (!publicKey || !privateKey) {
    throw createError({
      statusCode: 503,
      message: 'VAPID keys are not configured yet.'
    })
  }

  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey)

  return { publicKey, privateKey }
}

export async function sendWebPushNotification(
  subscription: PushSubscriptionRecord,
  payload: PushPayload
) {
  assertWebPushConfigured()

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_key
      }
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/'
    }),
    {
      // High urgency helps Android/FCM wake the device instead of waiting for
      // the next Doze maintenance window — important for timed log reminders.
      TTL: 60 * 60,
      urgency: 'high'
    }
  )
}

export function isExpiredPushSubscriptionError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const statusCode = 'statusCode' in error ? Number(error.statusCode) : NaN

  return statusCode === 404 || statusCode === 410
}
