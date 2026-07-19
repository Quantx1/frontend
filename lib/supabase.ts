import { createClient } from '@supabase/supabase-js'
import type { UserProfile } from '../types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
}

// During SSG/`next build` (and any env-less context) the NEXT_PUBLIC_* vars can
// be absent. @supabase/supabase-js throws "supabaseUrl is required" on an empty
// string, which crashes prerendering — so fall back to a syntactically valid
// placeholder. `isSupabaseConfigured` is false in that case and gates every real
// query/auth call below, so the placeholder client is never actually used. With
// real env injected at runtime, behavior is identical to before.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as UserProfile | null) || null
}

export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured')
  }

  const profileDefaults = {
    id: userId,
    email,
    capital: 100000,
    risk_profile: 'moderate',
    trading_mode: 'signal_only',
    max_positions: 5,
    risk_per_trade: 2,
    fo_enabled: false,
    subscription_status: 'trial',
    broker_connected: false,
    total_trades: 0,
    winning_trades: 0,
    total_pnl: 0,
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profileDefaults, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as UserProfile
}

export const auth = {
  async resetPassword(email: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured')
    }

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      throw error
    }

    return true
  },
}
