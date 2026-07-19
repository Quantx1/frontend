'use client'

/**
 * MultiTimeframeTab (PR-S12) — find stocks bullish/bearish across N timeframes.
 *
 * The strongest setups: momentum agreement on 15m + 1h + daily. Filters
 * out intraday noise that the legacy daily-only scanners can't see.
 */

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from '@/lib/icons'

import {
  Badge,
  Button,
  ChangeBadge,
  EmptyState,
  Skeleton,
} from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { api, handleApiError } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

const TIMEFRAME_OPTIONS = [
  { value: '15m,1h,1d', label: '15m + 1h + Daily' },
  { value: '1h,1d',     label: '1h + Daily' },
  { value: '15m,1h',    label: '15m + 1h' },
]

const UNIVERSE_OPTIONS = [
  { value: 'nifty50',  label: 'Nifty 50' },
  { value: 'nifty100', label: 'Nifty 100' },
  { value: 'nifty500', label: 'Nifty 500' },
] as const

export default function MultiTimeframeTab() {
  const [tfs, setTfs] = useState('15m,1h,1d')
  const [universe, setUniverse] = useState<(typeof UNIVERSE_OPTIONS)[number]['value']>('nifty100')
  const [direction, setDirection] = useState<'bullish' | 'bearish' | undefined>(undefined)

  const { data, error, isLoading, mutate } = useSWR(
    ['mtf_scan', tfs, universe, direction],
    () => api.screener.mtfScan({
      universe, timeframes: tfs.split(','),
      direction, limit: 50,
    }),
    { revalidateOnFocus: false, keepPreviousData: true, dedupingInterval: 120_000 },
  )

  const matches = data?.matches ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-wrap/60 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Timeframes
          </span>
          {TIMEFRAME_OPTIONS.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setTfs(tf.value)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                tfs === tf.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Universe
          </span>
          {UNIVERSE_OPTIONS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => setUniverse(u.value)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                universe === u.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { v: undefined, label: 'All' },
            { v: 'bullish' as const, label: 'Bullish' },
            { v: 'bearish' as const, label: 'Bearish' },
          ].map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setDirection(d.v)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                direction === d.v
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-d-text-muted">
          {data && (
            <span className="font-mono">
              {matches.length} matches · {data.symbols_scanned} scanned
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={() => mutate()} aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="MTF scanner failed"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : isLoading && matches.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="84px" />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          title="No timeframe agreement"
          description="Try a smaller timeframe set or remove the direction filter."
        />
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <article key={m.symbol} className="rounded-lg border border-line bg-wrap/60 p-3">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SymbolLogo symbol={m.symbol} size={26} />
                    <Link href={stockHref(m.symbol)} className="font-semibold text-d-text-primary hover:text-primary">
                      {m.symbol}
                    </Link>
                    <Badge tone={m.direction === 'bullish' ? 'up' : 'down'}>
                      {m.direction === 'bullish' ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {m.direction}
                    </Badge>
                    <Badge tone="muted">
                      {m.agreement_count}/{m.total_timeframes} agreed
                    </Badge>
                    {m.sector && <span className="font-mono text-[10px] text-d-text-muted">{m.sector}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm tabular-nums text-d-text-primary">₹{m.last_price.toFixed(2)}</div>
                  <ChangeBadge value={m.change_pct} kind="percent" />
                </div>
              </header>
              <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-line pt-2">
                {m.votes.map((v) => (
                  <div key={v.timeframe} className="rounded-md border border-line bg-main p-1.5">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-mono text-[10px] text-d-text-muted">{v.timeframe}</span>
                      <Badge tone={v.direction === 'bullish' ? 'up' : v.direction === 'bearish' ? 'down' : 'muted'}>
                        {v.direction.charAt(0).toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-d-text-secondary line-clamp-1" title={v.note}>
                      RSI {v.rsi} · Vol {v.volume_ratio.toFixed(1)}×
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-[10px] text-d-text-muted">
        Multi-timeframe agreement = momentum bias aligned on every requested timeframe.
        Highest-conviction setups; ~5-15s per refresh due to per-timeframe data fetches.
      </p>
    </div>
  )
}
