/**
 * Tier upsell helpers — shared across /pricing and /settings (TierPanel).
 *
 * Both surfaces show the same quiz-recommendation banner with the same
 * "what changes for you" delta bullets. Before this module, each had its
 * own copies that drifted independently:
 *   - pricing.tsx had AllocIQ engine name in pro→elite feature_led
 *   - TierPanel.tsx omitted it
 *   - pricing.tsx said "you always know" / "traders who said they want"
 *   - TierPanel.tsx had cleaner versions of both phrases
 *
 * Single source of truth here. The A/B variant slug
 * (``quiz_rec_delta_copy``) is shared too so /pricing and /settings
 * funnel decomposition stays comparable.
 */

export type Tier = 'free' | 'pro' | 'elite'
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'
export type DeltaVariant = 'feature_led' | 'outcome_led'

/** Numeric ordering — Free < Pro < Elite. Used to gate "is this an upsell". */
export function tierRank(t: Tier): number {
  return t === 'elite' ? 2 : t === 'pro' ? 1 : 0
}

/** Brand accent color per tier. Free is neutral grey, Pro is primary,
 *  Elite is the warning/gold token. */
export function tierAccent(t: Tier): string {
  if (t === 'elite') return 'var(--color-warning)'
  if (t === 'pro') return 'var(--color-primary)'
  return 'var(--color-muted)'
}

/** Headline + pitch shown above the delta bullets. */
export function quizRecCopy(recommended: Tier): { name: string; pitch: string } | null {
  if (recommended === 'elite') {
    return {
      name: 'Elite',
      pitch: 'AutoPilot live auto-trader, F&O strategies, Counterpoint debate.',
    }
  }
  if (recommended === 'pro') {
    return {
      name: 'Pro',
      pitch: 'Unlimited swing + intraday signals, Scanner Lab, 50 Copilot messages/day.',
    }
  }
  return null
}

/** Risk-profile-aware reasoning sentence. Falls back to null when the
 *  quiz didn't capture a profile so callers can substitute the generic
 *  pitch. */
export function quizRecReason(recommended: Tier, risk: RiskProfile | null): string | null {
  if (recommended === 'free' || !risk) return null
  if (recommended === 'pro') {
    if (risk === 'conservative') return 'Defensive profile — Pro adds Portfolio Doctor and the Weekly Review so you know what your holdings are doing without taking on more trades.'
    if (risk === 'moderate')     return 'Balanced profile — unlimited swing signals + Scanner Lab give you enough setups per week without overwhelming the watchlist.'
    return 'Active profile — you said you trade weekly+; Pro removes the 1/day signal cap and unlocks intraday + WhatsApp digest.'
  }
  if (risk === 'conservative') return "Defensive profile — Elite's Counterpoint debate + unlimited Portfolio Doctor suit hands-off long-term capital better than active trading."
  if (risk === 'moderate')     return "Balanced profile — Elite's unlimited Portfolio Doctor + F&O strategies compound into a managed-portfolio outcome with light oversight."
  return 'Active profile — AutoPilot, F&O strategies, and Counterpoint were built for traders who want full automation with override control.'
}

/** "What changes for you" expandable bullets per upgrade path.
 *
 *  Three bullets per (current → recommended) pair so the user sees the
 *  concrete delta vs vague "Pro recommended". Path-specific so we never
 *  list a feature they already have on their current tier.
 *
 *  A/B split: ``feature_led`` (control) lists concrete capabilities;
 *  ``outcome_led`` reframes to user outcomes. Both arms hit the same
 *  ``quiz_rec_what_changes`` telemetry slug so we can decompose
 *  per-variant conversion in the funnel report.
 */
export const QUIZ_REC_DELTA: Record<DeltaVariant, Record<string, string[]>> = {
  feature_led: {
    'free->pro': [
      'Unlimited swing + intraday signals (vs 1/day on Free)',
      'Scanner Lab unlocked — 50+ live screeners + Pattern Scanner',
      'Copilot 50 messages/day + WhatsApp digest + Portfolio Doctor',
    ],
    'free->elite': [
      'AutoPilot — live auto-trader with Kelly sizing + VIX overlay',
      'F&O strategies (Iron Condor, Straddle, etc.)',
      'Counterpoint debate on every high-stakes signal + unlimited Copilot',
    ],
    'pro->elite': [
      'AutoPilot live execution — your signals act on themselves',
      'F&O strategy generator',
      'Counterpoint Bull/Bear debate + Copilot 200/day (vs 50/day)',
    ],
  },
  outcome_led: {
    'free->pro': [
      'Stop missing setups — every qualifying breakout reaches you, not just one a day',
      'Find ideas faster — 50+ live scanners surface the next move in seconds',
      'Talk through every trade — Copilot 50/day + a Sunday review of what worked',
    ],
    'free->elite': [
      'Trade while you sleep — AutoPilot sizes positions and executes for you',
      'Pressure-test high-stakes calls — Bull vs Bear debate before you commit',
    ],
    'pro->elite': [
      'Cross the manual→automated line — AutoPilot acts on signals you already trust',
      'Get a second opinion on every big bet — Counterpoint debate per signal',
    ],
  },
}

/** Resolve the bullet list for a specific (current → recommended, variant) tuple.
 *  Returns null when the recommended tier isn't an actual upsell or the
 *  pair isn't covered. */
export function quizRecDelta(
  current: Tier,
  recommended: Tier,
  variant: DeltaVariant,
): string[] | null {
  if (recommended === 'free') return null
  const key = `${current}->${recommended}`
  return QUIZ_REC_DELTA[variant][key] ?? null
}
