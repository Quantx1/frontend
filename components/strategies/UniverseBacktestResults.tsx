'use client'

/**
 * UniverseBacktestResults — renders the response of
 * POST /api/strategies/{id}/backtest/universe.
 *
 * Shows the aggregate P&L hero, key portfolio-level KPIs, and a
 * sortable per-symbol table so the user can see which stocks made or
 * lost money inside the universe. Skipped + failed symbols surface
 * separately with reasons so the user understands coverage.
 */

import { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from '@/lib/icons'

import { Badge, Card, CardBody, CardHeader, DataTable, DisclaimerFooter } from '@/components/foundation'
import { formatPercent } from '@/lib/utils'

interface SymbolRow {
  symbol: string
  status: 'ok'
  total_return_pct: number | null
  sharpe_ratio: number | null
  win_rate: number | null
  max_drawdown_pct: number | null
  total_trades: number | null
  final_capital: number
  pnl_inr: number
}

interface Aggregate {
  symbols_run: number
  winners: number
  losers: number
  win_pct: number
  total_capital_deployed: number
  total_pnl_inr: number
  total_return_pct: number
  avg_return_pct_per_symbol: number
  avg_sharpe: number
  avg_win_rate: number
  avg_max_drawdown_pct: number
  sum_trades: number
}

interface Props {
  universe: string
  lookback_days: number
  symbols_attempted: number
  aggregate: Aggregate | null
  results: SymbolRow[]
  skipped: Array<{ symbol: string; reason: string }>
  failed: Array<{ symbol: string; reason: string }>
}

const UNIVERSE_LABELS: Record<string, string> = {
  nifty50: 'NIFTY 50',
  nifty100: 'NIFTY 100',
  nifty500: 'NIFTY 500',
  'sector:IT': 'IT Sector',
  'sector:BANK': 'Banking',
  'sector:AUTO': 'Auto',
  'sector:PHARMA': 'Pharma',
  'sector:FMCG': 'FMCG',
  'sector:METAL': 'Metals',
  'sector:ENERGY': 'Energy',
  'sector:INFRA': 'Infrastructure',
  single: 'Single symbol',
}

export function UniverseBacktestResults({
  universe,
  lookback_days,
  symbols_attempted,
  aggregate,
  results,
  skipped,
  failed,
}: Props) {
  const [sort, setSort] = useState<'return' | 'sharpe' | 'pnl'>('return')

  const sorted = useMemo(() => {
    const arr = [...results]
    if (sort === 'sharpe') {
      arr.sort((a, b) => (b.sharpe_ratio ?? -99) - (a.sharpe_ratio ?? -99))
    } else if (sort === 'pnl') {
      arr.sort((a, b) => b.pnl_inr - a.pnl_inr)
    } else {
      arr.sort((a, b) => (b.total_return_pct ?? 0) - (a.total_return_pct ?? 0))
    }
    return arr
  }, [results, sort])

  if (!aggregate) {
    return (
      <Card className="border-down/40 bg-down/5">
        <CardBody className="space-y-2">
          <p className="text-sm font-semibold text-down">
            Universe backtest produced no usable results
          </p>
          <p className="text-xs text-d-text-muted">
            Of {symbols_attempted} symbol(s) attempted: {skipped.length} skipped
            (insufficient history), {failed.length} failed. See the lists below.
          </p>
        </CardBody>
      </Card>
    )
  }

  const positive = aggregate.total_pnl_inr >= 0
  const heroTone = positive ? 'border-up/30 bg-up/5' : 'border-down/30 bg-down/5'
  const pnlColor = positive ? 'text-up' : 'text-down'
  const sign = positive ? '+' : '-'

  return (
    <div className="space-y-4">
      {/* ── Hero P&L ── */}
      <Card className={heroTone}>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-d-text-muted">
              {positive ? 'You would have made' : 'You would have lost'} ·{' '}
              {UNIVERSE_LABELS[universe] ?? universe} · {aggregate.symbols_run} stocks
            </p>
            <p className={`mt-1 font-mono text-[34px] font-bold leading-none tabular-nums ${pnlColor}`}>
              {sign}₹{Math.abs(Math.round(aggregate.total_pnl_inr)).toLocaleString('en-IN')}
            </p>
            <p className={`mt-1 font-mono text-[13px] font-medium tabular-nums ${pnlColor}`}>
              {sign}{Math.abs(aggregate.total_return_pct).toFixed(2)}% portfolio return
              <span className="mx-2 text-d-text-muted">·</span>
              <span>
                {aggregate.winners} winners / {aggregate.losers} losers
              </span>
              <span className="mx-2 text-d-text-muted">·</span>
              <span>{(aggregate.win_pct * 100).toFixed(0)}% hit rate</span>
            </p>
            <p className="mt-2 text-[11px] text-d-text-muted">
              ₹{Math.round(aggregate.total_capital_deployed).toLocaleString('en-IN')} total
              capital deployed · {lookback_days}d lookback
            </p>
          </div>
          <div className="text-right md:border-l md:border-line md:pl-4">
            <p className="text-[11px] uppercase tracking-wider text-d-text-muted">
              Avg per stock
            </p>
            <p className="font-mono text-[22px] font-semibold text-d-text-primary tabular-nums">
              {aggregate.avg_return_pct_per_symbol >= 0 ? '+' : ''}
              {aggregate.avg_return_pct_per_symbol.toFixed(2)}%
            </p>
            <p className="text-[11px] text-d-text-muted">
              Sharpe {aggregate.avg_sharpe.toFixed(2)} · {aggregate.sum_trades} trades
            </p>
          </div>
        </CardBody>
      </Card>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Metric label="Symbols run" value={String(aggregate.symbols_run)} />
        <Metric label="Avg Sharpe" value={aggregate.avg_sharpe.toFixed(2)} />
        <Metric label="Avg win rate" value={formatPercent(aggregate.avg_win_rate, 1)} />
        <Metric
          label="Avg Max DD"
          value={`-${Math.abs(aggregate.avg_max_drawdown_pct).toFixed(2)}%`}
          tone="down"
        />
        <Metric label="Total trades" value={String(aggregate.sum_trades)} />
      </div>

      {/* ── Per-symbol table ── */}
      <Card>
        <CardHeader>
          <span className="flex items-center justify-between gap-2">
            <span>Per-symbol results</span>
            <div className="inline-flex items-center gap-1">
              {(['return', 'sharpe', 'pnl'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSort(k)}
                  className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    sort === k
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-line text-d-text-muted hover:text-d-text-primary'
                  }`}
                >
                  {k === 'return' ? 'Return%' : k === 'sharpe' ? 'Sharpe' : 'P&L'}
                </button>
              ))}
            </div>
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <DataTable<SymbolRow>
            ariaLabel="Universe backtest per-symbol results"
            data={sorted}
            rowKey={(r) => r.symbol}
            columns={[
              {
                key: 'symbol',
                header: 'Symbol',
                cell: (r) => (
                  <span className="font-mono text-xs font-semibold text-d-text-primary">
                    {r.symbol}
                  </span>
                ),
              },
              {
                key: 'pnl',
                header: 'P&L (₹)',
                align: 'right',
                cell: (r) => {
                  const color = r.pnl_inr >= 0 ? 'text-up' : 'text-down'
                  const s = r.pnl_inr >= 0 ? '+' : '-'
                  return (
                    <span className={`font-mono text-xs tabular-nums ${color}`}>
                      {s}₹{Math.abs(Math.round(r.pnl_inr)).toLocaleString('en-IN')}
                    </span>
                  )
                },
              },
              {
                key: 'return',
                header: 'Return',
                align: 'right',
                cell: (r) => {
                  const v = r.total_return_pct ?? 0
                  const color = v >= 0 ? 'text-up' : 'text-down'
                  return (
                    <span className={`font-mono text-xs tabular-nums ${color}`}>
                      {v >= 0 ? '+' : ''}
                      {v.toFixed(2)}%
                    </span>
                  )
                },
              },
              {
                key: 'sharpe',
                header: 'Sharpe',
                align: 'right',
                cell: (r) => (
                  <span className="font-mono text-xs text-d-text-muted tabular-nums">
                    {r.sharpe_ratio != null ? r.sharpe_ratio.toFixed(2) : '—'}
                  </span>
                ),
              },
              {
                key: 'win',
                header: 'Win%',
                align: 'right',
                cell: (r) => (
                  <span className="font-mono text-xs text-d-text-muted tabular-nums">
                    {formatPercent(r.win_rate, 0)}
                  </span>
                ),
              },
              {
                key: 'dd',
                header: 'Max DD',
                align: 'right',
                cell: (r) => (
                  <span className="font-mono text-xs text-down tabular-nums">
                    -{Math.abs(r.max_drawdown_pct ?? 0).toFixed(1)}%
                  </span>
                ),
              },
              {
                key: 'trades',
                header: 'Trades',
                align: 'right',
                cell: (r) => (
                  <span className="font-mono text-xs text-d-text-muted tabular-nums">
                    {r.total_trades ?? 0}
                  </span>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      {/* ── Coverage notes ── */}
      {(skipped.length > 0 || failed.length > 0) && (
        <Card className="border-warning/30 bg-warning/5">
          <CardBody className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">
              Coverage notes
            </p>
            {skipped.length > 0 && (
              <p className="text-xs text-d-text-muted">
                <span className="font-semibold text-d-text-primary">
                  {skipped.length} skipped
                </span>{' '}
                — insufficient history. Skipped:{' '}
                <span className="font-mono">{skipped.map((s) => s.symbol).join(', ')}</span>
              </p>
            )}
            {failed.length > 0 && (
              <p className="text-xs text-d-text-muted">
                <span className="font-semibold text-down">
                  {failed.length} failed
                </span>{' '}
                — data provider error or computation issue. First reason:{' '}
                <span className="font-mono">{failed[0]?.reason}</span>
              </p>
            )}
          </CardBody>
        </Card>
      )}

      <DisclaimerFooter compact />
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'up' | 'down'
}) {
  const color =
    tone === 'up'
      ? 'text-up'
      : tone === 'down'
        ? 'text-down'
        : 'text-d-text-primary'
  return (
    <div className="rounded-md border border-line bg-wrap p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  )
}
