'use client'

/**
 * AI Options Copilot — "What is the best NIFTY trade today?"
 *
 * USER-TRIGGERED (button), never on load. Wraps the existing rule-based F&O
 * suggester: shows the deterministic ranked strategy candidate(s) instantly
 * (0 LLM tokens) and, when use_llm is on, the grounded narrative naming the
 * best trade + risk/reward (free-first model, cached per symbol/day).
 *
 * Honest-empty: renders nothing extra when the option chain is unavailable.
 * Matches FnoTab.tsx tokens + StrategyRow styling.
 */

import { useState } from 'react'
import {
  Layers,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from '@/lib/icons'

import { api, type FnoStrategy } from '@/lib/api'

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY'] as const
type CopilotSymbol = (typeof SYMBOLS)[number]

interface Facts {
  symbol: string
  bias: string
  vix_regime: string
  india_vix: number | null
  pcr_oi: number | null
  max_pain: number | null
  days_to_expiry: number | null
}

interface BestTradeResp {
  symbol: string
  facts: Facts | null
  strategies: FnoStrategy[]
  narrative: string | null
}

export default function OptionsCopilotCard() {
  const [symbol, setSymbol] = useState<CopilotSymbol>('NIFTY')
  const [data, setData] = useState<BestTradeResp | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'empty'>('idle')

  const ask = async (sym: CopilotSymbol) => {
    setState('loading')
    try {
      const r = await api.screener.fnoBestTrade(sym, true)
      if (r?.strategies?.length) {
        setData(r)
        setState('done')
      } else {
        setData(null)
        setState('empty')
      }
    } catch {
      setData(null)
      setState('empty')
    }
  }

  const selectSymbol = (sym: CopilotSymbol) => {
    setSymbol(sym)
    setData(null)
    setState('idle')
  }

  return (
    <section className="rounded-xl border border-line bg-wrap p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[12px] font-semibold text-d-text-primary">
            AI Options Copilot
          </h3>
        </div>
        <span className="text-[10px] text-d-text-muted">
          Descriptive — not a trade recommendation.
        </span>
      </div>

      {/* Symbol toggle */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
          Index
        </span>
        {SYMBOLS.map((s) => {
          const active = symbol === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => selectSymbol(s)}
              className={`rounded-md border px-3 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {s}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => ask(symbol)}
          disabled={state === 'loading'}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-primary bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
        >
          {state === 'loading'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Sparkles className="h-3.5 w-3.5" />}
          {state === 'idle' ? "Get today's best trade" : 'Refresh'}
        </button>
      </div>

      {state === 'empty' && (
        <p className="mt-3 text-[11px] text-d-text-muted">
          No clear best trade right now — the option chain is unavailable or no
          rule fired for this regime.
        </p>
      )}

      {state === 'done' && data && (
        <div className="mt-3 space-y-3">
          {/* Context line from the real facts */}
          {data.facts && (
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-d-text-muted">
              {data.facts.india_vix != null && (
                <span className="rounded-md border border-line bg-main px-2 py-0.5">
                  VIX · {data.facts.india_vix.toFixed(2)}
                </span>
              )}
              {data.facts.vix_regime && (
                <span className="rounded-md border border-line bg-main px-2 py-0.5 capitalize">
                  {data.facts.vix_regime}
                </span>
              )}
              {data.facts.pcr_oi != null && (
                <span className="rounded-md border border-line bg-main px-2 py-0.5">
                  PCR · {data.facts.pcr_oi.toFixed(2)}
                </span>
              )}
              {data.facts.max_pain != null && (
                <span className="rounded-md border border-line bg-main px-2 py-0.5">
                  Max Pain · {data.facts.max_pain.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              )}
              {data.facts.days_to_expiry != null && (
                <span className="rounded-md border border-line bg-main px-2 py-0.5">
                  {data.facts.days_to_expiry} DTE
                </span>
              )}
            </div>
          )}

          {/* Grounded narrative (only present when use_llm) */}
          {data.narrative && (
            <p className="text-[12.5px] leading-relaxed text-d-text-secondary">
              {data.narrative}
            </p>
          )}

          {/* Best trade is the head of the deterministic list */}
          <ul className="space-y-2">
            {data.strategies.map((s, i) => (
              <CopilotStrategyRow key={`${s.name}_${i}`} s={s} best={i === 0} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}


function CopilotStrategyRow({ s, best }: { s: FnoStrategy; best: boolean }) {
  const biasIcon =
    s.bias === 'bullish' ? <TrendingUp className="h-3.5 w-3.5 text-up" />
      : s.bias === 'bearish' ? <TrendingDown className="h-3.5 w-3.5 text-down" />
        : <Layers className="h-3.5 w-3.5 text-d-text-muted" />
  const confTone =
    s.confidence === 'high' ? 'border-up bg-up/10 text-up'
      : s.confidence === 'medium' ? 'border-primary/60 bg-primary/5 text-primary'
        : 'border-line bg-main text-d-text-muted'
  return (
    <li
      className={`rounded-md border p-3 ${
        best ? 'border-primary/60 bg-primary/5' : 'border-line bg-wrap'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          {best && (
            <span className="rounded border border-primary/60 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
              Best
            </span>
          )}
          {biasIcon}
          <span className="text-sm font-medium text-d-text-primary">{s.name}</span>
          <span className={`rounded border px-1.5 py-0.5 text-[10px] capitalize ${confTone}`}>
            {s.confidence}
          </span>
        </div>
        {s.margin_estimate_inr != null && (
          <span className="font-mono text-[11px] text-d-text-secondary">
            ~₹{(s.margin_estimate_inr / 1000).toFixed(0)}k margin
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-d-text-secondary">{s.rationale}</p>
      {s.suggested_legs.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-d-text-secondary">
          {s.suggested_legs.map((leg, i) => (
            <li key={i} className="font-mono">• {leg}</li>
          ))}
        </ul>
      )}
      {s.risk_notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-line/60 pt-2 text-[10px] text-d-text-muted">
          {s.risk_notes.map((r, i) => (
            <li key={i}>⚠ {r}</li>
          ))}
        </ul>
      )}
      {s.source_label && (
        <p className="mt-1 text-[9px] text-d-text-muted opacity-70">{s.source_label}</p>
      )}
    </li>
  )
}
