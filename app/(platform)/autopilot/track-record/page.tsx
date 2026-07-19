'use client'

/**
 * /autopilot/track-record — CRITICAL #2 (2026-05-31).
 *
 * Live realised-P&L track record for AutoPilot. Reads /api/auto-trader/
 * track-record which serves the daily snapshot or falls back to live
 * aggregation from paper_trades + trades tables.
 *
 * Brand-safe per memory `project_greek_branding_2026_04_19`: shows
 * OUTCOMES (Sharpe, win-rate, drawdown, R-multiple) but NEVER per-model
 * decomposition (that's admin-only).
 *
 * Honest about state: when zero trades have closed yet, surfaces "0
 * trades yet" tag rather than synthetic backtest numbers (per project
 * lock `project_no_fallbacks_no_refunds_2026_04_19`).
 */

import { useState } from 'react'
import useSWR from 'swr'
import { Activity, AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from '@/lib/icons'

import { Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'

const WINDOWS = [30, 60, 90] as const
type WindowDays = (typeof WINDOWS)[number]
const SOURCES = ['paper', 'live'] as const
type Source = (typeof SOURCES)[number]


export default function TrackRecordPage() {
  const [windowDays, setWindowDays] = useState<WindowDays>(30)
  const [source, setSource] = useState<Source>('paper')

  const { data, error, isLoading, mutate } = useSWR(
    ['track_record', windowDays, source],
    () => api.autoTrader.trackRecord(windowDays, source),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  // HIGH #6 — SEBI disclaimer fetched once + cached aggressively.
  const { data: compliance } = useSWR(
    'compliance',
    () => api.autoTrader.compliance(),
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 },
  )

  return (
    <div className="w-full">
      <PageHeader
        title="AutoPilot Track Record"
        description="Realised P&L · win-rate · drawdown · Sharpe — read from live trades, never from backtest."
        actions={
          <Badge tone="primary">Brand-safe outcomes only</Badge>
        }
      />

      <div className="space-y-5 p-4 md:p-6 xl:px-8">
        {/* Filter strip — window + source */}
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-wrap/60 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Window</span>
            {WINDOWS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWindowDays(w)}
                className={`rounded-md border px-2 py-1 text-[11px] ${
                  windowDays === w
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                {w}d
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Source</span>
            {SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSource(s)}
                className={`rounded-md border px-2 py-1 text-[11px] capitalize ${
                  source === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-d-text-muted">
            {data?.surface && (
              <Badge tone={data.surface === 'snapshot' ? 'up' : 'muted'}>
                {data.surface === 'snapshot' ? 'Daily snapshot' : 'Live aggregate'}
              </Badge>
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
            title="Track record unavailable"
            description={handleApiError(error)}
            action={<Button onClick={() => mutate()}>Retry</Button>}
          />
        ) : isLoading || !data ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} w="100%" h="100px" />)}
          </div>
        ) : data.trades_count === 0 ? (
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title={`0 ${source} trades in last ${windowDays} days`}
            description={
              source === 'live'
                ? "No live trades closed in this window yet — run AutoPilot in dry-run for 30 days before flipping to live."
                : "Paper AutoPilot hasn't closed any trades yet. Run will accumulate as positions hit target/stop."
            }
          />
        ) : (
          <>
            {/* Top-level metric cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Win Rate"
                value={`${(data.win_rate * 100).toFixed(0)}%`}
                sub={`${data.winning_trades} wins / ${data.losing_trades} losses`}
                tone={data.win_rate >= 0.55 ? 'up' : data.win_rate >= 0.45 ? 'neutral' : 'down'}
              />
              <MetricCard
                label="Avg Return / Trade"
                value={`${data.avg_return_pct >= 0 ? '+' : ''}${data.avg_return_pct.toFixed(2)}%`}
                sub={`Median ${data.median_return_pct.toFixed(2)}%`}
                tone={data.avg_return_pct > 0 ? 'up' : 'down'}
              />
              <MetricCard
                label="Total P&L"
                value={`${data.total_pnl_inr >= 0 ? '+' : ''}₹${Math.abs(data.total_pnl_inr).toLocaleString('en-IN')}`}
                sub={`${data.trades_count} trades`}
                tone={data.total_pnl_inr >= 0 ? 'up' : 'down'}
              />
              <MetricCard
                label="Realised Sharpe"
                value={data.realised_sharpe != null ? data.realised_sharpe.toFixed(2) : '—'}
                sub={`Annualised`}
                tone={
                  data.realised_sharpe != null && data.realised_sharpe >= 1.0 ? 'up'
                    : data.realised_sharpe != null && data.realised_sharpe >= 0.5 ? 'neutral'
                      : 'down'
                }
              />
              <MetricCard
                label="Max Drawdown"
                value={
                  data.max_drawdown_pct != null
                    ? `${data.max_drawdown_pct.toFixed(1)}%`
                    : '—'
                }
                sub="Peak-to-trough"
                tone={
                  data.max_drawdown_pct != null && data.max_drawdown_pct > -5 ? 'up'
                    : data.max_drawdown_pct != null && data.max_drawdown_pct > -15 ? 'neutral'
                      : 'down'
                }
              />
              <MetricCard
                label="Best Trade"
                value={data.best_trade_pct != null ? `+${data.best_trade_pct.toFixed(2)}%` : '—'}
                sub="Single trade"
                tone="up"
              />
              <MetricCard
                label="Worst Trade"
                value={data.worst_trade_pct != null ? `${data.worst_trade_pct.toFixed(2)}%` : '—'}
                sub="Single trade"
                tone="down"
              />
              <MetricCard
                label="Profit Factor"
                value={
                  data.profit_factor != null && Number.isFinite(data.profit_factor)
                    ? data.profit_factor.toFixed(2)
                    : data.profit_factor != null
                      ? '∞'
                      : '—'
                }
                sub="gross wins / |losses|"
                tone={
                  data.profit_factor != null && data.profit_factor >= 1.5 ? 'up'
                    : data.profit_factor != null && data.profit_factor >= 1.0 ? 'neutral'
                      : 'down'
                }
              />
            </div>

            {/* Date range card */}
            <div className="rounded-xl border border-line bg-wrap p-4 text-xs text-d-text-secondary">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="First trade" value={data.first_trade_at?.slice(0, 10) ?? '—'} />
                <Stat label="Last trade" value={data.last_trade_at?.slice(0, 10) ?? '—'} />
                <Stat label="Trades" value={String(data.trades_count)} />
                <Stat label="Source" value={data.source.toUpperCase()} />
              </div>
              {data.notes?.length > 0 && (
                <div className="mt-3 border-t border-line pt-2 text-[10px] text-d-text-muted">
                  Notes: {data.notes.join(', ')}
                </div>
              )}
            </div>
          </>
        )}

        <p className="border-t border-line pt-4 text-[10px] text-d-text-muted">
          These are realised outcomes from actual trades. No backtest numbers, no synthetic
          data. AutoPilot trades update this view daily after market close (16:30 IST).
          Per-model contribution (which engine drove which trade) is admin-only.
        </p>

        {/* HIGH #6 — SEBI disclaimer footer */}
        {compliance && (
          <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-[10px] text-d-text-secondary">
            <p className="font-semibold text-yellow-300/90">
              SEBI Research Analyst Reg #: {compliance.sebi_ra_reg_number}
              {compliance.sebi_ra_valid_until && ` · Valid until ${compliance.sebi_ra_valid_until}`}
            </p>
            <p className="mt-1 leading-relaxed">{compliance.disclaimer_long}</p>
          </div>
        )}
      </div>
    </div>
  )
}


function MetricCard({ label, value, sub, tone }: {
  label: string
  value: string
  sub: string
  tone: 'up' | 'down' | 'neutral'
}) {
  const toneClass =
    tone === 'up' ? 'text-up'
      : tone === 'down' ? 'text-down'
        : 'text-d-text-primary'
  return (
    <div className="rounded-xl border border-line bg-wrap p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-medium tabular-nums ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-[10px] text-d-text-muted">{sub}</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className="font-mono text-sm tabular-nums text-d-text-primary">{value}</p>
    </div>
  )
}
