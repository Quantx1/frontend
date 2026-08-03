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

/** Keys of `core.tiers.LLM_FEATURE_CAPS`. Each maps to a per-day allowance. */
export type LlmFeature =
  | 'chat'
  | 'strategy_gen'
  | 'scanner_thesis'
  | 'chart_vision'
  | 'debate'
  | 'fno_advisor'
  | 'watchlist_digest'
  | 'news_intel'

export interface TierResponse {
  user_id: string
  tier: SubscriptionTier
  is_admin: boolean
  /** Tier REACHABILITY. Answers "may this tier touch it", never "how often". */
  features: Record<string, boolean>
  copilot_daily_cap: number
  /** Today's chat usage. Null when the metering read failed — never zero, so
   *  an outage cannot be mistaken for a fresh quota. */
  copilot_used: number | null
  copilot_remaining: number | null
  copilot_resets_at: string | null
  /**
   * Per-feature DAILY CAP for this tier.
   *
   * `features` and this are different questions, and conflating them is what
   * put a 402 behind a tappable control. Three LLM features —
   * `scanner_thesis`, `chart_vision`, `fno_advisor` — have no entry in the
   * backend's FEATURE_MATRIX at all, so `features` does not mention them,
   * while their cap is **0/day for Free**. The UI therefore rendered them as
   * available and the first tap returned a quota error.
   *
   * A wall reached by tapping something the interface said you could do
   * teaches the user the product is broken. A lock teaches them it is paid.
   * Use `capFor()` to tell them apart before rendering the control.
   */
  llm_caps: Partial<Record<LlmFeature, number>>
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
  const isAdmin = data?.is_admin ?? false
  const caps = data?.llm_caps ?? {}

  /**
   * This tier's daily allowance for an LLM feature.
   *
   * `undefined` while the tier call is in flight — deliberately NOT 0, so a
   * loading state cannot flash a lock. Admins are never capped.
   */
  const capFor = (feature: LlmFeature): number | undefined => {
    if (isAdmin) return Infinity
    if (!data) return undefined
    return caps[feature] ?? 0
  }

  /**
   * True only when we KNOW the allowance is zero.
   *
   * Render a lock and an upgrade path on this, never a working control. The
   * alternative — letting the tap through and handling the 402 — is what the
   * redesign flagged as the single riskiest thing in the plan.
   */
  const isLockedFeature = (feature: LlmFeature): boolean => capFor(feature) === 0

  return {
    tier,
    isAdmin,
    features: data?.features ?? {},
    copilotDailyCap: data?.copilot_daily_cap ?? 5,
    copilotUsed: data?.copilot_used ?? null,
    copilotRemaining: data?.copilot_remaining ?? null,
    copilotResetsAt: data?.copilot_resets_at ?? null,
    llmCaps: caps,
    capFor,
    isLockedFeature,
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
