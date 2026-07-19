/**
 * useTier — SWR-cached hook for the current user's subscription tier.
 *
 * Replaces the ad-hoc ``useEffect + api.user.getTier`` pattern that was
 * duplicated across TierPanel / signals detail / scanner / settings.
 * One source of truth, one network call, deduped + revalidated by SWR.
 *
 * Usage:
 *
 *   const { tier, isAdmin, features, isLoading } = useTier()
 *   if (tier === 'free' && !features.signal_unlimited) {
 *     // render upgrade CTA
 *   }
 */

import useSWR from 'swr'
import { api } from '@/lib/api'

export type SubscriptionTier = 'free' | 'pro' | 'elite'

export interface TierResponse {
  user_id: string
  tier: SubscriptionTier
  is_admin: boolean
  features: Record<string, boolean>
  copilot_daily_cap: number
}

const SWR_KEY = '/api/user/tier'

export function useTier() {
  const { data, error, isLoading, mutate } = useSWR<TierResponse>(
    SWR_KEY,
    () => api.user.getTier(),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000, // 1 min — tier rarely changes
    },
  )

  const tier = data?.tier ?? 'free'
  return {
    tier,
    isAdmin: data?.is_admin ?? false,
    features: data?.features ?? {},
    copilotDailyCap: data?.copilot_daily_cap ?? 5,
    raw: data,
    error,
    isLoading,
    refresh: mutate,

    // Convenience predicates. Admins always pass.
    isFree: !data?.is_admin && tier === 'free',
    isPro: !data?.is_admin && tier === 'pro',
    isElite: !data?.is_admin && tier === 'elite',
    isPaid: !!data?.is_admin || tier === 'pro' || tier === 'elite',
  }
}
