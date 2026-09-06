import { createClient } from '@supabase/supabase-js'
import { SITE_NOTICE_TRACKER_SITE, type SiteNoticeRow } from '../../shared/siteNotice'
import { getSupabasePublicConfig } from '../utils/supabasePublicConfig'
import { getSupabaseNodeOptions } from '../utils/supabaseNodeOptions'

const SITE_NOTICE_COLUMNS = [
  'id',
  'title',
  'message',
  'link_url',
  'link_label',
  'sites',
  'active',
  'starts_at',
  'ends_at',
  'dismissible',
  'priority',
  'created_at',
  'updated_at'
].join(', ')

export default defineEventHandler(async () => {
  const resolved = getSupabasePublicConfig()

  if (!resolved.supabaseUrl || !resolved.supabaseKey) {
    return { notices: [] as SiteNoticeRow[] }
  }

  try {
    const supabase = createClient(resolved.supabaseUrl, resolved.supabaseKey, {
      ...getSupabaseNodeOptions(),
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      }
    })

    const { data, error } = await supabase
      .from('site_notices')
      .select(SITE_NOTICE_COLUMNS)
      .eq('active', true)
      .contains('sites', [SITE_NOTICE_TRACKER_SITE])
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[site-notices]', error.message)
      return { notices: [] as SiteNoticeRow[] }
    }

    return { notices: (data ?? []) as SiteNoticeRow[] }
  } catch (error) {
    console.error('[site-notices]', error instanceof Error ? error.message : error)
    return { notices: [] as SiteNoticeRow[] }
  }
})
