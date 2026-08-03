'use client'

/**
 * BacktestViewer — renders a DSLBacktestResult.
 *
 * Layout (top → bottom):
 *   1. Header row: symbol, period, final capital, total return %
 *   2. KPI strip: Sharpe, Win rate, Max DD, Trades, Profit factor, Avg hold
 *   3. Equity curve (Recharts area)
 *   4. Trade log (DataTable)
 *
 * Used by:
 *   - /strategies builder tab (after Save → Run Backtest)
 *   - /strategies/[slug] template detail page
 *   - /strategies/mine/[id] user-strategy detail
 */

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import {
  Badge, Card, CardBody, CardHeader, DataTable, DisclaimerFooter, EyebrowMono,
} from '@/components/foundation'
import { formatPercent } from '@/lib/utils'
import type { DSLBacktestResult, DSLOutOfSample, DSLTrade } from '@/types/strategies'

import { num } from '@/lib/format'
interface Props {
  result: DSLBacktestResult
}

export function BacktestViewer({ result }: Props) {
  // ⚠️ Optional by contract. The universe path returns a summary with no
  // equity curve at all (backend .../backtest.py:760); this used to be an
  // unguarded .map() and threw for every universe-scoped strategy.
  const equity = useMemo(
    () =>
      (result.equity_curve ?? []).map((p) => ({
        date: formatShortDate(p.date),
        equity: p.equity,
      })),
    [result.equity_curve],
  )

  const trades = result.trades ?? []
  const oos = result.out_of_sample
  const inSampleReturn = result.total_return_pct

  return (
    <div className="flex flex-col gap-4">
      {/* ── Hero ──────────────────────────────────────────────────────────
          What this replaced: a ₹ figure headed "You would have made", plus a
          COMPOUNDED annualisation — Math.pow(final/initial, 365/days) — of a
          single in-sample run. That is the most overfittable number the system
          produces, extrapolated to a yearly rate, framed as the user's own
          realised outcome, on a SEBI-constrained retail product.

          The honest headline is the out-of-sample evidence, which the backend
          has always computed and the UI never read. In-sample return is still
          shown — demoted to context, which is what it is. ── */}
      {oos ? (
        <Card elevation="raised">
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-d-text-muted">
                  Out-of-sample · {result.symbol}
                </p>
                <p className="mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-d-text-primary">
                  {oos.oos_folds_profitable}/{oos.n_folds}
                </p>
                <p className="mt-1 text-[13px] text-d-text-secondary">
                  windows profitable on data the rules never saw
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-d-text-muted">
                  In-sample return
                </p>
                <p
                  className={`font-mono text-[20px] font-semibold tabular-nums ${
                    (inSampleReturn ?? 0) >= 0 ? 'text-up' : 'text-down'
                  }`}
                >
                  {(inSampleReturn ?? 0) >= 0 ? '+' : ''}
                  {(inSampleReturn ?? 0).toFixed(2)}%
                </p>
                <p className="text-[11px] text-d-text-muted">after costs · not a forecast</p>
              </div>
            </div>

            <FoldStrip oos={oos} />

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Metric label="OOS Sharpe" value={oos.oos_mean_sharpe.toFixed(2)} />
              <Metric label="Consistency" value={`${Math.round(oos.oos_consistency * 100)}%`} />
              <Metric
                label="Worst OOS DD"
                value={`-${Math.abs(oos.oos_worst_drawdown_pct).toFixed(1)}%`}
                tone="down"
              />
              <Metric
                label="Holdout"
                value={`${oos.holdout_return_pct >= 0 ? '+' : ''}${oos.holdout_return_pct.toFixed(2)}%`}
                tone={oos.holdout_return_pct >= 0 ? undefined : 'down'}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-d-text-muted">
              Walk-forward over {oos.n_folds} windows, {oos.oos_trades} out-of-sample trades. The
              final window is a holdout the rules were never fitted against. Past behaviour on
              historical data does not predict future results.
            </p>
          </CardBody>
        </Card>
      ) : (
        // No OOS block — say so rather than filling the space with an
        // in-sample number dressed up as a result.
        <Card elevation="raised">
          <CardBody className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-d-text-muted">
                In-sample return · {result.symbol}
              </p>
              <p
                className={`mt-1 font-mono text-[28px] font-semibold leading-none tabular-nums ${
                  (inSampleReturn ?? 0) >= 0 ? 'text-up' : 'text-down'
                }`}
              >
                {(inSampleReturn ?? 0) >= 0 ? '+' : ''}
                {(inSampleReturn ?? 0).toFixed(2)}%
              </p>
              <p className="mt-1.5 max-w-prose text-[12px] text-d-text-secondary">
                No out-of-sample windows in this run, so there is nothing here that tests the rules
                against unseen data. In-sample numbers cannot support a decision to trade.
              </p>
            </div>
            {result.symbols_tested != null && (
              <Metric label="Symbols tested" value={`${result.symbols_tested}`} />
            )}
          </CardBody>
        </Card>
      )}

      {/* ── In-sample KPI strip. Every field here is optional on the universe
             path, so each is guarded rather than assumed. ── */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Sharpe" value={result.sharpe_ratio.toFixed(2)} />
        <Metric label="Win rate" value={formatPercent(result.win_rate, 1)} />
        {result.max_drawdown_pct != null && (
          <Metric
            label="Max DD"
            value={`-${Math.abs(result.max_drawdown_pct).toFixed(2)}%`}
            tone="down"
          />
        )}
        <Metric label="Trades" value={`${result.total_trades}`} />
        {result.profit_factor != null && (
          <Metric
            label="Profit factor"
            value={
              Number.isFinite(result.profit_factor) ? result.profit_factor.toFixed(2) : '∞'
            }
          />
        )}
        {result.avg_hold_days != null && (
          <Metric label="Avg hold" value={`${result.avg_hold_days.toFixed(1)}d`} />
        )}
      </div>

      {/* ── Equity curve ── */}
      <Card>
        <CardHeader>Equity curve</CardHeader>
        <CardBody>
          {equity.length === 0 ? (
            <p className="py-8 text-center text-sm text-d-text-muted">
              No equity points returned by the backtest.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={equity}
                margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="bt-equity-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-up)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-up)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-line)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-line)' }}
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v: number) =>
                    `₹${(v / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: 'color-mix(in srgb, var(--color-wrap-hover) 96%, transparent)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'var(--color-muted)' }}
                  formatter={(v: number) => [
                    `₹${num(Math.round(v))}`,
                    'Equity',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--color-up)"
                  strokeWidth={2}
                  fill="url(#bt-equity-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* ── Trade log ── */}
      <Card>
        <CardHeader>
          <span className="flex items-center justify-between gap-2">
            <span>Trade log</span>
            <Badge tone="muted">{trades.length} trades</Badge>
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {trades.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-d-text-muted">
              {result.equity_curve
                ? 'No trades fired in this window.'
                : 'This run covered a universe of symbols, so there is no single-symbol trade log.'}
            </p>
          ) : (
            <TradeTable trades={trades} />
          )}
        </CardBody>
      </Card>

      <DisclaimerFooter compact />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────

/**
 * The walk-forward fold strip — one cell per window, the last being the holdout.
 *
 * This is the only view in which a strategy can visibly FAIL, which is exactly
 * what makes it worth showing first. A run that made money overall but lost in
 * two of four windows is a different object from one that was steady, and a
 * single aggregate return cannot tell you which you are holding.
 */
function FoldStrip({ oos }: { oos: DSLOutOfSample }) {
  const folds = oos.folds ?? []
  if (folds.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between">
        <EyebrowMono className="text-[10px]">Walk-forward windows</EyebrowMono>
        <span className="text-[10px] text-d-text-muted">last = holdout</span>
      </div>
      <div className="mt-1.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${folds.length}, minmax(0,1fr))` }}>
        {folds.map((f, i) => {
          const isHoldout = i === folds.length - 1
          return (
            <div
              key={f.index ?? i}
              title={`${f.start_date} → ${f.end_date} · ${f.trades} trades · Sharpe ${f.sharpe?.toFixed(2) ?? '—'}`}
              className={`rounded-sm border p-2 ${
                f.profitable ? 'border-up/30 bg-up/[0.07]' : 'border-down/30 bg-down/[0.07]'
              } ${isHoldout ? 'ring-1 ring-inset ring-wrap-line' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-d-text-muted">
                  {isHoldout ? 'Holdout' : `W${i + 1}`}
                </span>
                <span className={f.profitable ? 'text-up' : 'text-down'} aria-hidden="true">
                  {f.profitable ? '✓' : '✕'}
                </span>
              </div>
              <p
                className={`mt-0.5 font-mono text-[13px] font-medium tabular-nums ${
                  f.net_return_pct >= 0 ? 'text-up' : 'text-down'
                }`}
              >
                {f.net_return_pct >= 0 ? '+' : ''}
                {f.net_return_pct.toFixed(1)}%
              </p>
              <p className="text-[10px] text-d-text-muted">{f.trades} trades</p>
            </div>
          )
        })}
      </div>
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
    tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="rounded-xs border border-line bg-wrap p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  )
}

function TradeTable({ trades }: { trades: DSLTrade[] }) {
  return (
    <DataTable<DSLTrade>
      ariaLabel="Backtest trade log"
      data={trades}
      rowKey={(t) => `${t.entry_date}-${t.exit_date}-${t.entry_price}`}
      columns={[
        {
          key: 'entry',
          header: 'Entry',
          cell: (t) => (
            <span className="font-mono text-xs tabular-nums">
              {formatShortDate(t.entry_date)} · ₹{t.entry_price.toFixed(2)}
            </span>
          ),
        },
        {
          key: 'exit',
          header: 'Exit',
          cell: (t) => (
            <span className="font-mono text-xs tabular-nums">
              {formatShortDate(t.exit_date)} · ₹{t.exit_price.toFixed(2)}
            </span>
          ),
        },
        {
          key: 'hold',
          header: 'Hold',
          cell: (t) => (
            <span className="text-d-text-muted">{t.hold_days}d</span>
          ),
        },
        {
          key: 'pnl',
          header: 'Net P&L',
          align: 'right',
          cell: (t) => {
            const color = t.net_pnl_pct >= 0 ? 'text-up' : 'text-down'
            const sign = t.net_pnl_pct >= 0 ? '+' : ''
            return (
              <span className={`font-mono text-xs font-medium tabular-nums ${color}`}>
                {sign}
                {t.net_pnl_pct.toFixed(2)}%
              </span>
            )
          },
        },
        {
          key: 'reason',
          header: 'Exit',
          cell: (t) => (
            <Badge tone={exitTone(t.exit_reason)}>
              {humanExit(t.exit_reason)}
            </Badge>
          ),
        },
      ]}
    />
  )
}

function exitTone(
  reason: DSLTrade['exit_reason'],
): 'up' | 'warning' | 'down' | 'muted' {
  if (reason === 'take_profit') return 'up'
  if (reason === 'stop_loss') return 'down'
  if (reason === 'trailing_stop') return 'warning'
  return 'muted'
}

function humanExit(reason: DSLTrade['exit_reason']): string {
  switch (reason) {
    case 'exit_condition':
      return 'Signal'
    case 'stop_loss':
      return 'SL'
    case 'take_profit':
      return 'TP'
    case 'trailing_stop':
      return 'Trail'
    case 'end_of_data':
      return 'EOD'
  }
}

function formatShortDate(iso: string): string {
  // Accept "2026-05-26" or "2026-05-26T...".
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}
