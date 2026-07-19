'use client'

/**
 * /strategies/mine/[id] — user strategy detail.
 *
 * Shows the DSL, status, last backtest summary, and an inline backtest
 * runner. Transition controls (promote / pause / archive) live here too,
 * mirroring the list-row buttons on /strategies (My strategies tab).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, ChevronLeft, Globe, PlayCircle, Radio, Target } from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  EmptyState,
  Input,
  NumericInput,
  PageHeader,
  Select,
  Skeleton,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import type {
  DSLBacktestResult,
  UserStrategy,
} from '@/types/strategies'
import BacktestAIRead from '@/components/strategies/BacktestAIRead'
import { BacktestViewer } from '@/components/strategies/BacktestViewer'
import { DSLPreview } from '@/components/strategies/DSLPreview'
import { UniverseBacktestResults } from '@/components/strategies/UniverseBacktestResults'

type UniverseValue =
  | 'single' | 'nifty50' | 'nifty100' | 'nifty500'
  | 'sector:IT' | 'sector:BANK' | 'sector:AUTO' | 'sector:PHARMA'
  | 'sector:FMCG' | 'sector:METAL' | 'sector:ENERGY' | 'sector:INFRA'

const UNIVERSE_OPTIONS: Array<{ value: UniverseValue; label: string; hint: string }> = [
  { value: 'single', label: 'Single symbol', hint: '1 stock at a time' },
  { value: 'nifty50', label: 'NIFTY 50', hint: 'Top 50 large-caps' },
  { value: 'nifty100', label: 'NIFTY 100', hint: 'Large + select mid-cap' },
  { value: 'nifty500', label: 'NIFTY 500', hint: 'Broad market' },
  { value: 'sector:IT', label: 'IT Sector', hint: '10 stocks · TCS, INFY, …' },
  { value: 'sector:BANK', label: 'Banking', hint: '10 banks · HDFCBANK, ICICI, …' },
  { value: 'sector:AUTO', label: 'Auto', hint: 'MARUTI, M&M, TATAMOTORS, …' },
  { value: 'sector:PHARMA', label: 'Pharma', hint: 'SUNPHARMA, DRREDDY, CIPLA, …' },
  { value: 'sector:FMCG', label: 'FMCG', hint: 'HUL, ITC, NESTLE, …' },
  { value: 'sector:METAL', label: 'Metals', hint: 'TATASTEEL, JSW, HINDALCO, …' },
  { value: 'sector:ENERGY', label: 'Energy', hint: 'RELIANCE, ONGC, BPCL, …' },
  { value: 'sector:INFRA', label: 'Infrastructure', hint: 'LT, ULTRACEMCO, ADANIPORTS, …' },
]

type UniverseResult = Awaited<ReturnType<typeof api.strategies.backtestUniverse>>

const STATUS_TONE: Record<
  UserStrategy['status'],
  'up' | 'down' | 'warning' | 'muted' | 'primary'
> = {
  draft: 'muted',
  backtest: 'muted',
  paper: 'primary',
  live: 'up',
  paused: 'warning',
  archived: 'muted',
}

export default function UserStrategyDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const [strategy, setStrategy] = useState<UserStrategy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Backtest form
  const [btMode, setBtMode] = useState<'single' | 'universe'>('single')
  const [btSymbol, setBtSymbol] = useState('RELIANCE')
  const [btUniverse, setBtUniverse] = useState<UniverseValue>('nifty50')
  const [btLookback, setBtLookback] = useState(180)
  const [btCapital, setBtCapital] = useState(500_000)
  const [btPerSymbol, setBtPerSymbol] = useState(100_000)
  const [btMaxSymbols, setBtMaxSymbols] = useState(30)
  const [btResult, setBtResult] = useState<DSLBacktestResult | null>(null)
  const [btUniverseResult, setBtUniverseResult] = useState<UniverseResult | null>(null)
  const [btError, setBtError] = useState<string | null>(null)
  const [btRunning, setBtRunning] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const r = await api.strategies.get(id)
      setStrategy(r.strategy)
      if (r.strategy.dsl.symbol) setBtSymbol(r.strategy.dsl.symbol)
      if (r.strategy.dsl.lookback_days)
        setBtLookback(r.strategy.dsl.lookback_days)
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  // ── State for the live-deploy confirmation modal (PR-AR.3) ──
  // Promoting paper → live is gated by a real-money confirmation. The
  // user must type the exact strategy name as a friction step to
  // prevent click-through deployments.
  const [liveConfirmOpen, setLiveConfirmOpen] = useState(false)
  const [liveConfirmText, setLiveConfirmText] = useState('')
  const [liveAcked, setLiveAcked] = useState(false)

  const transition = async (to: UserStrategy['status']) => {
    if (!strategy) return
    setBusy(true)
    try {
      const r = await api.strategies.transition(strategy.id, to)
      setStrategy(r.strategy)
      toast.success(`Moved to ${to}`)
    } catch (e) {
      toast.error('Transition failed', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  const confirmAndPromoteLive = async () => {
    if (!strategy) return
    if (liveConfirmText.trim() !== strategy.name.trim() || !liveAcked) return
    setLiveConfirmOpen(false)
    setLiveConfirmText('')
    setLiveAcked(false)
    await transition('live')
  }

  const archive = async () => {
    if (!strategy) return
    if (!confirm(`Archive "${strategy.name}"?`)) return
    setBusy(true)
    try {
      await api.strategies.archive(strategy.id)
      toast.success('Strategy archived')
      router.push('/strategies')
    } catch (e) {
      toast.error('Archive failed', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  const runBacktest = async () => {
    if (!strategy) return
    setBtRunning(true)
    setBtError(null)
    setBtResult(null)
    setBtUniverseResult(null)
    try {
      if (btMode === 'universe') {
        const r = await api.strategies.backtestUniverse(strategy.id, {
          universe: btUniverse,
          lookback_days: btLookback,
          initial_capital_per_symbol: btPerSymbol,
          max_symbols: btMaxSymbols,
        })
        setBtUniverseResult(r)
        load()
        return
      }
      const r = await api.strategies.backtest(strategy.id, {
        symbol: btSymbol.trim().toUpperCase(),
        lookback_days: btLookback,
        initial_capital: btCapital,
      })
      setBtResult(r)
      load()
    } catch (e) {
      setBtError(handleApiError(e))
    } finally {
      setBtRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton w="40%" h="32px" />
        <Skeleton w="100%" h="200px" />
      </div>
    )
  }

  if (error || !strategy) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <EmptyState
          tone="error"
          icon={<ChevronLeft className="h-6 w-6" />}
          title="Could not load strategy"
          description={error || 'Strategy not found.'}
          action={
            <Button onClick={() => router.push('/strategies')}>
              Back to strategies
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className="truncate">{strategy.name}</span>
            <Badge tone={STATUS_TONE[strategy.status]}>{strategy.status}</Badge>
          </span> as unknown as string
        }
        description={strategy.description || 'DSL strategy detail'}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {strategy.status === 'draft' && (
              <Button onClick={() => transition('paper')} disabled={busy}>
                Promote to paper
              </Button>
            )}
            {strategy.status === 'paper' && (
              <>
                <Button
                  onClick={() => setLiveConfirmOpen(true)}
                  disabled={busy}
                  className="bg-down/90 hover:bg-down text-white"
                >
                  <Radio className="mr-1 h-4 w-4" />
                  Promote to live
                </Button>
                <Button onClick={() => transition('paused')} variant="secondary" disabled={busy}>
                  Pause
                </Button>
              </>
            )}
            {strategy.status === 'live' && (
              <Button onClick={() => transition('paused')} variant="secondary" disabled={busy}>
                Pause
              </Button>
            )}
            {strategy.status === 'paused' && (
              <Button onClick={() => transition('paper')} disabled={busy}>
                Resume
              </Button>
            )}
            {strategy.status !== 'archived' && (
              <Button onClick={archive} variant="ghost" disabled={busy}>
                Archive
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <Link
          href="/strategies"
          className="inline-flex items-center gap-1 text-xs text-d-text-muted transition-colors hover:text-d-text-primary"
        >
          <ChevronLeft className="h-3 w-3" />
          All strategies
        </Link>

        <DSLPreview dsl={strategy.dsl} />

        {strategy.last_backtest &&
          strategy.last_backtest.sharpe_ratio != null &&
          strategy.last_backtest.total_return_pct != null &&
          !btResult && (
            <Card>
              <CardHeader>Last backtest</CardHeader>
              <CardBody>
                <p className="font-mono text-xs text-d-text-muted">
                  {strategy.last_backtest.symbol ?? '—'} ·{' '}
                  {strategy.last_backtest.start_date ?? '—'} →{' '}
                  {strategy.last_backtest.end_date ?? '—'} · Sharpe{' '}
                  {strategy.last_backtest.sharpe_ratio.toFixed(2)} · Win{' '}
                  {strategy.last_backtest.win_rate != null
                    ? `${(strategy.last_backtest.win_rate * 100).toFixed(0)}%`
                    : '—'}{' '}
                  · Return{' '}
                  {strategy.last_backtest.total_return_pct >= 0 ? '+' : ''}
                  {strategy.last_backtest.total_return_pct.toFixed(2)}%
                </p>
              </CardBody>
            </Card>
          )}

        <Card>
          <CardHeader>
            <span className="flex items-center justify-between gap-3">
              <span>Run a backtest</span>
              <div className="inline-flex rounded-md border border-line p-0.5">
                <button
                  type="button"
                  onClick={() => setBtMode('single')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-md transition-colors ${
                    btMode === 'single'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-d-text-secondary hover:text-d-text-primary'
                  }`}
                >
                  <Target className="h-3 w-3" />
                  Single symbol
                </button>
                <button
                  type="button"
                  onClick={() => setBtMode('universe')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-md transition-colors ${
                    btMode === 'universe'
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-d-text-secondary hover:text-d-text-primary'
                  }`}
                >
                  <Globe className="h-3 w-3" />
                  Universe
                </button>
              </div>
            </span>
          </CardHeader>
          <CardBody className="space-y-3">
            {btMode === 'single' ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                    Symbol
                  </p>
                  <Input
                    value={btSymbol}
                    onChange={(e) => setBtSymbol(e.target.value)}
                    placeholder="RELIANCE"
                    aria-label="Backtest symbol"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                    Lookback (days)
                  </p>
                  <NumericInput
                    value={btLookback}
                    onChange={(v) => setBtLookback(v ?? 180)}
                    min={30}
                    max={730}
                    step={30}
                    aria-label="Backtest lookback days"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                    Initial capital (₹)
                  </p>
                  <NumericInput
                    value={btCapital}
                    onChange={(v) => setBtCapital(v ?? 500_000)}
                    min={10_000}
                    max={100_000_000}
                    step={50_000}
                    aria-label="Initial capital"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                    Universe
                  </p>
                  <select
                    value={btUniverse}
                    onChange={(e) => setBtUniverse(e.target.value as UniverseValue)}
                    className="w-full rounded-md border border-line bg-main px-3 py-2 text-sm text-d-text-primary focus:border-primary focus:outline-none"
                    aria-label="Backtest universe"
                  >
                    {UNIVERSE_OPTIONS.filter((o) => o.value !== 'single').map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label} — {o.hint}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                      Per-symbol capital (₹)
                    </p>
                    <NumericInput
                      value={btPerSymbol}
                      onChange={(v) => setBtPerSymbol(v ?? 100_000)}
                      min={10_000}
                      max={10_000_000}
                      step={10_000}
                      aria-label="Per-symbol capital"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                      Lookback (days)
                    </p>
                    <NumericInput
                      value={btLookback}
                      onChange={(v) => setBtLookback(v ?? 180)}
                      min={30}
                      max={730}
                      step={30}
                      aria-label="Backtest lookback days"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                      Max symbols
                    </p>
                    <NumericInput
                      value={btMaxSymbols}
                      onChange={(v) => setBtMaxSymbols(v ?? 30)}
                      min={1}
                      max={200}
                      step={10}
                      aria-label="Max symbols"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-d-text-muted">
                  Total capital = ₹{(btPerSymbol * btMaxSymbols).toLocaleString('en-IN')}.
                  Universe runs on up to {btMaxSymbols} stocks in parallel (5 at a
                  time) — typically 30-90 seconds. Strategy will trade on all of
                  these when promoted to paper / live.
                </p>
              </div>
            )}

            {btError && (
              <p className="rounded-md border border-down/40 bg-down/10 px-3 py-2 text-xs text-down">
                {btError}
              </p>
            )}

            <div className="flex items-center justify-end">
              <Button
                onClick={runBacktest}
                disabled={btRunning || (btMode === 'single' && !btSymbol.trim())}
              >
                <PlayCircle className="mr-1 h-3.5 w-3.5" />
                {btRunning
                  ? btMode === 'universe'
                    ? `Running ${btMaxSymbols} symbols…`
                    : 'Running…'
                  : btMode === 'universe'
                    ? 'Run universe backtest'
                    : 'Run backtest'}
              </Button>
            </div>
          </CardBody>
        </Card>

        {btUniverseResult && (
          <UniverseBacktestResults
            universe={btUniverseResult.universe}
            lookback_days={btUniverseResult.lookback_days}
            symbols_attempted={btUniverseResult.symbols_attempted}
            aggregate={btUniverseResult.aggregate}
            results={btUniverseResult.results}
            skipped={btUniverseResult.skipped}
            failed={btUniverseResult.failed}
          />
        )}

        {btResult && <BacktestViewer result={btResult} />}

        {(strategy.last_backtest || btResult) && (
          <BacktestAIRead strategyId={strategy.id} />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PR-AR.3 — Live-deploy confirmation modal.
          Friction layer before paper → live transition. Requires the
          user to type the exact strategy name + check the ack box.
         ─────────────────────────────────────────────────────────── */}
      <Dialog
        open={liveConfirmOpen}
        onClose={() => {
          setLiveConfirmOpen(false)
          setLiveConfirmText('')
          setLiveAcked(false)
        }}
        title="Promote to live — real money will move"
        className="!max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-md border border-down/30 bg-down/5 p-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-down" aria-hidden="true" />
            <div className="space-y-1 text-xs text-d-text-secondary">
              <p className="font-semibold text-d-text-primary">
                This is not paper trading.
              </p>
              <p>
                Once promoted, the strategy runner fires <b>real broker orders</b> on
                your connected broker account every time the entry condition matches.
                Stop-loss and target levels are placed as GTT orders at the broker
                (Zerodha) or monitored every 5 min during market hours (others).
              </p>
            </div>
          </div>

          {/* Strategy summary — equity vs OPTIONS shape differs enough
              that we render two distinct sections (PR-AW.1). */}
          {(strategy?.dsl as any)?.instrument_segment === 'OPTIONS' ? (
            <OptionsRiskSummary dsl={(strategy?.dsl as any) ?? {}} name={strategy?.name ?? '—'} />
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <SummaryLine label="Strategy" value={strategy?.name ?? '—'} />
              <SummaryLine
                label="Universe"
                value={
                  (strategy?.dsl as any)?.universe === 'single'
                    ? `Single — ${(strategy?.dsl as any)?.symbol ?? '?'}`
                    : (strategy?.dsl as any)?.universe ?? '—'
                }
              />
              <SummaryLine
                label="Stop loss"
                value={
                  (strategy?.dsl as any)?.stop_loss_pct
                    ? `${(strategy?.dsl as any).stop_loss_pct}%`
                    : 'Not set — DSL exit only'
                }
              />
              <SummaryLine
                label="Target"
                value={
                  (strategy?.dsl as any)?.take_profit_pct
                    ? `${(strategy?.dsl as any).take_profit_pct}%`
                    : 'Not set'
                }
              />
              <SummaryLine
                label="Day-loss breaker"
                value={
                  (strategy as any)?.max_daily_loss_pct
                    ? `${(strategy as any).max_daily_loss_pct}% (custom)`
                    : '3% (platform default)'
                }
              />
              <SummaryLine
                label="Position size"
                value={`${(strategy?.dsl as any)?.position_size ?? 5}% of capital`}
              />
            </div>
          )}

          {/* Friction step 1 — typed confirmation of strategy name */}
          <div className="space-y-1">
            <label htmlFor="live-confirm" className="text-xs font-medium text-d-text-primary">
              Type the strategy name to confirm
            </label>
            <Input
              id="live-confirm"
              value={liveConfirmText}
              onChange={(e) => setLiveConfirmText(e.target.value)}
              placeholder={strategy?.name ?? ''}
              className="font-mono"
            />
          </div>

          {/* Friction step 2 — explicit acknowledgement checkbox */}
          <label className="flex items-start gap-2 text-xs text-d-text-secondary">
            <input
              type="checkbox"
              checked={liveAcked}
              onChange={(e) => setLiveAcked(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line bg-main accent-primary"
            />
            <span>
              I understand real broker orders will fire from this strategy. I
              accept the day-loss circuit breaker will auto-pause the strategy
              on breach, but losses up to that point are mine.
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
            <Button
              variant="ghost"
              onClick={() => {
                setLiveConfirmOpen(false)
                setLiveConfirmText('')
                setLiveAcked(false)
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAndPromoteLive}
              disabled={
                busy ||
                !liveAcked ||
                liveConfirmText.trim() !== strategy?.name.trim()
              }
              className="bg-down/90 hover:bg-down text-white"
            >
              <Radio className="mr-1 h-4 w-4" />
              Go live
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-wrap/60 p-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-xs font-medium text-d-text-primary">
        {value}
      </p>
    </div>
  )
}

/**
 * Options-specific risk summary for the live-deploy modal.
 * Equity strategies have stop/target % + position-size %. Options have:
 *   - per-leg shape (Side × Type × Strike anchor × Expiry × qty_lots)
 *   - max_loss (bounded or unbounded if naked short)
 *   - underlying + lot_size estimate
 */
function OptionsRiskSummary({ dsl, name }: { dsl: any; name: string }) {
  const legs: Array<{
    side: string
    option_type: string
    strike_anchor: string
    strike_offset: number
    expiry: string
    qty_lots: number
  }> = dsl?.legs ?? []
  const symbol = String(dsl?.symbol || 'NIFTY').toUpperCase()
  // Naked-short detection: any SELL leg without a same-type BUY leg
  // hedge → unbounded risk.
  const hasUnboundedRisk = legs.some(
    (l) =>
      String(l.side).toUpperCase() === 'SELL' &&
      !legs.some(
        (o) =>
          String(o.option_type).toUpperCase() === String(l.option_type).toUpperCase() &&
          String(o.side).toUpperCase() === 'BUY',
      ),
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <SummaryLine label="Strategy" value={name} />
        <SummaryLine label="Underlying" value={symbol} />
        <SummaryLine label="Total legs" value={String(legs.length)} />
        <SummaryLine
          label="Max risk"
          value={hasUnboundedRisk ? 'UNBOUNDED (naked short)' : 'Bounded (debit/credit spread)'}
        />
      </div>

      <div className="rounded-md border border-line bg-wrap/60">
        <div className="grid grid-cols-12 gap-2 border-b border-line bg-wrap/80 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
          <span className="col-span-2">Side</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-4">Strike anchor</span>
          <span className="col-span-2 text-right">Expiry</span>
          <span className="col-span-2 text-right">Lots</span>
        </div>
        {legs.map((l, i) => {
          const sideU = String(l.side).toUpperCase()
          const sideTone = sideU === 'BUY' ? 'text-up' : 'text-down'
          const anchorText =
            l.strike_anchor === 'ATM'
              ? 'ATM'
              : `${l.strike_anchor.replace('ATM_', 'ATM').replace('_N', '')}${l.strike_offset > 0 ? `+${l.strike_offset}` : l.strike_offset}`
          return (
            <div
              key={i}
              className="grid grid-cols-12 items-center gap-2 border-b border-line/60 px-3 py-1.5 font-mono text-[11px] last:border-b-0"
            >
              <span className={`col-span-2 font-semibold ${sideTone}`}>{sideU}</span>
              <span className="col-span-2">{String(l.option_type).toUpperCase()}</span>
              <span className="col-span-4 text-d-text-secondary">{anchorText}</span>
              <span className="col-span-2 text-right text-d-text-muted">{l.expiry}</span>
              <span className="col-span-2 text-right tabular-nums">{l.qty_lots}</span>
            </div>
          )
        })}
      </div>

      {hasUnboundedRisk && (
        <div className="flex gap-2 rounded-md border border-down/40 bg-down/10 p-2 text-[11px] text-down">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <b>Naked short leg detected.</b> Loss is unbounded if the underlying
            moves sharply against the position. The day-loss breaker still
            triggers, but you can lose much more than the entry credit before
            it fires.
          </span>
        </div>
      )}

      <p className="text-[10px] text-d-text-muted">
        Lot size and per-leg premiums are resolved at order-placement time
        using the broker&rsquo;s live option chain. Estimated margin: see
        the F&amp;O panel after deploy.
      </p>
    </div>
  )
}
