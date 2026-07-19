/**
 * copilot-modes — the single source-of-truth for the Copilot's 5-mode lens.
 *
 * Both the docked panel (CopilotProvider) and the Main Chat home hero
 * (app/(platform)/copilot/page.tsx) consume this. Each mode carries a light
 * `prefix` DIRECTIVE that pre-frames the outgoing message so the answer takes
 * the mode's shape WITHOUT any backend change. The directive is applied ONLY to
 * the API message field (display-raw / send-augmented) — it must never enter the
 * stored turn or history.
 *
 * MODE_PROMPTS are public, brand-safe NSE example prompts (real India-equity
 * names only) — no model / provider / engine names ever surface here.
 *
 * Icons are imported as values (never rendered in this file), so a `.ts` module
 * is fine — the consumers render `mode.icon` as JSX.
 */

import type { ElementType } from 'react'
import { LineChart, ScanLine, Sparkles, Stethoscope, Target } from '@/lib/icons'

export type CopilotMode = 'ask' | 'analyze' | 'screen' | 'doctor' | 'trade'

/** The minimal context a mode prefix reads. PageContext (CopilotProvider) is a
 *  structural superset, so it can be passed straight through. */
export interface ModeContext {
  symbol?: string
}

export interface ModeSpec {
  key: CopilotMode
  label: string
  icon: ElementType
  /** Tailwind text-color class for the lens glyph (each lens its own hue). */
  color: string
  placeholder: string
  /** Light directive prepended to the outgoing message so the mode shapes the
   *  answer without any backend change. Empty = plain ask. */
  prefix: (ctx: ModeContext) => string
}

// Lifted verbatim out of CopilotProvider so the two surfaces stay identical.
export const MODES: ModeSpec[] = [
  { key: 'ask', label: 'Ask', icon: Sparkles, color: 'text-ai', placeholder: 'Ask anything about markets…', prefix: () => '' },
  { key: 'analyze', label: 'Analyze', icon: LineChart, color: 'text-up', placeholder: 'Analyze a stock or setup…',
    prefix: (c) => `Give a grounded technical + fundamental read${c.symbol ? ` of ${c.symbol}` : ''}: ` },
  { key: 'screen', label: 'Screen', icon: ScanLine, color: 'text-signature', placeholder: 'Describe a screen in plain English…',
    prefix: () => 'Treat this as a stock-screener request and return matching names: ' },
  { key: 'doctor', label: 'Doctor', icon: Stethoscope, color: 'text-down', placeholder: 'Diagnose my portfolio or a position…',
    prefix: () => 'Act as a portfolio doctor — assess risk, concentration and what to do: ' },
  { key: 'trade', label: 'Trade', icon: Target, color: 'text-orange', placeholder: 'Plan a trade — you confirm before anything fires…',
    prefix: (c) => `Help me plan a trade${c.symbol ? ` in ${c.symbol}` : ''} (lay out entry, stop, target, size — do NOT place anything): ` },
]

/**
 * Per-mode public example prompts (real NSE names only — brand-safe). The 2×2
 * grid rotates a window of 4 through these via pickGrid; keeping ≥8 per mode
 * gives at least two distinct pages before any repeat. MUST stay an exhaustive
 * Record<CopilotMode, string[]> or tsc breaks.
 */
export const MODE_PROMPTS: Record<CopilotMode, string[]> = {
  ask: [
    'Is the market bullish or bearish today?',
    "What's driving the Nifty today?",
    'How is Bank Nifty positioned this week?',
    'What are the strongest swing signals on the tape right now?',
    'Which sectors are leading and lagging today?',
    'What does the India VIX say about risk right now?',
    'How did RELIANCE close, and why?',
    "What should I watch into tomorrow's open?",
    'Are FIIs net buyers or sellers this week?',
  ],
  analyze: [
    'Analyse RELIANCE: trend, key levels, entry, stop and target.',
    'Give me a technical read on HDFCBANK with support and resistance.',
    'Why is TATAMOTORS moving today?',
    'Break down INFY: momentum, volume and the setup.',
    'Is ICICIBANK overbought, or is there room to run?',
    'Read the chart on SBIN and flag the key risks.',
    'What is the multi-day setup on ADANIENT?',
    'Analyse the Nifty 50 index: structure and the level that matters.',
    'Compare the momentum in TCS versus WIPRO.',
  ],
  screen: [
    'Oversold large-caps in an uptrend with rising volume.',
    'Breakouts above the 50-day moving average with a volume surge.',
    'High-momentum Nifty 500 names making new 52-week highs.',
    'Stocks near support with bullish RSI divergence.',
    'Low-volatility large-caps holding steady uptrends.',
    'Midcaps with heavy delivery volume today.',
    'Names breaking out of a multi-week consolidation.',
    'Beaten-down quality stocks that are starting to turn up.',
    'Sector leaders across banking and IT right now.',
  ],
  doctor: [
    'Review my portfolio for concentration and drawdown risk.',
    'Which of my positions is most fragile right now?',
    'How should I rebalance for the current regime?',
    'Am I over-exposed to any single sector?',
    'Where is the hidden risk in my book?',
    'How much of my portfolio sits in high-beta names?',
    'Suggest hedges for my current holdings.',
    'Is my position sizing sensible across these trades?',
    'What would a 5% market drop do to my portfolio?',
  ],
  trade: [
    'Plan a swing trade in RELIANCE: entry, stop, target and size.',
    'Size a position in HDFCBANK risking 1% of my capital.',
    'Set a sensible stop and target for a long in SBIN.',
    'Plan an entry on the next pullback in TATAMOTORS.',
    'Find an options structure for a neutral view on Bank Nifty.',
    'Design a breakout trade in INFY with a tight stop.',
    'How should I scale into ICICIBANK over two entries?',
    'Plan a hedged long in the Nifty into this week.',
    'Where would I add or cut if ADANIENT keeps trending?',
  ],
}

/**
 * Deterministic, no-duplicate rotation through `pool`. Returns `n` items
 * starting at `offset` (mod length), wrapping around. With `n ≤ pool.length`
 * the window never repeats an entry — bumping `offset` by `n` pages cleanly to
 * the next set. Empty pool → [].
 */
export function pickGrid(pool: string[], offset: number, n = 4): string[] {
  if (pool.length === 0) return []
  const count = Math.min(n, pool.length)
  const len = pool.length
  const start = ((offset % len) + len) % len
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    out.push(pool[(start + i) % len])
  }
  return out
}
