/**
 * Signal books — the two live, gate-passing books each get their own page:
 * Alpha Picks (internal: swing, 10-bar) and Momentum Picks (internal:
 * momentum, 20-bar). Positional + intraday were removed 2026-07-21
 * (positional model failed its quality gate; intraday needs a live feed).
 *
 * Holds the per-category copy ("what is X" + "how our AI finds them"), the
 * public engine names involved (brand-firewall: only Alpha/Mood/Regime/
 * Counterpoint/AutoPilot ever ship), and the data helpers shared by the
 * category pages + the /signals hub (normalize, categoryOf, computeStats).
 */

import type { ComponentType } from 'react'
import { Flame, TrendingUp } from '@/lib/icons'

import type { Signal as ApiSignal } from '@/lib/api'
import type { DisplaySignal } from './SignalCard'

export type CategoryId = 'swing' | 'momentum'

export interface SignalCategory {
  id: CategoryId
  /** Public route slug, e.g. /signals/alpha-picks. */
  slug: string
  label: string
  title: string
  hold: string
  tagline: string
  icon: ComponentType<any>
  /** Per-category premium 3D hero render (Higgsfield illustration). */
  /** Plain-English "what is this trading style". */
  whatIs: string
  /** How the AI finds these — each a short sentence, public engine names only. */
  howAI: string[]
  /** Public engines surfaced as chips. */
  engines: string[]
  /** Median holding period in calendar days — used to annualise realized return. */
  holdDays: number
  /** Honest Q&A about the engine, rendered as an accordion at the page bottom. */
  faq: { q: string; a: string }[]
}

/** Shared honest answers reused across horizons (no fabricated guarantees). */
const FAQ_COMMON: { q: string; a: string }[] = [
  {
    q: 'Are these guaranteed to be profitable?',
    a: 'No. These are AI-generated research signals, not advice and not guarantees. Every signal can lose. We gate publishing on out-of-sample performance and show a win rate only once a category has enough decided trades. No small-sample numbers, no fabricated ones, ever.',
  },
  {
    q: 'Where does the data come from?',
    a: 'NSE end-of-day plus live broker feeds. Every signal ships with a pre-computed entry, stop and target, so the risk is on the table before you act.',
  },
  {
    q: 'Do I need a broker connected?',
    a: 'No. Both books run on settled EOD data, so every signal works without a broker. Connect one only when you want to trade a pick live — nothing here places trades for you. You stay in control.',
  },
]

export const CATEGORIES: Record<CategoryId, SignalCategory> = {
  swing: {
    id: 'swing',
    slug: 'alpha-picks',
    label: 'Alpha Picks',
    title: 'Alpha Picks',
    hold: '3-10 sessions',
    tagline: 'ML signal stack catches one clean leg of the trend.',
    icon: TrendingUp,
    whatIs:
      "Multiple engines agree before a swing publishes: hold for roughly 3 to 10 sessions and take one leg of a bigger trend. You sit through the intraday noise and let the move work, with AI-managed targets and stops keeping you honest. The sweet spot if you can't stare at screens all day but want more than buy-and-hold.",
    howAI: [
      'Alpha ranks the entire NSE cross-section on multi-factor strength: momentum, quality, mean-reversion and more.',
      "Mood reads the news and sentiment tape on each name, so a headline never blindsides a signal.",
      'Regime sizes the book to the market state. Heavier in clean uptrends, lighter when it turns.',
      'The ensemble forecasts a forward price path and publishes only when the risk-adjusted edge clears a backtested gate.',
    ],
    engines: ['Alpha', 'Mood', 'Regime'],
    holdDays: 7,
    faq: [
      {
        q: 'How long is an Alpha Pick held?',
        a: 'Roughly 3 to 10 sessions. Long enough to catch one leg of a trend, short enough that you are not married to a multi-week thesis.',
      },
      {
        q: 'What makes an Alpha Pick publish?',
        a: 'Alpha ranks the cross-section, Mood checks the news tape, Regime sizes to the market state. The ensemble publishes only when the risk-adjusted edge clears a backtested gate.',
      },
      ...FAQ_COMMON,
    ],
  },
  momentum: {
    id: 'momentum',
    slug: 'momentum-picks',
    label: 'Momentum Picks',
    title: 'Momentum Picks',
    hold: 'Weekly rebalance · long-only',
    tagline: 'The whole NSE board, ML-ranked by forward return.',
    icon: Flame,
    whatIs:
      'Ride the stocks already moving with strength. The Alpha engine ranks the entire NSE cross-section by expected forward return, reading trend persistence, price acceleration and volatility-adjusted strength, then surfaces the top of the book. Long-only, weekly rebalance: hold the highest-ranked names while the edge lasts, rotate out as momentum fades.',
    howAI: [
      'Alpha scores every name on the NSE main board by expected forward return. The top of the book becomes signals with entry, stop and target pre-computed.',
      'Only the top decile, the top ~10%, advances. A quality filter that keeps the set tight and actionable.',
      'Regime gates sizing: full allocation in confirmed uptrends, dialled back in bear or sideways regimes.',
      'Every signal carries a rank (1 = strongest) and a percentile score, so you can prioritise within the set.',
    ],
    engines: ['Alpha', 'Regime'],
    holdDays: 7,
    faq: [
      {
        q: 'What does the rank and percentile mean?',
        a: 'Every signal carries a rank (1 = strongest) and a percentile score from Alpha across the whole NSE main board. Only the top decile advances, so you prioritise within an already-tight set.',
      },
      {
        q: 'How often does the book rotate?',
        a: 'Momentum is long-only with a weekly rebalance. Hold the highest-ranked names while the edge lasts, rotate out as momentum fades.',
      },
      ...FAQ_COMMON,
    ],
  },
}

export const CATEGORY_LIST: SignalCategory[] = [
  CATEGORIES.swing,
  CATEGORIES.momentum,
]

// ── data helpers ──────────────────────────────────────────────────────────────────────────

export const normalize = (s: ApiSignal): DisplaySignal => ({
  id: s.id,
  symbol: s.symbol,
  exchange: (s as { exchange?: string }).exchange,
  direction: s.direction ?? 'LONG',
  entry_price: s.entry_price,
  target_price: s.target ?? s.target_1 ?? 0,
  stop_loss: s.stop_loss,
  confidence: s.confidence,
  risk_reward: s.risk_reward_ratio ?? s.risk_reward ?? 0,
  generated_at: s.created_at ?? s.generated_at ?? s.date ?? new Date().toISOString(),
  status: s.status,
  signal_type: (s as { signal_type?: string }).signal_type,
  valid_until: (s as { valid_until?: string }).valid_until,
  pnl_pct: numOrUndef((s as { final_pnl_pct?: number; pnl_percent?: number }).final_pnl_pct ?? (s as { pnl_percent?: number }).pnl_percent),
})

function numOrUndef(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : (v as number)
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

/**
 * Map a signal from getToday() to one of the 3 horizon categories.
 * The momentum category uses its own dedicated endpoint (getMomentum) and
 * does NOT go through this helper — this function maps intraday/swing/positional
 * only. Signals with signal_type "momentum" still fold into swing here so that
 * any legacy momentum signals from getToday() continue to appear on the swing page.
 */
export const categoryOf = (s: DisplaySignal): CategoryId => {
  const t = (s.signal_type || '').toLowerCase()
  return t.includes('momentum') ? 'momentum' : 'swing'
}

const CLOSED_STATUSES = new Set(['target_hit', 'stop_loss_hit', 'sl_hit', 'expired', 'closed', 'cancelled'])
const WIN_STATUSES = new Set(['target_hit'])
const LOSS_STATUSES = new Set(['stop_loss_hit', 'sl_hit'])

export const isClosed = (s: DisplaySignal): boolean => CLOSED_STATUSES.has(s.status)
export const isOpen = (s: DisplaySignal): boolean => !CLOSED_STATUSES.has(s.status)

export interface CategoryStats {
  /** % of decided (win/loss) closed signals that hit target. null until >= MIN_SAMPLE. */
  winRate: number | null
  /** Annualised from the realized closed-signal track. null until >= MIN_SAMPLE. */
  annualReturn: number | null
  /** Open signals published today (live count). */
  signalsToday: number
  /** Decided-trade sample size behind winRate (for the "building track record" note). */
  sample: number
}

/** Below this many decided trades we show "—" rather than a small-sample number
 *  (we don't ship fabricated win rates — see the retired "63.6% WR" lesson). */
export const MIN_SAMPLE = 8

export function computeStats(open: DisplaySignal[], closed: DisplaySignal[], cat: SignalCategory): CategoryStats {
  const decided = closed.filter((s) => WIN_STATUSES.has(s.status) || LOSS_STATUSES.has(s.status))
  const wins = decided.filter((s) => WIN_STATUSES.has(s.status)).length
  const winRate = decided.length >= MIN_SAMPLE ? (wins / decided.length) * 100 : null

  // Annualise the realized track: compound each closed trade's pnl%, then scale
  // to a year by the category's holding period. Standard annualisation of a real
  // realized track — gated by sample size so one lucky trade can't inflate it.
  const rets = closed.map((s) => s.pnl_pct).filter((n): n is number => typeof n === 'number')
  let annualReturn: number | null = null
  if (rets.length >= MIN_SAMPLE) {
    const compounded = rets.reduce((acc, r) => acc * (1 + r / 100), 1) // growth factor over the sample
    const tradesPerYear = 252 / Math.max(1, cat.holdDays)
    const periodsPerYear = tradesPerYear / rets.length // how many such samples fit in a year
    annualReturn = (Math.pow(compounded, periodsPerYear) - 1) * 100
  }

  return { winRate, annualReturn, signalsToday: open.length, sample: decided.length }
}
