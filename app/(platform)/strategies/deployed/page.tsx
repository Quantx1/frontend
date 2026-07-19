'use client'

/**
 * /strategies/deployed — Live "My deployed strategies" panel (PR-AP).
 *
 * One page that shows every paper/live strategy with:
 *  - live mark-to-market P&L (realized + unrealized)
 *  - open positions per strategy with SL/target levels
 *  - win rate vs the backtest baseline (so the user sees if the
 *    deployed strategy is meeting its historical promise)
 *  - last 6 entries/exits with reasons (stop_loss / target / dsl_exit)
 *  - pause (paper → paused) + resume (paused → paper) toggles
 *
 * Backed by GET /api/strategies/deployed — one round-trip with
 * everything pre-aggregated server-side.
 */

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  ArrowUpRight,
  ChevronRight,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ChangeBadge,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

const SWR_OPTS = {
  revalidateOnFocus: false,
  refreshInterval: 30_000,  // live-feeling P&L without hammering the backend
  dedupingInterval: 10_000,
  keepPreviousData: true,
}

const fmtInr = (n: number | undefined | null) => {
  if (n == null) return '—'
  const sign = n < 0 ? '-' : n > 0 ? '+' : ''
  return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const fmtPct = (n: number | undefined | null) => {
  if (n == null) return '—'
  const sign = n < 0 ? '' : '+'
  return `${sign}${n.toFixed(1)}%`
}

const UNIVERSE_LABEL: Record<string, string> = {
  single: 'Single symbol',
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
}

const REASON_LABEL: Record<string, { label: string; tone: 'up' | 'down' | 'neutral' }> = {
  target: { label: 'Target hit', tone: 'up' },
  stop_loss: { label: 'Stop loss', tone: 'down' },
  dsl_exit: { label: 'Exit rule', tone: 'neutral' },
  manual: { label: 'Manual', tone: 'neutral' },
  time: { label: 'Time exit', tone: 'neutral' },
  entry: { label: 'Entry', tone: 'neutral' },
}

export default function DeployedStrategiesPage() {
  const { data, error, isLoading, mutate } = useSWR(
    'strategies:deployed',
    () => api.strategies.deployed(),
    SWR_OPTS,
  )

  const [pausingId, setPausingId] = useState<string | null>(null)

  const handlePause = async (id: string) => {
    setPausingId(id)
    try {
      await api.strategies.transition(id, 'paused')
      toast.success('Strategy paused')
      mutate()
    } catch (e) {
      toast.error('Could not pause', { description: handleApiError(e) })
    } finally {
      setPausingId(null)
    }
  }

  const deployed = data?.deployed ?? []

  // Aggregate header stats
  const total = deployed.reduce(
    (acc, s) => {
      acc.realized += s.stats.realized_pnl
      acc.unrealized += s.stats.unrealized_pnl
      acc.positions += s.stats.open_count
      acc.entries += s.stats.entries_emitted
      acc.exits += s.stats.exits_emitted
      return acc
    },
    { realized: 0, unrealized: 0, positions: 0, entries: 0, exits: 0 },
  )

  return (
    <div className="w-full space-y-5 p-4 md:p-6 xl:px-8">
      <PageHeader
        eyebrow="Strategies"
        title="Deployed strategies"
        description="Live P&L on every paper/live strategy. Updates every 30s."
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => mutate()}
              aria-label="Refresh"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-1 hidden sm:inline">Refresh</span>
            </Button>
            <Link href="/strategies">
              <Button variant="secondary">
                <Plus className="mr-1 h-4 w-4" />
                Browse catalog
              </Button>
            </Link>
          </>
        }
      />

      {/* ─── Header KPIs ─── */}
      <section
        aria-label="Aggregate deployment stats"
        className="grid grid-cols-2 gap-3 md:grid-cols-5"
      >
        <StatCard
          label="Total P&L"
          value={
            <span className={total.realized + total.unrealized >= 0 ? 'text-up' : 'text-down'}>
              {fmtInr(total.realized + total.unrealized)}
            </span>
          }
          loading={isLoading}
        />
        <StatCard
          label="Realized"
          value={
            <span className={total.realized >= 0 ? 'text-up' : 'text-down'}>
              {fmtInr(total.realized)}
            </span>
          }
          loading={isLoading}
        />
        <StatCard
          label="Unrealized"
          value={
            <span className={total.unrealized >= 0 ? 'text-up' : 'text-down'}>
              {fmtInr(total.unrealized)}
            </span>
          }
          loading={isLoading}
        />
        <StatCard
          label="Open positions"
          value={String(total.positions)}
          loading={isLoading}
        />
        <StatCard
          label="Active strategies"
          value={String(deployed.length)}
          loading={isLoading}
        />
      </section>

      {/* ─── List ─── */}
      {error ? (
        <Card className="border-down/40 bg-down/5">
          <CardBody>
            <p className="text-sm text-down">
              Could not load deployed strategies — {handleApiError(error)}
            </p>
          </CardBody>
        </Card>
      ) : isLoading && deployed.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} w="100%" h="200px" />
          ))}
        </div>
      ) : deployed.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="No deployed strategies yet"
          description="Promote a strategy from your drafts or pick one from the catalog to start. Once deployed, it'll show up here with live P&L."
          action={
            <Link href="/strategies">
              <Button>Browse strategies</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {deployed.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              onPause={() => handlePause(s.id)}
              pausing={pausingId === s.id}
            />
          ))}
        </div>
      )}

      <DisclaimerFooter />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Per-strategy card
// ─────────────────────────────────────────────────────────────────────

type DeployedStrategy = NonNullable<
  Awaited<ReturnType<typeof api.strategies.deployed>>['deployed'][number]
>

function StrategyCard({
  strategy: s,
  onPause,
  pausing,
}: {
  strategy: DeployedStrategy
  onPause: () => void
  pausing: boolean
}) {
  const totalPnl = s.stats.total_pnl
  const wrDelta =
    s.stats.win_rate_pct != null && s.backtest_win_rate_pct != null
      ? s.stats.win_rate_pct - s.backtest_win_rate_pct
      : null

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <Badge tone={s.status === 'live' ? 'down' : 'primary'} className="uppercase">
            {s.status}
          </Badge>
          <span className="truncate font-semibold text-d-text-primary">
            {s.name}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            disabled={pausing}
            aria-label="Pause strategy"
          >
            {pausing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            <span className="ml-1 hidden text-xs sm:inline">Pause</span>
          </Button>
          <Link href={`/strategies/mine/${s.id}`}>
            <Button variant="ghost" size="sm" aria-label="Open strategy">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </span>
      </CardHeader>

      <CardBody className="space-y-4 p-0">
        {/* P&L hero row */}
        <div className="grid grid-cols-3 gap-px bg-line/40 px-0">
          <Cell
            label="Total P&L"
            value={fmtInr(totalPnl)}
            sub={`${fmtPct((totalPnl / 100000) * 100)} of ₹1L`}
            tone={totalPnl >= 0 ? 'up' : 'down'}
          />
          <Cell
            label="Realized"
            value={fmtInr(s.stats.realized_pnl)}
            sub={`${s.stats.exits_emitted} exits`}
            tone={s.stats.realized_pnl >= 0 ? 'up' : 'down'}
          />
          <Cell
            label="Unrealized"
            value={fmtInr(s.stats.unrealized_pnl)}
            sub={`${s.stats.open_count} open`}
            tone={s.stats.unrealized_pnl >= 0 ? 'up' : 'down'}
          />
        </div>

        {/* Universe + win rate vs backtest */}
        <div className="grid grid-cols-2 gap-3 px-4 text-[12px] md:grid-cols-4">
          <Meta label="Universe" value={UNIVERSE_LABEL[s.universe] ?? s.universe} />
          <Meta
            label="Win rate"
            value={
              s.stats.win_rate_pct != null
                ? `${s.stats.win_rate_pct.toFixed(1)}%`
                : '— no closed trades'
            }
            sub={
              wrDelta != null
                ? `${wrDelta >= 0 ? '+' : ''}${wrDelta.toFixed(1)}pp vs backtest`
                : s.backtest_win_rate_pct != null
                  ? `Backtest: ${s.backtest_win_rate_pct.toFixed(1)}%`
                  : undefined
            }
            sub_tone={
              wrDelta == null ? 'neutral' : wrDelta >= 0 ? 'up' : 'down'
            }
          />
          <Meta
            label="Stop loss"
            value={s.stop_loss_pct != null ? `${s.stop_loss_pct}%` : '—'}
          />
          <Meta
            label="Target"
            value={s.take_profit_pct != null ? `${s.take_profit_pct}%` : '—'}
          />
        </div>

        {/* Open positions */}
        {s.open_positions.length > 0 ? (
          <div className="mx-4 mt-2 overflow-hidden rounded-md border border-line">
            <div className="grid grid-cols-12 gap-2 border-b border-line bg-wrap/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
              <span className="col-span-3">Symbol</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Entry</span>
              <span className="col-span-2 text-right">LTP</span>
              <span className="col-span-3 text-right">P&L</span>
            </div>
            {s.open_positions.map((p) => {
              const pnlTone = p.unrealized_pnl >= 0 ? 'text-up' : 'text-down'
              return (
                <Link
                  key={p.id}
                  href={stockHref(p.symbol)}
                  className="grid grid-cols-12 items-center gap-2 border-b border-line/60 px-3 py-1.5 text-xs last:border-b-0 hover:bg-wrap-hover"
                >
                  <span className="col-span-3 font-mono font-medium text-d-text-primary">
                    {p.symbol}
                    <ArrowUpRight className="ml-1 inline h-2.5 w-2.5 text-d-text-muted" />
                  </span>
                  <span className="col-span-2 text-right font-mono tabular-nums text-d-text-secondary">
                    {p.quantity}
                  </span>
                  <span className="col-span-2 text-right font-mono tabular-nums text-d-text-muted">
                    ₹{p.entry_price.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </span>
                  <span className="col-span-2 text-right font-mono tabular-nums text-d-text-primary">
                    {p.current_price
                      ? `₹${p.current_price.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`
                      : '—'}
                  </span>
                  <span className={`col-span-3 text-right font-mono tabular-nums ${pnlTone}`}>
                    {fmtInr(p.unrealized_pnl)}
                    <span className="ml-1 text-[10px]">({fmtPct(p.unrealized_pnl_pct)})</span>
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mx-4 rounded-md border border-line bg-wrap/40 px-3 py-3 text-center text-xs text-d-text-muted">
            No open positions
          </div>
        )}

        {/* Recent activity */}
        {s.recent_events.length > 0 && (
          <div className="px-4 pb-3">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
              Recent activity
            </p>
            <ul className="space-y-1">
              {s.recent_events.slice(0, 5).map((e, i) => {
                const reasonMeta = REASON_LABEL[e.reason ?? 'entry']
                const ToneIcon = e.kind === 'entry'
                  ? Plus
                  : reasonMeta?.tone === 'up'
                    ? TrendingUp
                    : reasonMeta?.tone === 'down'
                      ? TrendingDown
                      : Target
                const tone =
                  e.kind === 'entry'
                    ? 'text-primary'
                    : reasonMeta?.tone === 'up'
                      ? 'text-up'
                      : reasonMeta?.tone === 'down'
                        ? 'text-down'
                        : 'text-d-text-muted'
                return (
                  <li key={i} className="flex items-center gap-2 text-[12px]">
                    <ToneIcon className={`h-3 w-3 ${tone}`} aria-hidden="true" />
                    <span className="font-mono text-d-text-secondary">
                      {e.kind === 'entry' ? 'Entry' : reasonMeta?.label ?? 'Exit'}
                    </span>
                    <span className="font-mono font-medium text-d-text-primary">
                      {e.symbol}
                    </span>
                    <span className="font-mono text-d-text-muted">
                      @ ₹{e.price.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </span>
                    {e.at && (
                      <span className="ml-auto text-[10px] text-d-text-muted">
                        {new Date(e.at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function Cell({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'up' | 'down' | 'neutral'
}) {
  const cls =
    tone === 'up'
      ? 'text-up'
      : tone === 'down'
        ? 'text-down'
        : 'text-d-text-primary'
  return (
    <div className="bg-wrap p-3">
      <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${cls}`}>
        {value}
      </p>
      {sub && (
        <p className="truncate font-mono text-[10px] text-d-text-muted">{sub}</p>
      )}
    </div>
  )
}

function Meta({
  label,
  value,
  sub,
  sub_tone = 'neutral',
}: {
  label: string
  value: string
  sub?: string
  sub_tone?: 'up' | 'down' | 'neutral'
}) {
  const subCls =
    sub_tone === 'up'
      ? 'text-up'
      : sub_tone === 'down'
        ? 'text-down'
        : 'text-d-text-muted'
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className="font-mono text-xs font-medium tabular-nums text-d-text-primary">
        {value}
      </p>
      {sub && <p className={`font-mono text-[10px] tabular-nums ${subCls}`}>{sub}</p>}
    </div>
  )
}
