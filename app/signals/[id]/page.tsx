'use client'

/**
 * /signals/[id] — signal detail page (Step 4 §5.3 layout).
 *
 * 3-column desktop layout:
 *   Col 1 (8/12): header + chart + ModelConsensusGrid + ExplanationMarkdown
 *                 + DebateTranscript (Elite) + similar signals strip
 *   Col 2 (4/12): execute panel + metadata + alert toggles
 *   Bottom:       user's prior trades on this symbol
 *
 * Data flow:
 *   api.signals.getById(id) → signal row
 *   api.user.getTier()      → tier gate for debate button
 *   api.ai.debate(id, ...)  → Bull/Bear transcript (on-demand, Elite only)
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Calculator,
  Clock,
  Info,
  Loader2,
  Play,
  Shield,
  Zap,
} from '@/lib/icons'
import { useTheme } from 'next-themes'

import { api } from '@/lib/api'
import type { Signal } from '@/types'
import { AppShell } from '@/components/shell/AppShell'
import { DisclaimerFooter, Reveal, toast } from '@/components/foundation'
import ExplanationMarkdown from '@/components/signals/ExplanationMarkdown'
import DebateTranscript, { type DebatePayload } from '@/components/signals/DebateTranscript'
import QuickTrade from '@/components/dashboard/QuickTrade'
import CalculatorModal from '@/components/CalculatorModal'

// PR 33 + PR 35 — consolidated per-stock engine output, injected on the signal page too.
const ChartVisionCard = dynamic(() => import('@/components/stock/ChartVisionCard'), { ssr: false })
const NewsIntelligenceCard = dynamic(() => import('@/components/stock/NewsIntelligenceCard'), { ssr: false })

// PR-AO — single chart pattern: TradingView Advanced Chart everywhere.
// The old in-house lightweight-charts wrapper (AdvancedStockChart) had
// toy-coloured indicator buttons (purple Volume/Target, cyan RSI/MACD)
// that didn't read as a professional trading surface.
// PR-S16 — switched from tv.js (NSE paywall'd) to Lightweight Charts
const TradingViewWidget = dynamic(
  () => import('@/components/charts/LightweightChart').then((m) => m.LightweightChart),
  { ssr: false },
)


// ----------------------------------------------------------------- helpers

const STATUS_META: Record<string, { label: string; cls: string; pulse?: boolean }> = {
  active:          { label: 'Active',        cls: 'bg-warning/10 border-warning/30 text-warning' },
  triggered:       { label: 'Triggered',     cls: 'bg-up/10 border-up/30 text-up', pulse: true },
  executed:        { label: 'Live',          cls: 'bg-up/10 border-up/30 text-up', pulse: true },
  target_hit:      { label: '✓ Target hit',  cls: 'bg-up/10 border-up/30 text-up' },
  stop_loss_hit:   { label: '✗ SL hit',      cls: 'bg-down/10 border-down/30 text-down' },
  sl_hit:          { label: '✗ SL hit',      cls: 'bg-down/10 border-down/30 text-down' },
  expired:         { label: 'Expired',       cls: 'bg-d-bg-elevated border-d-border text-d-text-muted' },
  cancelled:       { label: 'Cancelled',     cls: 'bg-d-bg-elevated border-d-border text-d-text-muted' },
}

function formatTimeAgo(iso?: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function num(v: any, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}


// -------------------------------------------------------------------- page

export default function SignalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [signal, setSignal] = useState<(Signal & Record<string, any>) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tier, setTier] = useState<'free' | 'pro' | 'elite'>('free')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showTrade, setShowTrade] = useState(false)
  // Point-of-action calculator — seeds the planner from this signal's computed
  // levels. Conditionally rendered so it remounts (fresh state) on each open.
  const [showCalc, setShowCalc] = useState(false)

  // Counterpoint (B1) — on-demand Bull/Bear debate, Elite-gated. Nothing
  // runs until the user explicitly clicks "Run debate" (keeps PR-E's clean
  // default). The AIDossierPanel "Run debate" link + pricing page point here.
  const [debate, setDebate] = useState<DebatePayload | null>(null)
  const [debateLoading, setDebateLoading] = useState(false)

  // Chart follows the app theme (both light + dark supported).
  const { resolvedTheme } = useTheme()
  const chartTheme = resolvedTheme === 'light' ? 'light' : 'dark'

  // PR 35 — side engines attached to the signal's stock.
  const [similar, setSimilar] = useState<Array<Signal & Record<string, any>>>([])

  // PR 82 — wire alert toggles to the global /api/alerts/preferences
  // matrix instead of pure local state that evaporates on reload. We
  // surface push (the universal channel) per Step 4 §C12 — the full
  // event×channel matrix lives at /alerts.
  const [alertOnTrigger, setAlertOnTrigger] = useState(true)
  const [alertOnTarget, setAlertOnTarget] = useState(true)
  const [alertOnSL, setAlertOnSL] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState<string | null>(null)

  // ── Load signal + user tier ──
  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.signals.getById(id)
        if (!cancelled) setSignal(data as any)
        try {
          const t = await api.user.getTier()
          if (!cancelled) { setTier(t.tier); setIsAdmin(t.is_admin) }
        } catch {}
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load signal')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  // PR 82 — load global alert prefs once. Push is the universal
  // channel; the full event×channel matrix lives at /alerts.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.alerts.preferences()
        if (cancelled) return
        const p = r.preferences || {}
        setAlertOnTrigger(Boolean(p.signal_triggered?.push ?? true))
        setAlertOnTarget(Boolean(p.target_hit?.push ?? true))
        setAlertOnSL(Boolean(p.sl_hit?.push ?? true))
      } catch (err: any) {
        // Pro-gated; Free users see the toggles but they're inert.
        if (!cancelled) setAlertsError(err?.message ? null : null)
      } finally {
        if (!cancelled) setAlertsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const persistAlert = async (event: 'signal_triggered' | 'target_hit' | 'sl_hit', enabled: boolean) => {
    try {
      await api.alerts.toggle(event, 'push', enabled)
      setAlertsError(null)
    } catch (err: any) {
      setAlertsError('Could not save — open Alerts Studio for full controls.')
    }
  }

  // ── PR 35 — lazy side-engine fetches once the signal has a symbol ──
  useEffect(() => {
    if (!signal?.symbol) return
    let cancelled = false
    const sym = signal.symbol.replace('.NS', '')
    ;(async () => {
      const hist = await api.signals
        .getHistory({ symbol: sym, limit: 6 } as any)
        .catch(() => null)
      if (cancelled) return
      if (hist && Array.isArray((hist as any).signals)) {
        setSimilar(((hist as any).signals as any[]).filter((s) => s.id !== id).slice(0, 5))
      }
    })()
    return () => { cancelled = true }
  }, [signal?.symbol, id])

  // ── Loading / error / not-found states ──
  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </AppShell>
    )
  }
  if (error || !signal) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="lg-surface rounded-xl p-4 text-center">
            <p className="text-d-text-primary font-medium">Signal unavailable</p>
            <p className="text-[12px] text-d-text-muted mt-1">{error || 'Not found'}</p>
            <button
              onClick={() => router.push('/signals')}
              className="mt-4 px-4 py-1.5 text-[12px] bg-primary text-primary-foreground rounded-md"
            >
              Back to signals
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Derive common view-model ──
  const entry = num(signal.entry_price)
  const stop = num(signal.stop_loss)
  const target = num((signal as any).target_1 ?? signal.target)
  const target2 = num((signal as any).target_2)
  const target3 = num((signal as any).target_3)
  const rr = num(signal.risk_reward_ratio ?? signal.risk_reward, 0)
  const isLong = signal.direction === 'LONG'
  const pctUpside = entry > 0 && target > 0 ? ((target - entry) / entry) * 100 : 0
  const pctRisk = entry > 0 && stop > 0 ? ((entry - stop) / entry) * 100 : 0
  const statusMeta = STATUS_META[signal.status] || STATUS_META.active
  const regime: string | undefined = (signal as any).regime_at_signal ?? signal.regime_context
  const reasons: string[] = (signal.reasons || []).filter((r) => !r.startsWith('Regime:'))
  const strategy = (signal.strategy_names?.[0] || (signal as any).strategy_name || '—')
  const explanation: string = (signal as any).explanation_text || ''

  // Counterpoint debate is Elite-only (admins bypass). On-demand: the
  // empty state below shows a "Run debate" button that calls the live
  // /api/ai/debate/signal/{id} route and renders the Bull/Bear transcript.
  const isEliteUser = tier === 'elite' || isAdmin
  const runDebate = async () => {
    setDebateLoading(true)
    try {
      const res = await api.ai.debate(id, {})
      setDebate(res)
    } catch (e: any) {
      toast.error('Could not run debate', { description: e?.message || 'Please try again.' })
    } finally {
      setDebateLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="w-full p-4 md:p-6">
        {/* ── Breadcrumb ── */}
        <Link
          href="/signals"
          className="inline-flex items-center gap-1.5 text-[11px] text-d-text-muted hover:text-d-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to signals
        </Link>

        {/* ── Header strip ── */}
        <Reveal className="mt-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="text-[28px] font-semibold text-d-text-primary">{signal.symbol}</h1>
              <span className="text-[11px] text-d-text-muted uppercase tracking-wider">
                {signal.exchange} · {signal.segment}
              </span>
            </div>
            <div
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${statusMeta.cls}`}
            >
              {statusMeta.pulse && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                </span>
              )}
              {statusMeta.label}
            </div>
            <div
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${
                isLong ? 'border-up/30 bg-up/10 text-up' : 'border-down/30 bg-down/10 text-down'
              }`}
            >
              {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {signal.direction}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-d-text-muted">Confidence</span>
            <ConfidenceBar value={signal.confidence} />
            <span className="numeric text-d-text-primary text-[14px] font-medium">
              {Math.round(signal.confidence)}
            </span>
          </div>
        </Reveal>

        {/* ── Regime warning (bear) ── */}
        {regime === 'bear' && (
          <div className="mt-3 p-3 rounded-md border border-warning/30 bg-warning/5 flex items-start gap-2">
            <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-[12px] text-warning/90 flex items-center gap-2 flex-wrap">
              Bear regime active — AI reduced signal size to{' '}
              <span className="numeric">50%</span>.
            </p>
          </div>
        )}

        {/* PR-E 2026-05-19 — AI Dossier + VerdictBanner removed from
            the signal surface. The 8 engines now run inside the box;
            user-facing pages just show the final AI signal and a
            single AI thesis. Per-engine transparency lives at /engines.
            */}

        {/* ── 3-column grid ── */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Chart — TradingView Advanced Chart with full toolbar +
                drawing tools. NSE-prefixed symbol so Indian market data
                loads. Compact details panel so the signal page stays
                focused on the AI thesis. */}
            <div className="overflow-hidden rounded-lg border border-line bg-main">
              <TradingViewWidget
                symbol={signal.symbol}
                height={520}
                theme={chartTheme}
              />
            </div>

            {/* AI thesis */}
            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-d-text-muted mb-2">
                AI thesis
              </h3>
              <ExplanationMarkdown text={explanation || defaultExplanation(signal, reasons)} />
            </div>

            {/* Counterpoint (B1) — on-demand Bull/Bear debate.
                PR-E (2026-05-19) removed the always-on per-engine consensus
                grid to keep the default view clean ("one signal, one thesis,
                one action"). This is its on-demand, Elite-gated replacement:
                nothing runs until the user clicks "Run debate". It honours the
                pricing-page promise + makes the AIDossierPanel "Run debate"
                link (which routes here) actually resolve. */}
            <div>
              <h3 className="text-[11px] uppercase tracking-wider text-d-text-muted mb-2 flex items-baseline gap-2">
                Pressure-test
                <span className="text-[10px] normal-case tracking-normal text-d-text-muted/70">
                  Counterpoint · Bull vs Bear
                </span>
              </h3>
              {isEliteUser ? (
                <DebateTranscript data={debate} loading={debateLoading} onRun={runDebate} />
              ) : (
                <Link
                  href="/pricing"
                  className="trading-surface flex items-center justify-between gap-4 hover:border-d-border-hover transition-colors"
                >
                  <div>
                    <p className="text-[13px] font-medium text-d-text-primary">
                      Counterpoint debate — Elite
                    </p>
                    <p className="mt-0.5 text-[11px] text-d-text-muted">
                      7 specialist agents pressure-test this signal Bull vs Bear before you commit.
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-primary hover:underline">Upgrade →</span>
                </Link>
              )}
            </div>

            {/* News intelligence — flags news contradicting THIS signal's thesis */}
            <NewsIntelligenceCard
              symbol={signal.symbol.replace('.NS', '')}
              direction={signal.direction === 'LONG' ? 'LONG' : 'SHORT'}
            />

            {/* PR 35 — Similar signals strip (history for the same symbol) */}
            {similar.length > 0 && (
              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-d-text-muted mb-2">
                  Prior signals on {signal.symbol}
                </h3>
                <div className="space-y-1">
                  {similar.map((s) => <PriorSignalRow key={s.id} s={s} />)}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-5">
            {/* Execute panel */}
            <div className="lg-surface rounded-xl p-4 space-y-3">
              <h3 className="text-[11px] uppercase tracking-wider text-d-text-muted">Levels</h3>

              <KV label="Entry" value={entry} color="var(--color-d-text-primary)" />
              <KV label="Stop loss" value={stop} color="var(--color-down)" suffix={pctRisk ? `−${pctRisk.toFixed(2)}%` : undefined} />
              <KV label="Target 1" value={target} color="var(--color-up)" suffix={pctUpside ? `+${pctUpside.toFixed(2)}%` : undefined} />
              {target2 > 0 && <KV label="Target 2" value={target2} color="var(--color-up)" />}
              {target3 > 0 && <KV label="Target 3" value={target3} color="var(--color-up)" />}

              {rr > 0 && (
                <div className="pt-2 border-t border-d-border flex items-center justify-between">
                  <span className="text-[11px] text-d-text-muted">Risk : Reward</span>
                  <span className="numeric text-d-text-primary text-[13px] font-medium">
                    1 : {rr.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setShowTrade(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Paper-trade
                </button>
                <button
                  onClick={() => setShowTrade(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium border border-d-border text-d-text-primary rounded-md hover:bg-white/[0.03] transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Live trade
                </button>
              </div>
              <button
                onClick={() => setShowCalc(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium border border-line text-d-text-secondary rounded-md hover:text-d-text-primary hover:bg-white/[0.03] transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                Plan trade · Position size
              </button>
              <p className="text-[10px] text-d-text-muted">
                Live trade requires Elite + connected broker. Paper-trade is free.
              </p>
            </div>

            {/* Metadata */}
            <div className="lg-surface rounded-xl p-4 space-y-2">
              <h3 className="text-[11px] uppercase tracking-wider text-d-text-muted">Signal meta</h3>
              <MetaRow icon={Clock} label="Generated" value={formatTimeAgo(signal.generated_at ?? signal.created_at)} />
              <MetaRow icon={Shield} label="Strategy" value={strategy} />
              <MetaRow icon={Info} label="Regime at signal" value={regime ? regime : '—'} />
              {signal.lot_size && <MetaRow icon={Info} label="Lot size" value={String(signal.lot_size)} />}
              {(signal as any).expiry_date && (
                <MetaRow icon={Clock} label="Expiry" value={(signal as any).expiry_date} />
              )}
              {signal.strike_price && <MetaRow icon={Info} label="Strike" value={`₹${signal.strike_price}`} />}
              {signal.option_type && <MetaRow icon={Info} label="Option" value={signal.option_type} />}
            </div>

            {/* Alerts — wires to global push prefs (PR 82) */}
            <div className="lg-surface rounded-xl p-4 space-y-2">
              <h3 className="text-[11px] uppercase tracking-wider text-d-text-muted flex items-center gap-1.5">
                <Bell className="w-3 h-3" />
                Push alerts
              </h3>
              {alertsLoading ? (
                <p className="text-[11px] text-d-text-muted">Loading preferences…</p>
              ) : (
                <>
                  <AlertToggle
                    label="When triggered"
                    checked={alertOnTrigger}
                    onChange={(v) => { setAlertOnTrigger(v); persistAlert('signal_triggered', v) }}
                  />
                  <AlertToggle
                    label="When target hit"
                    checked={alertOnTarget}
                    onChange={(v) => { setAlertOnTarget(v); persistAlert('target_hit', v) }}
                  />
                  <AlertToggle
                    label="When stop loss hit"
                    checked={alertOnSL}
                    onChange={(v) => { setAlertOnSL(v); persistAlert('sl_hit', v) }}
                  />
                </>
              )}
              {alertsError && (
                <p className="text-[10px] text-down pt-1">{alertsError}</p>
              )}
              <p className="text-[10px] text-d-text-muted pt-1">
                Global setting — applies to every signal.{' '}
                <Link href="/alerts" className="text-primary hover:underline">Full Alerts Studio</Link>
                {' '}covers Telegram/WhatsApp/email channels.
              </p>
            </div>

            {/* Reasons / decisions */}
            {reasons.length > 0 && (
              <div className="lg-surface rounded-xl p-4 space-y-2">
                <h3 className="text-[11px] uppercase tracking-wider text-d-text-muted">
                  Decision factors
                </h3>
                <ul className="space-y-1">
                  {reasons.slice(0, 6).map((r, i) => (
                    <li key={i} className="text-[12px] text-d-text-primary leading-snug">
                      · {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick trade modal ── */}
        {showTrade && (
          <QuickTrade
            isOpen={showTrade}
            onClose={() => setShowTrade(false)}
            onSubmit={async (data) => {
              // Execute-only flow: place the signal as a real trade. QuickTrade
              // already gates this behind <BrokerLock> when no broker is
              // connected, so live orders can't fire without a broker.
              const result = await api.trades.execute({
                signal_id: id,
                quantity: data.quantity,
                custom_sl: data.stopLoss,
                custom_target: data.target,
              })
              setShowTrade(false)
              // Pending (order placed, awaiting fill) -> Orders; filled/open -> Portfolio.
              if (result.status === 'pending') {
                router.push('/trades')
              } else {
                router.push('/portfolio')
              }
            }}
            initialSymbol={signal.symbol}
            initialDirection={signal.direction}
            initialEntryPrice={entry}
            initialStopLoss={stop}
            initialTarget={target}
          />
        )}

        {/* ── Point-of-action calculator ── conditionally rendered so it
            remounts with THIS signal's computed levels on each open. */}
        {showCalc && (
          <CalculatorModal
            isOpen={showCalc}
            onClose={() => setShowCalc(false)}
            type="planner"
            initialEntry={entry || ''}
            initialStop={stop || ''}
            initialTarget={target || ''}
          />
        )}

        <DisclaimerFooter />
      </div>
    </AppShell>
  )
}

// -------------------------------------------------------------- subcomponents

function ConfidenceBar({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value))
  let color = 'var(--color-down)'
  if (v >= 40) color = 'var(--color-warning)'
  if (v >= 65) color = 'var(--color-primary)'
  if (v >= 85) color = 'var(--color-up)'
  return (
    <div className="h-2 w-24 rounded-full bg-surface-2 overflow-hidden">
      <div className="h-full transition-all duration-300" style={{ width: `${v}%`, background: color }} />
    </div>
  )
}

function KV({
  label,
  value,
  color,
  suffix,
}: {
  label: string
  value: number
  color: string
  suffix?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-d-text-muted">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="numeric text-[13px] font-medium" style={{ color }}>
          ₹{value.toFixed(2)}
        </span>
        {suffix && (
          <span className="numeric text-[10px] text-d-text-muted">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-d-text-muted">
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <span className="text-[12px] text-d-text-primary truncate max-w-[200px]">{value}</span>
    </div>
  )
}

function AlertToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-d-text-primary">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-up' : 'bg-d-bg-elevated'}`}
        aria-label={label}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

function defaultExplanation(signal: Signal, reasons: string[]): string {
  const dir = signal.direction === 'LONG' ? 'bullish' : 'bearish'
  const r = reasons.slice(0, 3).join('; ')
  return [
    `What AI sees: ${signal.symbol} triggered a ${dir} setup with ${Math.round(signal.confidence)}% confidence. ${r || 'Multi-factor technical alignment detected.'}`,
    '',
    `Why now: Entry at ₹${num(signal.entry_price).toFixed(2)} reflects the optimal risk-adjusted level given AI conviction on direction + regime alignment.`,
    '',
    `What invalidates: A close below ₹${num(signal.stop_loss).toFixed(2)} cancels the setup. Exit discipline on SL is mandatory.`,
  ].join('\n')
}


/* ───────────────────── PR-E — prior-signal row only (VerdictBanner removed) ───────────────────── */

function PriorSignalRow({ s }: { s: Signal & Record<string, any> }) {
  const pnlPct = num(s.final_pnl_pct ?? s.pnl_percent)
  const status = s.status || 'unknown'
  const color =
    status === 'target_hit' ? 'var(--color-up)'
      : status === 'sl_hit' || status === 'stop_loss_hit' ? 'var(--color-down)'
        : 'var(--color-d-text-muted)'
  return (
    <Link
      href={`/signals/${s.id}`}
      className="flex items-center gap-3 px-3 py-2 rounded-md bg-main border border-d-border hover:border-d-border-hover transition-colors"
    >
      <span className="text-[10px] uppercase tracking-wider text-d-text-muted w-20">
        {s.direction}
      </span>
      <span className="text-[11px] text-d-text-secondary numeric w-24">
        {formatTimeAgo(s.created_at ?? s.generated_at)}
      </span>
      <span className="text-[11px] capitalize flex-1 truncate" style={{ color }}>
        {status.replace(/_/g, ' ')}
      </span>
      {Number.isFinite(pnlPct) && pnlPct !== 0 && (
        <span
          className="numeric text-[12px] font-semibold shrink-0"
          style={{ color: pnlPct >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}
        >
          {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
        </span>
      )}
    </Link>
  )
}
