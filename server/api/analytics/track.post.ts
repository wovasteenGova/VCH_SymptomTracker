import { createClient } from '@supabase/supabase-js'
import { getHeader, getRequestIP } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import {
  buildProductPageViewRow,
  detectKnownAnalyticsBot,
  isAnalyticsExcludedUser,
  isValidInet
} from '../../shared/productSiteAnalytics'
import { getSupabaseNodeOptions } from '../utils/supabaseNodeOptions'
import { resolveSupabaseEnv } from '../utils/supabaseEnv'
import { describeServiceRoleKey } from '../utils/supabaseKeyInspect'

let skippedBotCount = 0

function noteSkippedBot(reason: string | null, userAgent: string) {
  skippedBotCount += 1
  if (skippedBotCount <= 10 || skippedBotCount % 25 === 0) {
    console.info(`[analytics] skipped bot #${skippedBotCount} reason=${reason || 'unknown'} ua=${userAgent.slice(0, 120)}`)
  }
}

function getPublicServiceClient() {
  const env = resolveSupabaseEnv()
  const config = useRuntimeConfig()
  const supabaseUrl = String(config.public.supabaseUrl || env.url || '').trim()
  const serviceRoleKey = String(
    env.serviceKey || config.supabaseServiceRoleKey || config.supabaseServiceKey || ''
  ).trim()
  const anonKey = String(
    env.anonKey
    || config.public.supabaseAnonKey
    || config.public.supabasePublishableKey
    || config.public.supabaseKey
    || ''
  ).trim()
  const check = describeServiceRoleKey(serviceRoleKey, anonKey)
  if (!supabaseUrl || !check.ok) {
    throw new Error('Supabase service role is not configured for analytics.')
  }
  // public.analytics lives on the Hub schema, not tracker.*
  return createClient(supabaseUrl, serviceRoleKey, {
    ...getSupabaseNodeOptions(),
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

/** Record Symptom Tracker page views into the shared public.analytics table. */
export default defineEventHandler(async (event) => {
  try {
    const userAgent = String(getHeader(event, 'user-agent') || '').slice(0, 500)
    const bot = detectKnownAnalyticsBot({
      userAgent,
      from: getHeader(event, 'from'),
      purpose: getHeader(event, 'purpose') || getHeader(event, 'x-purpose')
    })
    if (bot.isBot) {
      noteSkippedBot(bot.reason, userAgent)
      return { success: true, skipped: 'bot' }
    }

    const body = await readBody(event).catch(() => ({})) as Record<string, unknown>
    const sessionUser = await serverSupabaseUser(event).catch(() => null)
    const config = useRuntimeConfig(event)
    if (isAnalyticsExcludedUser(sessionUser, config.public?.analyticsExcludeEmails)) {
      return { success: true, skipped: 'excluded_debugger' }
    }

    const path = String(body?.path || '').split('?')[0].trim() || '/'
    const row = buildProductPageViewRow({
      path,
      title: body?.title,
      product: 'symptom_tracker',
      viewerId: (sessionUser as { id?: string } | null)?.id,
      metadata: body?.metadata && typeof body.metadata === 'object'
        ? body.metadata as Record<string, unknown>
        : null
    })
    if (!row) return { success: false }

    const clientIP = getRequestIP(event, { xForwardedFor: true }) || ''
    const referrer = String(
      body?.referrer || getHeader(event, 'referer') || getHeader(event, 'referrer') || ''
    ).slice(0, 500) || null

    const client = getPublicServiceClient()
    const { error } = await client.from('analytics').insert({
      ...row,
      visitor_ip: isValidInet(clientIP) ? clientIP : null,
      visitor_user_agent: userAgent || null,
      referrer
    })

    if (error) {
      console.warn('[analytics] Symptom Tracker track insert failed:', error.message)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.warn('[analytics] Symptom Tracker track failed:', error)
    return { success: false }
  }
})
