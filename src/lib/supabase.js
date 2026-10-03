import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonymousKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabase = url && anonymousKey
  ? createClient(url, anonymousKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  })
  : null