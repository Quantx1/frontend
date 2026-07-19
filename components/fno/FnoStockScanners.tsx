'use client'

/**
 * FnoStockScanners (PR-S20) — per-stock F&O signal dashboard.
 *
 * Shows Long Buildup / Short Buildup / Long Unwinding / Short Covering /
 * OI Spike buckets side by side, sourced from /api/screener/fno/stock-scanners.
 *
 * Honest about data state: when NSE participant OI is unavailable
 * (frequent — bot-blocked outside market hours), surfaces the source
 * tag clearly so the user doesn't mistake an empty bucket for "no signal".
 */

import useSWR from 'swr'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
  RefreshCw,
  Zap,
} from '@/lib/icons'

import { Badge, Button, EmptyState, Skeleton } from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'

interface OiRow {
  symbol: string
  change_pct: number
  oi_change_pct: number
  oi: number
}

const BUCKETS = [
  { key: 'long_buildup',    label: 'Long Buildup',    icon: ArrowUpRight,   tone: 'text-up',   help: 'Price ↑ + OI ↑ — fresh long positioning' },
  { key: 'short_buildup',   label: 'Short Buildup',   icon: ArrowDownRight, tone: 'text-down', help: 'Price ↓ + OI ↑ — fresh short positioning' },
  { key: 'short_covering',  label: 'Short Covering',  icon: ArrowUpLeft,    tone: 'text-up',   help: 'Price ↑ + OI ↓ — shorts squeeze-cover' },
  { key: 'long_unwinding',  label: 'Long Unwinding',  icon: ArrowDownLeft,  tone: 'text-down', help: 'Price ↓ + OI ↓ — longs covering (exhaustion warning)' },
  { key: 'oi_spike',        label: 'OI Spike',        icon: Zap,            tone: 'text-amber-400', help: 'Single-symbol ΔOI ≥ 20% — institutional footprint' },
] as const


export default function FnoStockScanners() {
  const { data, error, isLoading, mutate } = useSWR(
    'fno_stock_scanners',
    () => api.screener.fnoStockScanners(),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  if (error) {
    return (
      <EmptyState
        tone="error"
        icon={<AlertTriangle className="h-6 w-6" />}
        title="F&O stock scanners failed"
        description={handleApiError(error)}
        action={<Button onClick={() => mutate()}>Retry</Button>}
      />
    )
  }

  const fiiTone = data && data.fii_dii.fii_net >= 0 ? 'text-up' : 'text-down'
  const diiTone = data && data.fii_dii.dii_net >= 0 ? 'text-up' : 'text-down'

  return (
    <div className="space-y-4">
      {/* FII/DII header strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-wrap/60 px-3 py-2 text-xs">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Institutional flow</span>
        {data ? (
          <>
            <span>FII <span className={`font-mono tabular-nums ${fiiTone}`}>{data.fii_dii.fii_net >= 0 ? '+' : ''}{data.fii_dii.fii_net.toLocaleString('en-IN')} Cr</span></span>
            <span>DII <span className={`font-mono tabular-nums ${diiTone}`}>{data.fii_dii.dii_net >= 0 ? '+' : ''}{data.fii_dii.dii_net.toLocaleString('en-IN')} Cr</span></span>
            <Badge tone="muted">{data.fii_dii.date ?? 'unknown date'}</Badge>
            <Badge tone={data.fii_dii.source === 'nse_live' ? 'up' : 'muted'}>
              {data.fii_dii.source}
            </Badge>
          </>
        ) : (
          <Skeleton w="60%" h="16px" />
        )}
        <div className="ml-auto flex items-center gap-2 text-[10px] text-d-text-muted">
          {data?.oi_source && <Badge tone={data.oi_source.startsWith('bhavcopy') ? 'up' : 'muted'}>OI · {data.oi_source}</Badge>}
          <Button size="sm" variant="ghost" onClick={() => mutate()} aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* OI-feed warning when data unavailable */}
      {data && !data.oi_source?.startsWith('bhavcopy') && data.oi_last_error && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
          <strong>NSE OI feed unavailable today:</strong> {data.oi_last_error}.
          OI buildup buckets degrade to empty until the NSE bhavcopy publishes
          (usually post 5 PM IST). FII/DII flow still works via the live API.
        </div>
      )}

      {/* 5 buckets in a responsive grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {BUCKETS.map((b) => {
          const Icon = b.icon
          const rows: OiRow[] = (data?.buckets?.[b.key] ?? []) as OiRow[]
          const count = data?.counts?.[b.key] ?? 0
          return (
            <div key={b.key} className="rounded-xl border border-line bg-wrap">
              <header className="flex items-center justify-between border-b border-line px-3 py-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${b.tone}`} />
                  <span className="text-sm font-medium text-d-text-primary">{b.label}</span>
                </div>
                <span className="font-mono text-[10px] text-d-text-muted">{count} hits</span>
              </header>
              <p className="border-b border-line/40 px-3 py-1 text-[10px] text-d-text-muted">{b.help}</p>
              {isLoading ? (
                <div className="space-y-1 p-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="20px" />)}
                </div>
              ) : rows.length === 0 ? (
                <div className="px-3 py-6 text-center text-[11px] text-d-text-muted">
                  No matches right now.
                </div>
              ) : (
                <ul className="max-h-[260px] overflow-y-auto divide-y divide-line/40">
                  {rows.slice(0, 12).map((r) => (
                    <li key={r.symbol} className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px]">
                      <span className="font-medium text-d-text-primary">{r.symbol}</span>
                      <span className="flex items-center gap-2 font-mono tabular-nums text-d-text-secondary">
                        <span className={r.change_pct >= 0 ? 'text-up' : 'text-down'}>
                          {r.change_pct >= 0 ? '+' : ''}{r.change_pct.toFixed(1)}%
                        </span>
                        <span className={r.oi_change_pct >= 0 ? 'text-amber-300' : 'text-d-text-muted'}>
                          OI {r.oi_change_pct >= 0 ? '+' : ''}{r.oi_change_pct.toFixed(0)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
