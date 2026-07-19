'use client'

/**
 * OptionsFlowCard — ONE consolidated read of today's option-chain positioning.
 *
 * Folds call-writing / put-writing / net PCR / max-pain pull / biggest OI
 * buildup / overall lean (today scattered across FnoTab, OiHeatmap and
 * FnoStockScanners) into a single card with a clear lean badge.
 *
 * Everything is deterministic + computed server-side (0 LLM tokens) — this only
 * reads /api/screener/fno/flow/{symbol}. Honest-empty: renders null when the
 * option chain is unavailable. Matches FnoTab.tsx / OiHeatmap.tsx tokens.
 */

import { useState } from 'react'
import useSWR from 'swr'
import { Layers, RefreshCw, TrendingDown, TrendingUp } from '@/lib/icons'

import { api } from '@/lib/api'

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'] as const
type FlowSymbol = (typeof INDICES)[number]

const LEAN_TONE: Record<string, string> = {
  bullish: 'border-up bg-up/10 text-up',
  bearish: 'border-down bg-down/10 text-down',
  neutral: 'border-line bg-main text-d-text-secondary',
}

function lots(n: number) {
  // Compact OI in lakhs / thousands so big numbers stay legible.
  if (Math.abs(n) >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return `${n}`
}

export default function OptionsFlowCard() {
  const [symbol, setSymbol] = useState<FlowSymbol>('NIFTY')

  const { data, error, isLoading, mutate } = useSWR(
    ['fno_options_flow', symbol],
    () => api.screener.fnoFlow(symbol),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // Honest-empty: nothing real to show -> render nothing (don't fabricate).
  if (error || (!isLoading && !data)) return null

  const LeanIcon =
    data?.lean === 'bullish' ? TrendingUp
      : data?.lean === 'bearish' ? TrendingDown
        : Layers
  const leanTone = LEAN_TONE[data?.lean ?? 'neutral'] || LEAN_TONE.neutral

  return (
    <section className="rounded-xl border border-line bg-wrap p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[12px] font-semibold text-d-text-primary">Options Flow</h3>
        </div>
        <span className="text-[10px] text-d-text-muted">
          Consolidated OI positioning — descriptive, not a recommendation.
        </span>
      </div>

      {/* Index toggle + refresh */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Index</span>
        {INDICES.map((idx) => {
          const active = symbol === idx
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSymbol(idx)}
              className={`rounded-md border px-3 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {idx}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => mutate()}
          aria-label="Refresh"
          className="ml-auto rounded-md border border-line bg-main p-1.5 text-d-text-muted transition-colors hover:text-d-text-primary"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!data ? (
        <p className="mt-3 text-[11px] text-d-text-muted">Loading flow…</p>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Lean banner */}
          <div className={`flex items-center justify-between rounded-md border px-3 py-2 ${leanTone}`}>
            <span className="flex items-center gap-2 text-[12px] font-semibold capitalize">
              <LeanIcon className="h-4 w-4" />
              {data.lean} lean
            </span>
            <span className="text-[10px] opacity-80">
              PCR {data.pcr_vote} · writing {data.writing_vote}
            </span>
          </div>

          {/* Writing balance + PCR */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Put writing" value={lots(data.total_put_writing)} tone="up" hint="fresh PE OI (floor)" />
            <Stat label="Call writing" value={lots(data.total_call_writing)} tone="down" hint="fresh CE OI (cap)" />
            <Stat
              label="Net PCR"
              value={data.pcr != null ? data.pcr.toFixed(2) : '—'}
              hint="PE OI / CE OI"
            />
            <Stat
              label="Max pain"
              value={data.max_pain != null ? data.max_pain.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
              hint={
                data.max_pain_pull_pct != null
                  ? `${data.max_pain_pull_pct > 0 ? '▲' : '▼'} ${Math.abs(data.max_pain_pull_pct).toFixed(1)}% from spot`
                  : 'pull to expiry'
              }
            />
          </div>

          {/* Biggest OI buildup */}
          {data.biggest_buildup && (
            <div className="rounded-md border border-line bg-main px-3 py-2 text-[11px] text-d-text-secondary">
              <span className="text-[9px] uppercase tracking-wider text-d-text-muted">Biggest OI move</span>
              <p className="mt-0.5 font-mono">
                <span className={data.biggest_buildup.side === 'PE' ? 'text-up' : 'text-down'}>
                  {data.biggest_buildup.side}
                </span>{' '}
                {data.biggest_buildup.strike.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                {' · '}
                {data.biggest_buildup.direction}{' '}
                <span className={data.biggest_buildup.oi_change > 0 ? 'text-up' : 'text-down'}>
                  {data.biggest_buildup.oi_change > 0 ? '+' : ''}{lots(data.biggest_buildup.oi_change)}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}


function Stat({
  label, value, tone, hint,
}: {
  label: string
  value: string
  tone?: 'up' | 'down'
  hint?: string
}) {
  const valueTone = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="rounded-md border border-line bg-main px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-medium tabular-nums ${valueTone}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[9px] text-d-text-muted">{hint}</p>}
    </div>
  )
}
