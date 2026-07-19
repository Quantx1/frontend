'use client'

/**
 * "AI read" of a strategy's stored backtest — the backtesting assistant.
 *
 * Mirrors WhyMovingCard: USER-TRIGGERED, never on load. Expanding the card
 * fetches the deterministic gate-aware drivers + improvement suggestions
 * instantly (0 LLM tokens); the grounded narrative only loads when the user
 * explicitly clicks "Get AI narrative" (cached server-side per backtest/day).
 * Honest-empty when no backtest is stored.
 */

import { useState } from 'react'
import { Sparkles, Loader2, Wrench } from '@/lib/icons'

import { DisclaimerFooter } from '@/components/foundation'
import { api } from '@/lib/api'

interface Resp {
  drivers: string[]
  suggestions: string[]
  narrative: string | null
}

export default function BacktestAIRead({ strategyId }: { strategyId: string }) {
  const [data, setData] = useState<Resp | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'empty'>('idle')
  const [narrLoading, setNarrLoading] = useState(false)

  const load = async (useLlm: boolean) => {
    try {
      const r = await api.strategies.explainBacktest(strategyId, useLlm)
      if (r?.drivers?.length || r?.suggestions?.length || r?.narrative) {
        setData({
          drivers: r.drivers || [],
          suggestions: r.suggestions || [],
          narrative: r.narrative || null,
        })
        setState('done')
      } else if (!useLlm) {
        setState('empty')
      }
    } catch {
      if (!useLlm) setState('empty')
    }
  }

  const expand = async () => {
    setState('loading')
    await load(false)
  }

  const askNarrative = async () => {
    setNarrLoading(true)
    await load(true)
    setNarrLoading(false)
  }

  return (
    <div className="rounded-lg border border-line bg-wrap overflow-hidden">
      <button
        onClick={expand}
        disabled={state === 'loading'}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-2 transition-colors disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold text-d-text-primary">
            AI read of this backtest
          </span>
        </span>
        {state === 'loading'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-d-text-muted" />
          : <span className="text-[11px] text-primary">{state === 'idle' ? 'Expand' : 'Refresh'}</span>}
      </button>

      {state === 'empty' && (
        <p className="px-4 pb-3 text-[11px] text-d-text-muted">
          No backtest on record yet — run one above first.
        </p>
      )}

      {state === 'done' && data && (
        <div className="px-4 pb-3 space-y-3">
          {data.narrative && (
            <p className="text-[12.5px] leading-relaxed text-d-text-secondary">{data.narrative}</p>
          )}

          {data.drivers.length > 0 && (
            <ul className="space-y-1">
              {data.drivers.map((d, i) => (
                <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
                  <span className="text-primary mt-0.5">•</span>{d}
                </li>
              ))}
            </ul>
          )}

          {data.suggestions.length > 0 && (
            <div className="rounded-md border border-line bg-main/40 px-3 py-2 space-y-1">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                <Wrench className="w-3 h-3 text-primary" /> Improve it
              </p>
              <ul className="space-y-1">
                {data.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[11.5px] text-d-text-secondary">
                    <span className="text-primary mt-0.5">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!data.narrative && (
            <button
              onClick={askNarrative}
              disabled={narrLoading}
              className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline disabled:opacity-50"
            >
              {narrLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Sparkles className="w-3 h-3" />}
              Get AI narrative
            </button>
          )}

          <DisclaimerFooter compact />
        </div>
      )}
    </div>
  )
}
