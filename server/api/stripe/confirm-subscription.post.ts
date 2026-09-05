import { readBody } from 'h3'
import { requireAuthUser } from '../../utils/authUser'
import { getStripeClient } from '../../utils/stripeClient'
import { handleCheckoutCompleted } from '../../utils/stripeEntitlements'
import { stripeObjectId } from '../../utils/stripeWebhook'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuthUser(event)
  const body = await readBody<{ sessionId?: string }>(event)
  const sessionId = String(body?.sessionId || '').trim()

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      message: 'Checkout session ID is required.'
    })
  }

  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription']
  })

  const sessionUserId = session.metadata?.user_id || session.client_reference_id

  if (sessionUserId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'This checkout session does not belong to your account.'
    })
  }

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    throw createError({
      statusCode: 400,
      message: 'Payment is still processing. Try again in a few seconds.'
    })
  }

  try {
    const activated = await handleCheckoutCompleted(session)

    if (!activated) {
      throw createError({
        statusCode: 500,
        message: 'Payment succeeded but Pro could not be activated. Contact support with your receipt.'
      })
    }

    return {
      activated,
      paymentStatus: session.payment_status,
      status: session.status,
      mode: session.mode,
      subscriptionId: stripeObjectId(session.subscription)
    }
  } catch (error) {
    console.error('[stripe confirm] activation failed', {
      sessionId: `${session.id.slice(0, 20)}...`,
      userId: user.id,
      sessionUserId,
      paymentStatus: session.payment_status,
      status: session.status,
      mode: session.mode,
      subscriptionId: stripeObjectId(session.subscription),
      message: error instanceof Error ? error.message : String(error)
    })
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error instanceof Error
        ? error.message
        : 'Payment succeeded but Pro could not be activated.'
    })
  }
})
