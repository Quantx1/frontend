/**
 * Public model naming registry — the moat layer.
 *
 * Mirrors `backend/core/public_models.py`. Every user-facing
 * surface MUST import names from here rather than hard-coding them.
 * Internal model names (TFT / Qlib / FinBERT / etc.) never reach
 * the browser.
 *
 * Naming convention:
 *   *Lens / *Cast / *Scope → forecast / view engines
 *   *IQ                    → intelligence / classification
 *   *Rank                  → ranking
 *   *Pulse                 → real-time / tick
 *   AutoPilot, EarningsScout, Counterpoint → one-word roles
 */

export type PublicModelKey =
  | 'swing_forecast'
  | 'intraday_forecast'
  | 'cross_sectional_ranker'
  | 'regime_detector'
  | 'signal_gate'
  | 'sentiment_engine'
  | 'execution_engine'
  | 'pattern_scorer'
  | 'cot_agents'
  | 'debate_engine'

export interface PublicModel {
  key: PublicModelKey
  name: string
  role: string
  hex: string
}

export const PUBLIC_MODELS: Record<PublicModelKey, PublicModel> = {
  swing_forecast: {
    key: 'swing_forecast',
    name: 'Forecast',
    role: 'Swing forecast engine — 5-day quantile outlook',
    hex: 'var(--color-primary-text)',
  },
  intraday_forecast: {
    key: 'intraday_forecast',
    name: 'Intraday',
    role: 'Intraday forecast engine — 5-minute tick dynamics',
    hex: 'var(--color-warning)',
  },
  cross_sectional_ranker: {
    key: 'cross_sectional_ranker',
    name: 'Alpha',
    role: 'Cross-sectional alpha ranker — nightly universe sieve',
    hex: 'var(--color-primary-text)',
  },
  regime_detector: {
    key: 'regime_detector',
    name: 'Regime',
    role: 'Market regime detector — bull · sideways · bear',
    hex: 'var(--color-warning)',
  },
  signal_gate: {
    key: 'signal_gate',
    name: 'Gate',
    role: 'Signal gate classifier — buy / hold / sell verdict per candidate',
    hex: 'var(--color-warning)',
  },
  sentiment_engine: {
    key: 'sentiment_engine',
    name: 'Mood',
    role: 'News sentiment engine — AI-scored per headline',
    hex: 'var(--color-up)',
  },
  execution_engine: {
    key: 'execution_engine',
    name: 'AutoPilot',
    role: 'Autonomous execution engine — volatility-gated',
    hex: 'var(--color-down)',
  },
  pattern_scorer: {
    key: 'pattern_scorer',
    name: 'PatternScope',
    role: 'Pattern quality scorer',
    hex: 'var(--color-cyan)',
  },
  cot_agents: {
    key: 'cot_agents',
    name: 'InsightAI',
    role: 'Multi-agent reasoning — portfolio doctor',
    hex: 'var(--color-primary-text)',
  },
  debate_engine: {
    key: 'debate_engine',
    name: 'Counterpoint',
    role: 'Bull / Bear debate — high-stakes signals',
    hex: 'var(--color-ai)',
  },
}

export function publicLabel(key: PublicModelKey | string): string {
  const m = (PUBLIC_MODELS as Record<string, PublicModel>)[key]
  if (!m) return String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return m.name
}

export function publicModel(key: PublicModelKey | string): PublicModel | null {
  return (PUBLIC_MODELS as Record<string, PublicModel>)[key] ?? null
}

export function allPublicModels(): PublicModel[] {
  return Object.values(PUBLIC_MODELS)
}
