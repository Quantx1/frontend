'use client'

/**
 * /autopilot — F4 flagship dashboard (Elite). Renamed from /auto-trader
 * in PR-C (2026-05-19) to match COCKPIT naming; v1 path 301-redirects.
 *
 * Step 4 §5.3 spec. Four sections top-to-bottom:
 *   1. Status strip       — enabled · paused · broker · regime · VIX band
 *   2. Config card        — risk profile slider + safety rails
 *   3. Recent trades log  — last-7d live auto-trader actions
 *   4. Emergency controls — pause toggle + kill switch
 *
 * Backend surface: ``api.autoTrader.*``. Trades are driven live by the
 * supervised AutoPilot engine (Qlib ranker + HMM regime sizing + VIX
 * overlay) on the daily 15:50 IST rebalance cron.
 *
 * On HTTP 402 tier-gate the platform error-boundary renders the
 * UpgradeModal — nothing extra needed here.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle,
  ExternalLink,
  Gauge,
  PauseCircle,
  PlayCircle,
  Power,
  Settings2,
  ShieldAlert,
  TrendingUp,
  Zap,
} from '@/lib/icons'

import { api } from '@/lib/api'
import { handleApiError } from '@/lib/api'
import BrokerLock from '@/components/broker/BrokerLock'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Skeleton,
  toast,
} from '@/components/foundation'

// 2026-06-12 — removed the stale AUTOPILOT_LIVE_TRADING=false gate. It dated
// from the RL era (RL removed 2026-05-23); the supervised AutoPilot stack
// went LIVE 2026-05-24 and pricing v2 sells it on Pro (Lite) + Elite
// (Unlimited). Paper vs live is now a per-user mode from /status.

type Status = Awaited<ReturnType<typeof api.autoTrader.status>>
type Config = Status['config']
type TradeRow = Awaited<ReturnType<typeof api.autoTrader.trades>>[number]
type Weekly = Awaited<ReturnType<typeof api.autoTrader.weekly>>
type RebalanceRun = Awaited<ReturnType<typeof api.autoTrader.runs>>[number]

const VIX_BAND_COPY: Record<string, { label: string; color: string }> = {
  calm:      { label: 'Calm · VIX <15',       color: 'var(--color-up)' },
  normal:    { label: 'Normal · VIX 15-18',   color: 'var(--color-primary-text)' },
  elevated:  { label: 'Elevated · VIX 18-22', color: 'var(--color-warning)' },
  high:      { label: 'High · VIX 22-27',     color: 'var(--color-warning)' },
  stressed:  { label: 'Stressed · VIX 27-35', color: 'var(--color-down)' },
  panic:     { label: 'Panic · VIX >35',      color: 'color-mix(in srgb, var(--color-down) 78%, black)' },
}

const REGIME_COLORS: Record<string, string> = {
  bull:     'var(--color-up)',
  sideways: 'var(--color-warning)',
  bear:     'var(--color-down)',
}

// Theme-aware TEXT tokens (re-derive per theme, WCAG-tuned for light). The
// hex maps above stay for the faint bg/border tints; the colored TEXT moves
// to these token classes so it reads on the light surface.
const REGIME_TEXT: Record<string, string> = {
  bull:     'text-up',
  sideways: 'text-warning',
  bear:     'text-down',
}

const VIX_BAND_TEXT: Record<string, string> = {
  calm:      'text-up',
  normal:    'text-signature',
  elevated:  'text-warning',
  high:      'text-warning',
  stressed:  'text-down',
  panic:     'text-down',
}


export default function AutoTraderPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status | null>(null)
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [weekly, setWeekly] = useState<Weekly | null>(null)
  const [runs, setRuns] = useState<RebalanceRun[]>([])
  // PR 133 — today's plan + diagnostics; nullable until first /plan/today fetch.
  const [todayPlan, setTodayPlan] = useState<Awaited<ReturnType<typeof api.autoTrader.todayPlan>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [killing, setKilling] = useState(false)
  const [killConfirmOpen, setKillConfirmOpen] = useState(false)
  const [goLiveOpen, setGoLiveOpen] = useState(false)
  const [savingCfg, setSavingCfg] = useState(false)
  const [draftCfg, setDraftCfg] = useState<Config | null>(null)
  const [compliance, setCompliance] = useState<Awaited<ReturnType<typeof api.autoTrader.compliance>> | null>(null)

  // ``silent`` = background poll: refresh live data without flashing the loading
  // skeleton, and WITHOUT clobbering the user's in-progress config edits
  // (draftCfg is re-synced only on the initial load / after a save).
  const refresh = async (silent = false) => {
    try {
      const [s, t, w, r, p] = await Promise.all([
        api.autoTrader.status(),
        api.autoTrader.trades(7).catch(() => []),
        api.autoTrader.weekly().catch(() => null),
        api.autoTrader.runs(10).catch(() => []),
        api.autoTrader.todayPlan().catch(() => null),
      ])
      setStatus(s)
      if (!silent) setDraftCfg(s.config)
      setTrades(t || [])
      setWeekly(w)
      setRuns(r || [])
      setTodayPlan(p)
      setError(null)
    } catch (err) {
      if (!silent) setError(handleApiError(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    api.autoTrader.compliance().then(setCompliance).catch(() => {})
  }, [])

  // Live dashboard — poll every 20s so trades/positions/regime appear without a
  // manual reload. Silent, and skipped while the tab is hidden.
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) refresh(true)
    }, 20_000)
    return () => clearInterval(id)
  }, [])

  const onToggle = async () => {
    if (!status) return
    setToggling(true)
    try {
      await api.autoTrader.toggle(!status.enabled)
      await refresh()
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setToggling(false)
    }
  }

  // Pricing v2 — explicit paper↔live switch. Going live is confirmed in a
  // modal (real money); back to paper is one click (the safe direction).
  const onGoLive = async () => {
    if (!status) return
    setToggling(true)
    try {
      await api.autoTrader.toggle(status.enabled, 'live')
      await refresh()
      toast.success('AutoPilot is live. Orders now fire on your broker account.')
    } catch (err) {
      // Backend gates live on the suitability quiz (403 + detail.code) — route
      // the user there instead of surfacing a raw error.
      const detail = (err as { detail?: unknown })?.detail
      const info = detail && typeof detail === 'object' ? (detail as { code?: string; next_url?: string }) : null
      if (info?.code === 'suitability_quiz_required') {
        setGoLiveOpen(false)
        toast.error('One step first', { description: 'Complete the quick suitability check to enable live trading.' })
        router.push(info.next_url || '/onboarding/risk-quiz')
      } else {
        toast.error('Could not go live', { description: handleApiError(err) })
      }
    } finally {
      setToggling(false)
    }
  }

  const onSwitchToPaper = async () => {
    if (!status) return
    setToggling(true)
    try {
      await api.autoTrader.toggle(status.enabled, 'paper')
      await refresh()
      toast.success('Practice mode on. AutoPilot runs a virtual book only.')
    } catch (err) {
      toast.error('Switch failed', { description: handleApiError(err) })
    } finally {
      setToggling(false)
    }
  }

  const onKillConfirmed = async () => {
    setKillConfirmOpen(false)
    setKilling(true)
    try {
      await api.autoTrader.killSwitch()
      await refresh()
      toast.success('Kill switch engaged. All positions closing.')
    } catch (err) {
      toast.error('Kill switch failed', { description: handleApiError(err) })
    } finally {
      setKilling(false)
    }
  }

  const onSaveConfig = async () => {
    if (!draftCfg) return
    setSavingCfg(true)
    try {
      const updated = await api.autoTrader.updateConfig(draftCfg)
      setStatus((s) => (s ? { ...s, config: updated } : s))
      setDraftCfg(updated)
      toast.success('Settings saved')
    } catch (err) {
      // Revert the draft to the server config so a failed save never leaves
      // stale/dirty values on screen.
      setDraftCfg(status?.config ?? draftCfg)
      toast.error("Couldn't save settings", { description: handleApiError(err) })
    } finally {
      setSavingCfg(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-5 p-4 md:p-6 xl:px-8">
        <Skeleton w="30%" h="32px" />
        <Skeleton w="50%" h="16px" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="80px" />)}
        </div>
        <Skeleton w="100%" h="200px" />
      </div>
    )
  }

  if (error || !status) {
    return (
      <div className="w-full p-4 md:p-6">
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="AutoPilot didn't load"
          description={error || 'Could not reach AutoPilot status. Give it a second and retry.'}
          action={<Button onClick={() => refresh()}>Retry</Button>}
        />
      </div>
    )
  }

  const dirty = draftCfg && JSON.stringify(draftCfg) !== JSON.stringify(status.config)
  const active = status.enabled && !status.paused
  const band = status.vix_band ? VIX_BAND_COPY[status.vix_band] : null

  return (
    <div className="w-full">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>AutoPilot</span>
            {status.mode === 'paper' ? (
              <Badge tone="up">Free · Practice</Badge>
            ) : (
              <Badge tone="warning">Live · Real money</Badge>
            )}
          </span> as unknown as string
        }
        description={
          status.mode === 'paper'
            ? 'Your fully-automated trading bot — free. It scans, buys, manages and exits on a virtual book with no broker needed. Multiple ML engines must agree before a trade fires; regime-aware sizing, VIX-scaled exposure, one rebalance at 15:45 IST. Go live on your own broker (Pro) whenever you’re ready.'
            : 'Autonomous execution on your own broker. Multiple ML engines must agree before a trade fires. Regime-aware sizing, VIX-scaled exposure. One rebalance, 15:45 IST.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/autopilot/track-record"
              className="glass-control inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-primary"
            >
              <Activity className="h-3.5 w-3.5" />
              Track record
              <ExternalLink className="h-3 w-3" />
            </Link>
            <StatusPill active={active} paused={status.paused} enabled={status.enabled} />
          </div>
        }
      />

      <div className="space-y-6 p-4 md:p-6 xl:px-8">

      {/* Mode banner — paper (virtual) vs live (real broker money). The
          paper→live direction always goes through an explicit confirm;
          live→paper is one click (the safe direction). */}
      {status.mode === 'paper' ? (
        <div className="rounded-[20px] border border-primary/40 bg-primary/[0.06] p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div aria-hidden className="tile-tint hidden shrink-0 self-center overflow-hidden p-1 sm:block">
              <Image
                src="/v4/illus/autopilot.png"
                alt=""
                width={72}
                height={72}
                sizes="72px"
                className="h-[72px] w-[72px] rounded-2xl object-cover"
              />
            </div>
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.12] sm:hidden">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-d-text-primary">
                {status.enabled
                  ? 'Practice mode. The bot is running a virtual book.'
                  : 'Practice mode — free. Start the bot and it trades a virtual book for you.'}
              </p>
              <p className="text-[12px] text-d-text-muted mt-1 leading-relaxed">
                Full ML signal stack, daily rebalance, buy/manage/exit — all
                automated, no real money and no broker needed. When you’re ready,
                go live (Pro) and it runs your own broker account inside your plan
                limits. Upgrading never flips this for you.
              </p>
            </div>
            {!status.enabled ? (
              <button
                onClick={onToggle}
                disabled={toggling}
                className="glass-control-accent inline-flex items-center gap-2 self-center rounded-full px-5 py-2 text-[12px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlayCircle className="w-4 h-4" />
                {toggling ? 'Starting…' : 'Start the bot (practice)'}
              </button>
            ) : (
              <button
                onClick={() => setGoLiveOpen(true)}
                disabled={!status.broker_connected || toggling}
                title={!status.broker_connected ? 'Connect a broker first' : undefined}
                className="glass-control inline-flex items-center gap-2 self-center rounded-full px-4 py-2 text-[12px] font-semibold text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlayCircle className="w-4 h-4" />
                {status.broker_connected ? 'Go live (Pro)' : 'Connect broker to go live'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] border border-d-border bg-wrap px-4 py-3">
          <p className="text-[12px] text-d-text-muted">
            <span className="font-medium text-d-text-primary">Live mode.</span> Orders
            fire on your connected broker account, inside your plan limits.
          </p>
          <button
            onClick={onSwitchToPaper}
            disabled={toggling}
            className="text-[12px] font-medium text-primary hover:underline disabled:opacity-60"
          >
            Switch to practice mode (virtual)
          </button>
        </div>
      )}

      {/* ── 1. Status strip ── */}
      <section className="grid grid-cols-2 gap-2 rounded-[20px] border border-d-border bg-wrap p-2 md:grid-cols-5">
        <Cell label="Broker" value={status.broker_connected ? (status.broker_name || '-') : 'Not connected'}
              accentClass={status.broker_connected ? 'text-up' : 'text-down'}
              sub={status.broker_connected ? 'Live' : 'Connect to trade'} />
        <Cell label="Open positions" value={String(status.open_positions)} />
        <Cell label="Today trades" value={String(status.today_trades)} />
        <Cell
          label="Today P&L"
          value={`${status.today_pnl_pct >= 0 ? '+' : ''}${status.today_pnl_pct.toFixed(2)}%`}
          accentClass={status.today_pnl_pct >= 0 ? 'text-up' : 'text-down'}
        />
        <Cell
          label="Last rebalance"
          value={status.last_run_at ? new Date(status.last_run_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
          sub={status.last_run_at ? new Date(status.last_run_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined}
        />
      </section>

      {/* ── Regime + VIX risk overlay ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Panel title="Market Regime" icon={TrendingUp}>
          {status.regime ? (
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, ${REGIME_COLORS[status.regime.name] || 'var(--color-primary)'} 9%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${REGIME_COLORS[status.regime.name] || 'var(--color-primary)'} 21%, transparent)`,
                }}
              >
                <Gauge className={`w-5 h-5 ${REGIME_TEXT[status.regime.name] || 'text-signature'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-d-text-primary capitalize">
                  {status.regime.name}
                </p>
                <p className="text-[11px] text-d-text-muted numeric">
                  bull {(status.regime.prob_bull * 100).toFixed(0)}% ·
                  sideways {(status.regime.prob_sideways * 100).toFixed(0)}% ·
                  bear {(status.regime.prob_bear * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-d-text-muted">Regime read unavailable right now.</p>
          )}
        </Panel>

        <Panel title="VIX Risk Overlay" icon={ShieldAlert}>
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-d-text-primary">
                {band ? band.label : 'VIX data unavailable'}
              </p>
              <p className="text-[11px] text-d-text-muted">
                AutoPilot deploys <span className={`numeric font-semibold ${(status.vix_band && VIX_BAND_TEXT[status.vix_band]) || 'text-signature'}`}>
                  {status.equity_scaler_pct}%
                </span> of equity. The rest stays in cash.
              </p>
            </div>
            <div className="w-24 h-2 bg-main rounded-full overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${status.equity_scaler_pct}%`,
                  background: band?.color || 'var(--color-primary)',
                }}
              />
            </div>
          </div>
        </Panel>
      </section>

      {/* ── 2. Config card ── */}
      {draftCfg && (
        <section className="rounded-[20px] border border-d-border bg-wrap p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-d-text-primary flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Safety Rails
            </h2>
            {dirty && (
              <button
                onClick={onSaveConfig}
                disabled={savingCfg}
                className="glass-control-accent px-4 py-1.5 rounded-full text-[12px] font-semibold active:scale-[0.98] disabled:opacity-60"
              >
                {savingCfg ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>

          {/* Risk profile radio */}
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-wider text-d-text-muted mb-2">Risk profile</label>
            <div className="grid grid-cols-3 gap-2">
              {(['conservative', 'moderate', 'aggressive'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setDraftCfg({ ...draftCfg, risk_profile: p })}
                  className={`px-3 py-2 rounded-full text-[12px] font-medium transition-colors ${
                    draftCfg.risk_profile === p
                      ? 'glass-control-accent'
                      : 'glass-control text-d-text-secondary'
                  }`}
                >
                  <span className="capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SliderField
              label="Max position size"
              sub="% of portfolio per holding"
              value={draftCfg.max_position_pct}
              min={1}
              max={25}
              step={0.5}
              unit="%"
              onChange={(v) => setDraftCfg({ ...draftCfg, max_position_pct: v })}
            />
            <SliderField
              label="Daily loss limit"
              sub="hit this drawdown, AutoPilot pauses"
              value={draftCfg.daily_loss_limit_pct}
              min={0.5}
              max={10}
              step={0.25}
              unit="%"
              onChange={(v) => setDraftCfg({ ...draftCfg, daily_loss_limit_pct: v })}
            />
            <SliderField
              label="Max concurrent positions"
              sub="positions open at once"
              value={draftCfg.max_concurrent_positions}
              min={1}
              max={30}
              step={1}
              unit=""
              onChange={(v) => setDraftCfg({ ...draftCfg, max_concurrent_positions: Math.round(v) })}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-d-border flex items-center justify-between">
            <div>
              <p className="text-[12px] text-d-text-primary font-medium">Allow F&O strategies</p>
              <p className="text-[10px] text-d-text-muted">Let AutoPilot trade options and futures too</p>
            </div>
            <Toggle
              on={draftCfg.allow_fno}
              onChange={(v) => setDraftCfg({ ...draftCfg, allow_fno: v })}
            />
          </div>
        </section>
      )}

      {/* ── Weekly summary ── */}
      {weekly && weekly.trades_closed > 0 && (
        <section className="rounded-[20px] border border-d-border bg-wrap p-5">
          <h2 className="text-[14px] font-semibold text-d-text-primary mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Last 7 days
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[12px]">
            <Stat label="Trades" value={String(weekly.trades_executed)} />
            <Stat label="Closed" value={String(weekly.trades_closed)} />
            <Stat
              label="Win rate"
              value={`${(weekly.win_rate * 100).toFixed(0)}%`}
              accentClass={weekly.win_rate >= 0.5 ? 'text-up' : 'text-warning'}
            />
            <Stat
              label="Return"
              value={`${weekly.total_pnl_pct >= 0 ? '+' : ''}${weekly.total_pnl_pct.toFixed(2)}%`}
              accentClass={weekly.total_pnl_pct >= 0 ? 'text-up' : 'text-down'}
            />
            <Stat
              label="Net P&L"
              value={`₹${(weekly.net_pnl / 1000).toFixed(1)}k`}
              accentClass={weekly.net_pnl >= 0 ? 'text-up' : 'text-down'}
            />
          </div>
        </section>
      )}

      {/* ── PR 69 — Rebalance log: every tick the engine fires, even
              when no trade results. Empty by default until the F4
              FinRL-X scheduler job lands. ── */}
      <section className="rounded-[20px] border border-d-border bg-wrap overflow-hidden">
        <div className="px-5 py-3 border-b border-d-border flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-d-text-primary">Rebalance log · last 10 ticks</h2>
          <span className="text-[10px] uppercase tracking-wider text-d-text-muted">
            Daily 15:45 IST
          </span>
        </div>
        {runs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[12px] text-d-text-muted">
              No ticks yet. Turn AutoPilot on and the ML stack runs the book every weekday at 15:45 IST.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-d-border">
            {runs.map((r) => (
              <RebalanceRow key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>

      {/* ── PR 133 — Today's plan + overlay diagnostics ── */}
      {todayPlan && todayPlan.ran_at && (
        <section className="rounded-[20px] border border-d-border bg-wrap overflow-hidden">
          <div className="px-5 py-3 border-b border-d-border flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-d-text-primary">
              Today&rsquo;s plan
              {todayPlan.regime && (
                <span className="ml-2 text-[11px] text-d-text-muted capitalize">· {todayPlan.regime} regime</span>
              )}
            </h2>
            <span className="text-[11px] text-d-text-muted">
              {new Date(todayPlan.ran_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="p-5 space-y-4">
            {todayPlan.diagnostics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                {typeof todayPlan.diagnostics.vix_level === 'number' && (
                  <Stat label="VIX" value={todayPlan.diagnostics.vix_level.toFixed(2)} />
                )}
                {typeof todayPlan.diagnostics.vix_exposure_cap === 'number' && (
                  <Stat label="VIX exposure cap" value={`${(todayPlan.diagnostics.vix_exposure_cap * 100).toFixed(0)}%`} />
                )}
                {typeof todayPlan.diagnostics.applied_scale === 'number' && (
                  <Stat label="Scale applied" value={`${(todayPlan.diagnostics.applied_scale * 100).toFixed(0)}%`} />
                )}
                {typeof todayPlan.diagnostics.var_95_inr === 'number' && (
                  <Stat
                    label="95% VaR (1d)"
                    value={`₹${todayPlan.diagnostics.var_95_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    accentClass={todayPlan.diagnostics.var_capped ? 'text-warning' : undefined}
                  />
                )}
              </div>
            )}
            {Object.keys(todayPlan.target_weights || {}).length > 0 ? (
              <ul className="divide-y divide-d-border rounded border border-d-border">
                {Object.entries(todayPlan.target_weights)
                  .filter(([, w]) => w > 0)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 12)
                  .map(([sym, w]) => (
                    <li key={sym} className="flex items-center justify-between gap-2 px-3 py-1.5 text-[12px]">
                      <span className="font-mono text-d-text-primary">{sym}</span>
                      <div className="flex-1 mx-3 h-1 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, w * 100)}%` }} />
                      </div>
                      <span className="numeric text-d-text-muted w-12 text-right">{(w * 100).toFixed(1)}%</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-[12px] text-d-text-muted">
                AutoPilot is holding cash today. No name cleared engine consensus and the risk gate.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── 3. Recent trades ── */}
      <section className="rounded-[20px] border border-d-border bg-wrap overflow-hidden">
        <div className="px-5 py-3 border-b border-d-border flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-d-text-primary">What AutoPilot did · last 7 days</h2>
          <Link href="/trades" className="text-[11px] text-primary hover:underline">Full journal →</Link>
        </div>
        {trades.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-d-text-muted">
              {status.enabled
                ? `AutoPilot is on${status.mode === 'paper' ? ' (practice)' : ''}. No trades in 7 days. The engines are watching the tape, waiting on the next risk-gated signal.`
                : status.mode === 'paper'
                ? 'AutoPilot is off. Turn it on above to let the engines run a virtual book.'
                : 'AutoPilot is off. Turn it on above for hands-free execution on your broker.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-d-border">
            {trades.map((t) => (
              <TradeRowView key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Emergency controls ── */}
      <section className="rounded-[20px] border border-down/35 bg-down/[0.06] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-down/35 bg-down/15">
            <AlertTriangle className="w-5 h-5 text-down" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] font-semibold text-d-text-primary">Emergency controls</h2>
            <p className="text-[12px] text-d-text-muted mt-0.5">
              Pause AutoPilot, or close everything now. Pause leaves your open positions untouched.
              Kill switch closes every live position and shuts AutoPilot off until you turn it back on.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={onToggle}
                disabled={toggling || (!active && status.mode === 'live' && !status.broker_connected)}
                title={
                  !active && status.mode === 'live' && !status.broker_connected
                    ? 'Live mode needs a connected broker. Or switch to practice mode above.'
                    : undefined
                }
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                  active
                    ? 'glass-control text-orange'
                    : 'glass-control-accent'
                }`}
              >
                {active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                {toggling
                  ? '…'
                  : active
                  ? 'Pause AutoPilot'
                  : status.mode === 'paper'
                  ? 'Turn on AutoPilot (practice)'
                  : status.broker_connected
                  ? 'Turn on AutoPilot'
                  : 'Connect broker first'}
              </button>
              <button
                onClick={() => setKillConfirmOpen(true)}
                disabled={killing || status.open_positions === 0}
                className="glass-control-danger text-down inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-semibold disabled:opacity-60"
              >
                <Power className="w-4 h-4" />
                {killing ? '…' : 'Kill switch: close ALL positions'}
              </button>
              {!status.broker_connected && (
                <BrokerLock
                  feature="AutoPilot"
                  description="Autonomous execution fires live orders through your broker. Connect one to hand it the book."
                  className="mt-4"
                />
              )}
            </div>
          </div>
        </div>
      </section>

        {/* Disclaimer — real SEBI/compliance metadata when available. */}
        <p className="text-center text-[10px] text-d-text-muted">
          {compliance?.disclaimer_short
            || 'AutoPilot autonomously executes real orders through your connected broker. Past performance ≠ future results. You control all risk rails.'}
          {compliance?.sebi_ra_reg_number
            ? ` · SEBI RA ${compliance.sebi_ra_reg_number}${compliance.sebi_ra_valid_until ? ` (valid to ${compliance.sebi_ra_valid_until})` : ''}`
            : ' · SEBI-compliant educational tool.'}
        </p>
      </div>

      {/* Pricing v2 — going live is a deliberate, modal-confirmed step. */}
      <ConfirmDialog
        open={goLiveOpen}
        onClose={() => setGoLiveOpen(false)}
        onConfirm={onGoLive}
        title="Go live with real money?"
        destructive
        confirmLabel="Yes, go live"
        body={
          <>
            AutoPilot takes the book and starts placing <strong>real orders on your
            connected broker account</strong> ({status.broker_name || 'your broker'}),
            inside your plan limits and risk rails. The kill switch stays one tap away,
            and you can drop back to practice mode any time.
            {compliance?.requires_suitability_quiz_for_live && (
              <span className="mt-2 block text-[12px] text-d-text-muted">
                Live trading requires a quick one-time suitability check.
              </span>
            )}
          </>
        }
      />

      <Dialog
        open={killConfirmOpen}
        onClose={() => setKillConfirmOpen(false)}
        title="Kill switch: close ALL positions?"
      >
        <div className="space-y-4">
          <p className="text-sm text-d-text-secondary">
            This closes every open position through your connected broker right now and pauses
            AutoPilot until you turn it back on. No undo.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setKillConfirmOpen(false)} disabled={killing}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onKillConfirmed} disabled={killing}>
              {killing ? 'Closing positions…' : 'Yes, close everything'}
            </Button>
          </div>
        </div>
      </Dialog>

      <div className="px-4 md:px-6 xl:px-8">
        <DisclaimerFooter />
      </div>
    </div>
  )
}


/* ───────────────────────── helpers ───────────────────────── */


function StatusPill({ active, paused, enabled }: { active: boolean; paused: boolean; enabled: boolean }) {
  if (paused) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border border-down/40 bg-down/10 text-down">
        <AlertTriangle className="w-3 h-3" />
        Kill switch active
      </span>
    )
  }
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border border-up/40 bg-up/10 text-up">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-up opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-up" />
        </span>
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border border-d-border bg-main text-d-text-muted">
      <PauseCircle className="w-3 h-3" />
      {enabled ? 'Paused' : 'Off'}
    </span>
  )
}


function Cell({
  label,
  value,
  sub,
  accentClass,
}: {
  label: string
  value: string | number
  sub?: string
  accentClass?: string
}) {
  return (
    <div className="tile-tint px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-d-text-muted mb-1">{label}</p>
      <p
        className={`numeric text-[16px] font-semibold ${accentClass || 'text-d-text-primary'}`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-d-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}


function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[20px] border border-d-border bg-wrap p-5">
      <p className="text-[10px] uppercase tracking-wider text-d-text-muted mb-3 flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {title}
      </p>
      {children}
    </div>
  )
}


function SliderField({
  label,
  sub,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  sub: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-d-text-muted">{label}</p>
          <p className="text-[10px] text-d-text-muted">{sub}</p>
        </div>
        <p className="numeric text-[15px] font-semibold text-d-text-primary">
          {value}{unit}
        </p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[9px] text-d-text-muted mt-0.5">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}


function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        on ? 'bg-primary/70' : 'bg-d-border'
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          on ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}


function Stat({ label, value, accentClass }: { label: string; value: string; accentClass?: string }) {
  return (
    <div className="tile-tint px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className={`numeric text-[15px] font-semibold mt-0.5 ${accentClass || 'text-d-text-primary'}`}>
        {value}
      </p>
    </div>
  )
}


function RebalanceRow({ r }: { r: RebalanceRun }) {
  const fired = r.trades_executed > 0
  const stamp = (() => {
    try {
      const d = new Date(r.ran_at)
      return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    } catch { return r.ran_at }
  })()
  const regimeColor = r.regime ? REGIME_COLORS[r.regime] : 'var(--color-muted)'
  const bandColor = r.vix_band && VIX_BAND_COPY[r.vix_band] ? VIX_BAND_COPY[r.vix_band].color : 'var(--color-muted)'
  return (
    <div className="px-5 py-3 hover:bg-hover transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="numeric text-[12px] text-d-text-primary">{stamp}</span>
            {r.regime && (
              <span
                className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border capitalize ${REGIME_TEXT[r.regime] || 'text-d-text-muted'}`}
                style={{ borderColor: `color-mix(in srgb, ${regimeColor} 33%, transparent)`, background: `color-mix(in srgb, ${regimeColor} 8%, transparent)` }}
              >
                {r.regime}
              </span>
            )}
            {r.vix_band && (
              <span
                className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border capitalize ${VIX_BAND_TEXT[r.vix_band] || 'text-d-text-muted'}`}
                style={{ borderColor: `color-mix(in srgb, ${bandColor} 33%, transparent)`, background: `color-mix(in srgb, ${bandColor} 8%, transparent)` }}
              >
                {r.vix_band} · {r.equity_scaler_pct ?? '-'}%
              </span>
            )}
          </div>
          {r.summary && (
            <p className="text-[11px] text-d-text-secondary mt-1 leading-relaxed">{r.summary}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-d-text-muted">Trades fired</p>
          <p
            className={`numeric text-[14px] font-semibold mt-0.5 ${fired ? 'text-up' : 'text-d-text-muted'}`}
          >
            {r.trades_executed}/{r.actions_count}
          </p>
        </div>
      </div>
    </div>
  )
}


function TradeRowView({ t }: { t: TradeRow }) {
  const pnl = t.pnl_percent ?? 0
  const pnlClass = pnl >= 0 ? 'text-up' : 'text-down'
  const closed = t.status === 'closed'
  return (
    <div className="px-5 py-3 flex items-center gap-4 hover:bg-hover transition-colors">
      <SymbolLogo symbol={t.symbol} size={26} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-d-text-primary">{t.symbol}</span>
          <span
            className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
              t.direction === 'LONG'
                ? 'bg-up/10 text-up border border-up/30'
                : 'bg-down/10 text-down border border-down/30'
            }`}
          >
            {t.direction}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-d-text-muted">{t.status}</span>
        </div>
        <p className="text-[10px] text-d-text-muted mt-0.5 numeric">
          qty {t.quantity} ·
          {t.entry_price ? ` entry ₹${t.entry_price.toFixed(2)}` : ''}
          {closed && t.exit_price ? ` · exit ₹${t.exit_price.toFixed(2)}` : ''}
        </p>
      </div>
      {closed ? (
        <div className="text-right">
          <p className={`numeric text-[13px] font-semibold ${pnlClass}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
          </p>
          {t.net_pnl != null && (
            <p className="text-[10px] text-d-text-muted numeric">
              ₹{t.net_pnl.toFixed(0)}
            </p>
          )}
        </div>
      ) : (
        <CheckCircle className="w-4 h-4 text-primary" />
      )}
    </div>
  )
}
