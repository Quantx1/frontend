'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ArrowRight, ShieldAlert, ShieldCheck } from '@/lib/icons'
import { api } from '@/lib/api'
import {
  Card,
  CardBody,
  CardHeader,
  EyebrowMono,
  Reveal,
  Skeleton,
  StatCard,
} from '@/components/foundation'
import { fmtINR, fmtSignedINR } from '@/components/managed/format'
import { MONO } from '@/lib/tokens'

/**
 * /risk — unified Risk & Analytics center (dual-mode 2026-06-12).
 *
 * One page for the whole risk picture: deterministic warn-only limit
 * checks (day-loss, single-name >20%, sector >40%, exposure >100%),
 * live concentration by position, and trading analytics. WARN ONLY by
 * design — nothing here blocks, sizes, or gates an order.
 */

/** P&L tone → token class (tri-theme; duotone for numbers only). */
function pnlTone(v: number | null | undefined): string {
  if (v === null || v === undefined || v === 0) return 'text-d-text-primary'
  return v > 0 ? 'text-up' : 'text-down'
}

export default function RiskCenterPage() {
  const { data: risk, isLoading: riskLoading } = useSWR(
    'risk:status',
    () => api.riskStatus().catch(() => null),
    { refreshInterval: 60_000 },
  )
  const { data: pos } = useSWR(
    'risk:positions',
    () => api.positions.getOpen().catch(() => null),
  )
  const { data: stats } = useSWR(
    'risk:stats',
    () => api.user.getStats().catch(() => null),
  )

  const positions = pos?.positions ?? []
  const capital = risk?.capital || 0
  const weights = positions
    .map((p) => ({
      symbol: p.symbol,
      value: (p.quantity || 0) * (p.current_price || p.average_price || 0),
    }))
    .filter((w) => w.value > 0)
    .sort((a, b) => b.value - a.value)

  // Day-loss meter: how much of the daily limit is used.
  const limitAmt =
    risk?.daily_loss_limit_pct && capital > 0
      ? (capital * risk.daily_loss_limit_pct) / 100
      : null
  const lossUsed =
    limitAmt && risk && risk.day_pnl < 0
      ? Math.min(100, (Math.abs(risk.day_pnl) / limitAmt) * 100)
      : 0

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <Reveal>
        <header className="space-y-1">
          <EyebrowMono>Risk engine</EyebrowMono>
          <h1 className="font-display text-xl font-normal text-d-text-primary">
            Risk &amp; Analytics
          </h1>
          <p className="text-xs text-d-text-muted">
            The risk engine watches your book in real time: drawdown-aware limit
            checks, live concentration and performance in one place. Warnings keep
            you informed; they never block your orders.
          </p>
        </header>
      </Reveal>

      {riskLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-52 w-full rounded-sm" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* ── Limits & flags ───────────────────────────────────────── */}
          <Reveal delay={0.05}>
          <Card>
            <CardHeader>Risk gates today</CardHeader>
            <CardBody className="space-y-3">
              {!risk ? (
                <p className="text-sm text-d-text-muted">Couldn&apos;t load your risk status.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    {risk.ok ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-up" />
                        <span className="font-medium text-d-text-primary">All gates clear</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 text-warning" />
                        <span className="font-medium text-warning">
                          {risk.warnings.length} active warning{risk.warnings.length > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1 border-t border-line pt-2">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-d-text-muted">Today&apos;s P&amp;L</span>
                      <span className={`font-semibold ${MONO} ${pnlTone(risk.day_pnl)}`}>
                        {fmtSignedINR(risk.day_pnl)}
                        {risk.daily_loss_limit_pct != null && (
                          <span className="ml-1 font-normal text-d-text-muted">
                            / limit {risk.daily_loss_limit_pct}%
                          </span>
                        )}
                      </span>
                    </div>
                    {limitAmt != null && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-wrap-hover">
                        <div
                          className={`h-full rounded-full ${lossUsed >= 80 ? 'bg-down' : lossUsed >= 50 ? 'bg-warning' : 'bg-up'}`}
                          style={{ width: `${Math.max(lossUsed, 2)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {risk.warnings.length > 0 && (
                    <ul className="space-y-1.5 border-t border-line pt-2">
                      {risk.warnings.map((w) => (
                        <li
                          key={w.key}
                          className={`text-xs ${w.severity === 'high' ? 'text-down' : 'text-warning'}`}
                        >
                          {w.message}
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="border-t border-line pt-2 text-[11px] text-d-text-muted">
                    Checks: day loss vs your {risk.risk_profile ?? 'default'} profile limit ·
                    single name &gt;20% · sector &gt;40% · exposure &gt;100% of capital.
                  </p>
                </>
              )}
            </CardBody>
          </Card>
          </Reveal>

          {/* ── Concentration ────────────────────────────────────────── */}
          <Reveal delay={0.1}>
          <Card>
            <CardHeader>Concentration watch</CardHeader>
            <CardBody>
              {weights.length === 0 ? (
                <p className="text-sm text-d-text-muted">
                  No open positions yet. Concentration is tracked live as you build the book.
                </p>
              ) : (
                <ul className="space-y-2">
                  {weights.slice(0, 8).map((w) => {
                    const pct = capital > 0 ? (w.value / capital) * 100 : 0
                    return (
                      <li key={w.symbol}>
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-medium text-d-text-primary">{w.symbol}</span>
                          <span className={`${MONO} ${pct > 20 ? 'font-semibold text-warning' : 'text-d-text-muted'}`}>
                            {pct.toFixed(1)}% · {fmtINR(w.value)}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-wrap-hover">
                          <div
                            className={`h-full rounded-full ${pct > 20 ? 'bg-warning' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, Math.max(pct, 1.5))}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
          </Reveal>
        </div>
      )}

      {/* ── Analytics ───────────────────────────────────────────────── */}
      <Reveal delay={0.15}>
      <section className="space-y-3">
        <CardHeader className="rounded-sm border border-line bg-wrap">Performance</CardHeader>
        {!stats ? (
          <Card>
            <CardBody>
              <p className="text-sm text-d-text-muted">No trading stats yet. Your record builds as trades close.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Win rate"
              value={stats.total_trades > 0 ? `${Math.round(stats.win_rate)}%` : '—'}
            />
            <StatCard label="Trades" value={String(stats.total_trades)} />
            <StatCard
              label="Total P&L"
              value={
                <span className={pnlTone(stats.total_pnl)}>
                  {fmtSignedINR(stats.total_pnl)}
                </span>
              }
            />
            <StatCard
              label="Unrealized"
              value={
                <span className={pnlTone(stats.unrealized_pnl)}>
                  {fmtSignedINR(stats.unrealized_pnl)}
                </span>
              }
            />
          </div>
        )}
        <div className="flex flex-wrap gap-4 border-t border-line pt-3 text-xs">
          <Link href="/trades" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Trade journal &amp; behaviour insights <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/proof?tab=track-record" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Signal track record <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
      </Reveal>
    </div>
  )
}
