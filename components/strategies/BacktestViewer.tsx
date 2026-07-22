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

import { Badge, Card, CardBody, CardHeader, DataTable, DisclaimerFooter } from '@/components/foundation'
import { formatPercent } from '@/lib/utils'
import type { DSLBacktestResult, DSLTrade } from '@/types/strategies'

interface Props {
  result: DSLBacktestResult
}

export function BacktestViewer({ result }: Props) {
  const equity = useMemo(
    () =>
      result.equity_curve.map((p) => ({
        date: formatShortDate(p.date),
        equity: p.equity,
      })),
    [result.equity_curve],
  )

  const pnlAbs = result.final_capital - result.initial_capital
  const pnlSign = pnlAbs >= 0 ? '+' : '-'
  const positive = pnlAbs >= 0
  const cardTone = positive
    ? 'border-up/30 bg-up/5'
    : 'border-down/30 bg-down/5'
  const pnlColor = positive ? 'text-up' : 'text-down'

  // Annualise the return so the "what could I make per year" question
  // has a believable answer. We derive the period from the date strings
  // (yyyy-mm-dd → JS Date) and scale linearly.
  const days = (() => {
    const s = new Date(result.start_date).getTime()
    const e = new Date(result.end_date).getTime()
    const d = (e - s) / (1000 * 60 * 60 * 24)
    return d > 0 && Number.isFinite(d) ? d : null
  })()
  const annualised = days && days > 30
    ? (Math.pow(result.final_capital / result.initial_capital, 365 / days) - 1) * 100
    : null

  return (
    <div className="space-y-4">
      {/* ── Hero summary — make the "you would have made" answer obvious ── */}
      <Card className={cardTone}>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Left: bold pnl */}
          <div className="md:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-d-text-muted">
              {positive ? 'You would have made' : 'You would have lost'} · {result.symbol}
            </p>
            <p className={`mt-1 font-mono text-[34px] font-bold leading-none tabular-nums ${pnlColor}`}>
              {pnlSign}₹{Math.abs(Math.round(pnlAbs)).toLocaleString('en-IN')}
            </p>
            <p className={`mt-1 font-mono text-[13px] font-medium tabular-nums ${pnlColor}`}>
              {pnlSign}
              {Math.abs(result.total_return_pct).toFixed(2)}% over {days?.toFixed(0) ?? '—'} days
              {annualised != null && Number.isFinite(annualised) && (
                <>
                  <span className="mx-2 text-d-text-muted">·</span>
                  <span>~{annualised > 0 ? '+' : ''}{annualised.toFixed(1)}% / yr</span>
                </>
              )}
            </p>
            <p className="mt-2 text-[11px] text-d-text-muted">
              {result.start_date} → {result.end_date} · ₹
              {Math.round(result.initial_capital).toLocaleString('en-IN')} starting capital
            </p>
          </div>
          {/* Right: final capital */}
          <div className="text-right md:border-l md:border-line md:pl-4">
            <p className="text-[11px] uppercase tracking-wider text-d-text-muted">
              Final capital
            </p>
            <p className="font-mono text-[22px] font-semibold text-d-text-primary tabular-nums">
              ₹{Math.round(result.final_capital).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-d-text-muted">
              after costs (slippage + brokerage + STT)
            </p>
          </div>
        </CardBody>
      </Card>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Sharpe" value={result.sharpe_ratio.toFixed(2)} />
        <Metric label="Win rate" value={formatPercent(result.win_rate, 1)} />
        <Metric
          label="Max DD"
          value={`-${Math.abs(result.max_drawdown_pct).toFixed(2)}%`}
          tone="down"
        />
        <Metric label="Trades" value={`${result.total_trades}`} />
        <Metric
          label="Profit factor"
          value={
            Number.isFinite(result.profit_factor)
              ? result.profit_factor.toFixed(2)
              : '∞'
          }
        />
        <Metric
          label="Avg hold"
          value={`${result.avg_hold_days.toFixed(1)}d`}
        />
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
                    `₹${Math.round(v).toLocaleString('en-IN')}`,
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
            <Badge tone="muted">{result.trades.length} trades</Badge>
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {result.trades.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-d-text-muted">
              No trades fired in this window.
            </p>
          ) : (
            <TradeTable trades={result.trades} />
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
