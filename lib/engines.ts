/**
 * Public engines: the user-facing surface of the AI stack.
 *
 * BRAND FIREWALL: only the public engine names ship here (Alpha · Mood ·
 * Regime · AutoPilot). Real model architectures and internal codenames NEVER
 * appear in user-facing copy. Descriptions are model-agnostic (methodology,
 * not architecture) and metrics are honest qualifiers, never fabricated
 * headline numbers. Backend Python classes keep their canonical names.
 */

export type EngineTier = 'production' | 'shadow' | 'training'

export interface Engine {
  slug: string
  name: string
  tagline: string
  description: string
  model: string
  cadence: string
  tier: EngineTier
  /** Honest qualifier (methodology), not a fabricated headline number. */
  accuracy: string
  metric: string
  /** Honest Q&A about the engine for the engine-as-landing FAQ accordion. */
  faq: { q: string; a: string }[]
}

export const ENGINES: Engine[] = [
  {
    slug: 'alpha',
    name: 'Alpha',
    tagline: 'ML-ranked NSE book',
    description:
      'A machine-learning engine ranks every NSE name by expected forward return across momentum, quality and mean-reversion factors. The top of the book feeds Signals, the strategy library and AutoPilot.',
    model: 'Cross-sectional multi-factor model',
    cadence: 'Inference 15:40 IST · retrained weekly',
    tier: 'production',
    accuracy: 'Walk-forward validated',
    metric: 'Cross-sectional rank · out-of-sample',
    faq: [
      {
        q: 'What does Alpha actually rank?',
        a: 'Every name on the NSE main board, by expected forward return. The trained model blends momentum, quality and mean-reversion factors, and the top of the book feeds Signals, the strategy library and AutoPilot.',
      },
      {
        q: 'How often is it retrained?',
        a: 'Inference runs at 15:40 IST each session; the model is retrained weekly and walk-forward backtested on out-of-sample data only before it is allowed to serve.',
      },
      {
        q: 'Is a high rank a guarantee?',
        a: 'No. A rank is a relative read of forward-return odds, not advice or a promise. Markets carry risk and any ranked name can fall.',
      },
    ],
  },
  {
    slug: 'mood',
    name: 'Mood',
    tagline: 'India-tuned news sentiment',
    description:
      'An India-tuned sentiment engine reads the Indian news tape and scores each ticker on a rolling window, on demand. Trained on Indian-market language, not generic finance text, so headlines specific to NSE names register.',
    model: 'Domain-tuned sentiment model',
    cadence: 'Refreshed hourly during market hours',
    tier: 'production',
    accuracy: 'Held-out tested',
    metric: 'Bull/bear classification · held-out set',
    faq: [
      {
        q: 'What does Mood read?',
        a: 'The Indian news tape around each ticker, scored on a rolling window. The model is trained on Indian-market language rather than generic finance text, so headlines specific to NSE names register.',
      },
      {
        q: 'Does Mood place or gate trades?',
        a: 'No. Mood is a standalone, on-demand read you pull up per ticker on stock pages and the Markets lookup. It is a sentiment cross-check for your own judgement, not a trade trigger and not a voter in any signal.',
      },
      {
        q: 'How fresh is it?',
        a: 'Refreshed hourly during market hours. It is a classification read on a held-out set, not a price target.',
      },
    ],
  },
  {
    slug: 'regime',
    name: 'Regime',
    tagline: 'Regime-aware market detector',
    description:
      'A regime-detection engine reads Nifty returns, volatility and India VIX to classify the market into bull / neutral / bear each day. Every other engine sizes risk down in bear regimes, adaptive to the tape.',
    model: 'Probabilistic regime model',
    cadence: 'Inference 8:15 IST',
    tier: 'production',
    accuracy: 'Daily · backtested',
    metric: 'Regime persistence · out-of-sample',
    faq: [
      {
        q: 'What are the regimes?',
        a: 'Each day Regime classifies the market into bull, neutral or bear from Nifty returns, volatility and India VIX, with a probability on each state.',
      },
      {
        q: 'Why does this matter for my signals?',
        a: 'Every other engine is regime-aware and sizes risk down in bear regimes: heavier exposure in clean uptrends, lighter when the state turns. It is the throttle on the whole stack.',
      },
      {
        q: 'When does it run?',
        a: 'Inference runs at 8:15 IST before the open. The classifier is backtested on out-of-sample data; regime calls can still be wrong in fast-changing markets.',
      },
    ],
  },
  {
    slug: 'autopilot',
    name: 'AutoPilot',
    tagline: 'Autonomous execution agent',
    description:
      'An autonomous execution agent runs the book hands-free: it carries the ML-ranked names with Kelly-sized positions, a daily rebalance and a VIX risk overlay. Hard stops and targets stay authoritative at all times.',
    model: 'Supervised ranker + Kelly sizing',
    cadence: 'Rebalance 15:45 IST',
    tier: 'production',
    accuracy: 'Sharpe-gated backtest',
    metric: 'Backtest Sharpe · walk-forward',
    faq: [
      {
        q: 'Does AutoPilot trade on its own?',
        a: 'Yes, it runs the book autonomously: it carries the names the engines rank highest with Kelly-sized positions, a daily rebalance and a VIX risk overlay. Hard stops and targets stay authoritative at all times.',
      },
      {
        q: 'How is risk controlled?',
        a: 'Sizing is Kelly-sized and drawdown-aware, exposure scales down in bear regimes via the VIX overlay, and a per-stock cap keeps the book diversified. The strategy must clear a Sharpe-gated, walk-forward backtest on out-of-sample data before it goes live.',
      },
      {
        q: 'Is past backtest performance a guarantee?',
        a: 'No. A Sharpe-gated backtest is a bar to clear, not a forecast. Live results differ from backtests and capital is always at risk.',
      },
    ],
  },
]

export function getEngineBySlug(slug: string): Engine | undefined {
  return ENGINES.find((e) => e.slug === slug)
}
