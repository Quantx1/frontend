'use client'

/**
 * StrategyActionRow — uTrade-grade inline validate-in-place action row for the
 * Builder's post-compile view. A single row of actions beneath the compiled
 * strategy: **Backtest · Payoff · Margin · Deploy**, plus FinStocks' persistent
 * **Paper / Live** segmented toggle (Paper default) and a prominent promotion
 * **gate** verdict.
 *
 * Rendered in the locked xAI dark language on foundation primitives. Every
 * number the row invents (payoff strikes/premia, margin) is a labelled,
 * client-side ESTIMATE — no broker call, no fabricated live data.
 */

import { useEffect, useMemo, useState } from 'react'

import {
  AlertTriangle,
  Coins,
  LineChart,
  PlayCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Zap,
} from '@/lib/icons'
import { Badge, Button, Dialog, Popover, Segmented, toast } from '@/components/foundation'
import { ApiError, api, handleApiError } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import PayoffDiagram from '@/components/strategy/PayoffDiagram'
import type { DSLBacktestResult, DSLStrategy, LegSpec, UserStrategy } from '@/types/strategies'

type BuilderPhase = 'idle' | 'compiling' | 'preview' | 'backtesting' | 'backtested'
type DeployMode = 'paper' | 'live'

interface Props {
  /** Compiled DSL preview (may be null while nothing is compiled). */
  dsl: DSLStrategy | null
  /** Saved draft row — actions that need a strategy id gate on this. */
  draft: UserStrategy | null
  phase: BuilderPhase
  /** Initial capital from the backtest form — used for the margin estimate. */
  capital: number
  onSave: () => void | Promise<void>
  onBacktest: () => void | Promise<void>
  onReset: () => void
  /** Present once a backtest has run — drives the gate-badge fetch. */
  btResult: DSLBacktestResult | null
}

// ── Payoff mapping ──────────────────────────────────────────────────────
// DSL legs carry anchors + offsets (ATM/ITM/OTM, strike_offset), not concrete
// strikes/premia — and the Builder has no live chain. So the payoff is a
// SCHEMATIC shape preview around a nominal spot, clearly labelled as such.
const NOMINAL_SPOT = 100
const STRIKE_STEP = 5 // per offset unit (5% of nominal spot)

interface PayoffLeg {
  strike: number
  option_type: 'CE' | 'PE'
  direction: 'BUY' | 'SELL'
  lots: number
  entry_price: number
}

function resolveStrike(leg: LegSpec): number {
  if (leg.strike_anchor === 'ATM') return NOMINAL_SPOT
  const off = Math.abs(leg.strike_offset || 0) * STRIKE_STEP
  const otm = leg.option_type === 'CE' ? NOMINAL_SPOT + off : NOMINAL_SPOT - off
  const itm = leg.option_type === 'CE' ? NOMINAL_SPOT - off : NOMINAL_SPOT + off
  return leg.strike_anchor === 'OTM' ? otm : itm
}

function estPremium(leg: LegSpec, strike: number): number {
  const intrinsic =
    leg.option_type === 'CE'
      ? Math.max(0, NOMINAL_SPOT - strike)
      : Math.max(0, strike - NOMINAL_SPOT)
  const timeValue = Math.max(0.5, 3 - 0.4 * Math.abs(leg.strike_offset || 0))
  return Math.round((intrinsic + timeValue) * 10) / 10
}

function toPayoffLegs(legs: LegSpec[]): PayoffLeg[] {
  return legs.map((leg) => {
    const strike = resolveStrike(leg)
    return {
      strike,
      option_type: leg.option_type,
      direction: leg.side,
      lots: leg.qty_lots || 1,
      entry_price: estPremium(leg, strike),
    }
  })
}

// ── Margin estimate ─────────────────────────────────────────────────────
function formatRupees(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

interface MarginEstimate {
  amount: number | null
  basis: string
  note?: string
}

function estimateMargin(dsl: DSLStrategy, capital: number): MarginEstimate {
  const ps = dsl.position_size
  let base: MarginEstimate
  switch (ps.kind) {
    case 'percent_of_capital':
      base = {
        amount: capital * (ps.value / 100),
        basis: `${ps.value}% of ${formatRupees(capital)} capital`,
      }
      break
    case 'risk_based':
      base = {
        amount: capital * (ps.value / 100),
        basis: `${ps.value}% risk of ${formatRupees(capital)} capital`,
      }
      break
    default: // fixed_qty
      base = {
        amount: null,
        basis: `${ps.value} units per trade`,
        note: 'Rupee margin needs a live price — sizing is fixed quantity.',
      }
  }
  if (dsl.instrument_segment === 'OPTIONS') {
    base.note =
      'Options margin also depends on live premiums (Σ premium × lot) and SPAN — this is a sizing estimate only.'
  }
  return base
}

export function StrategyActionRow({
  dsl,
  draft,
  phase,
  capital,
  onSave,
  onBacktest,
  onReset,
  btResult,
}: Props) {
  const [mode, setMode] = useState<DeployMode>('paper')
  const [payoffOpen, setPayoffOpen] = useState(false)
  const [liveOpen, setLiveOpen] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [liveGateFail, setLiveGateFail] = useState<{ message: string; failures: string[] } | null>(
    null,
  )

  // Gate verdict — fetched after each backtest completes (btResult changes).
  const [gate, setGate] = useState<{ passed: boolean; failures: string[] } | null>(null)
  const [gateLoading, setGateLoading] = useState(false)

  useEffect(() => {
    if (!draft?.id || !btResult) {
      setGate(null)
      return
    }
    let cancelled = false
    setGateLoading(true)
    api.strategies
      .gate(draft.id)
      .then((r) => {
        if (!cancelled) setGate({ passed: r.passed, failures: r.failures })
      })
      .catch(() => {
        if (!cancelled) setGate(null)
      })
      .finally(() => {
        if (!cancelled) setGateLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [draft?.id, btResult])

  const isOptions = dsl?.instrument_segment === 'OPTIONS'
  const legs = dsl?.legs ?? []
  const payoffAvailable = Boolean(isOptions && legs.length > 0)
  const payoffLegs = useMemo(
    () => (payoffAvailable ? toPayoffLegs(legs) : []),
    [payoffAvailable, legs],
  )
  const margin = dsl ? estimateMargin(dsl, capital) : null

  const deployPaper = async () => {
    if (!draft) return
    setDeploying(true)
    try {
      await api.strategies.transition(draft.id, 'paper')
      toast.success('Deployed to paper', {
        description: `${dsl?.name ?? 'Strategy'} is now paper-trading on your account.`,
      })
    } catch (e) {
      toast.error('Deploy failed', { description: handleApiError(e) })
    } finally {
      setDeploying(false)
    }
  }

  const deployLive = async () => {
    if (!draft) return
    setDeploying(true)
    setLiveGateFail(null)
    try {
      await api.strategies.transition(draft.id, 'live')
      toast.success('Deployed live', {
        description: `${dsl?.name ?? 'Strategy'} is now trading live on your broker account.`,
      })
      setLiveOpen(false)
    } catch (e) {
      // Render the server's gate message verbatim — never mask it.
      if (
        e instanceof ApiError &&
        e.status === 422 &&
        e.detail &&
        typeof e.detail === 'object' &&
        (e.detail as { error?: string }).error === 'gate_failed'
      ) {
        const failures = (e.detail as { failures?: unknown }).failures
        setLiveGateFail({
          message: e.message,
          failures: Array.isArray(failures) ? (failures as string[]) : [],
        })
      } else {
        toast.error('Deploy failed', { description: handleApiError(e) })
        setLiveOpen(false)
      }
    } finally {
      setDeploying(false)
    }
  }

  const onDeploy = () => {
    if (mode === 'paper') {
      void deployPaper()
    } else {
      setLiveGateFail(null)
      setLiveOpen(true)
    }
  }

  return (
    <div className="space-y-3 border-t border-line pt-4">
      {/* Row 1 — persistent Paper/Live toggle + gate verdict */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<DeployMode>
          value={mode}
          onChange={setMode}
          aria-label="Deploy target"
          options={[
            { value: 'paper', label: 'Paper' },
            { value: 'live', label: 'Live' },
          ]}
        />
        <GateBadge loading={gateLoading} gate={gate} hasBacktest={Boolean(btResult)} />
      </div>

      {/* Row 2 — inline validate-in-place actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        {!draft && dsl && (
          <Button size="sm" onClick={() => void onSave()}>
            <Save className="mr-1 h-3.5 w-3.5" />
            Save as draft
          </Button>
        )}

        <Button
          size="sm"
          variant="secondary"
          onClick={() => void onBacktest()}
          disabled={!draft || phase === 'backtesting'}
        >
          <PlayCircle className="mr-1 h-3.5 w-3.5" />
          {phase === 'backtesting' ? 'Running…' : 'Run backtest'}
        </Button>

        {payoffAvailable ? (
          <Button size="sm" variant="secondary" onClick={() => setPayoffOpen(true)}>
            <LineChart className="mr-1 h-3.5 w-3.5" />
            Payoff
          </Button>
        ) : (
          <span
            className="inline-flex h-8 items-center gap-1 rounded-pill border border-line px-3 text-xs text-d-text-muted"
            title="Payoff diagrams apply to options strategies only"
          >
            <LineChart className="h-3.5 w-3.5" />
            Equity — no option payoff
          </span>
        )}

        {margin && (
          <Popover
            side="top"
            align="start"
            trigger={
              <Button size="sm" variant="secondary" disabled={!dsl}>
                <Coins className="mr-1 h-3.5 w-3.5" />
                Margin
                <span className="ml-1 text-[10px] uppercase tracking-[0.08em] text-d-text-muted">
                  est.
                </span>
              </Button>
            }
            className="w-72 p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-d-text-muted">
              Capital per trade · estimate
            </p>
            <p className={`mt-1 text-lg tabular-nums text-d-text-primary ${MONO}`}>
              {margin.amount != null ? formatRupees(margin.amount) : '—'}
            </p>
            <p className="mt-1 text-[12px] text-d-text-secondary">{margin.basis}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-d-text-muted">
              {margin.note ??
                'Rough client-side estimate from your position sizing — real margin depends on live prices.'}
            </p>
          </Popover>
        )}

        <Button size="sm" onClick={onDeploy} disabled={!draft || deploying}>
          <Zap className="mr-1 h-3.5 w-3.5" />
          {deploying ? 'Deploying…' : mode === 'paper' ? 'Deploy to paper' : 'Deploy live'}
        </Button>

        <Button size="sm" variant="ghost" className="ml-auto" onClick={onReset}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Start over
        </Button>
      </div>

      {/* Payoff dialog — schematic shape preview from the DSL legs */}
      <Dialog
        open={payoffOpen}
        onClose={() => setPayoffOpen(false)}
        title="Payoff at expiry"
        className="max-w-lg"
      >
        {payoffLegs.length > 0 && (
          <PayoffDiagram
            legs={payoffLegs}
            spotPrice={NOMINAL_SPOT}
            lotSize={1}
            label="Schematic payoff (illustrative strikes)"
          />
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-d-text-muted">
          Illustrative shape only — strikes and premia are estimated around a nominal spot because
          the Builder has no live option chain. Deploy to paper to see real fills.
        </p>
      </Dialog>

      {/* Live-deploy confirm — foundation Dialog; server gate message shown verbatim */}
      <Dialog
        open={liveOpen}
        onClose={() => {
          setLiveOpen(false)
          setLiveGateFail(null)
        }}
        title="Deploy live?"
      >
        <p className="text-[13px] leading-relaxed text-d-text-secondary">
          This will place real orders on your connected broker account when the strategy triggers.
          It must clear the out-of-sample backtest gate first.
        </p>

        {liveGateFail && (
          <div className="mt-3 rounded-sm border border-down/40 bg-down/10 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-down">
              <AlertTriangle className="h-3.5 w-3.5" />
              {liveGateFail.message}
            </p>
            {liveGateFail.failures.length > 0 && (
              <ul className="mt-2 space-y-1">
                {liveGateFail.failures.map((f, i) => (
                  <li key={i} className="text-[12px] leading-relaxed text-down/90">
                    • {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setLiveOpen(false)
              setLiveGateFail(null)
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={() => void deployLive()} disabled={deploying}>
            <Zap className="mr-1 h-3.5 w-3.5" />
            {deploying ? 'Deploying…' : 'Confirm live deploy'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

// ── Gate badge ──────────────────────────────────────────────────────────
function GateBadge({
  loading,
  gate,
  hasBacktest,
}: {
  loading: boolean
  gate: { passed: boolean; failures: string[] } | null
  hasBacktest: boolean
}) {
  if (!hasBacktest) {
    return <span className="text-[11px] text-d-text-muted">Run a backtest to check the gate</span>
  }
  if (loading || !gate) {
    return <span className="text-[11px] text-d-text-muted">Checking the gate…</span>
  }
  if (gate.passed) {
    return (
      <Badge tone="up" className="gap-1">
        <ShieldCheck className="h-3.5 w-3.5" />
        Gate pass
      </Badge>
    )
  }
  return (
    <Popover
      side="bottom"
      align="end"
      trigger={
        <button
          type="button"
          className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
        >
          <Badge tone="down" className="cursor-pointer gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs work
          </Badge>
        </button>
      }
      className="w-72 p-3"
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-d-text-muted">
        Gate — not cleared yet
      </p>
      {gate.failures.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {gate.failures.map((f, i) => (
            <li key={i} className="text-[12px] leading-relaxed text-d-text-secondary">
              • {f}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12px] text-d-text-secondary">
          Run a fresh walk-forward backtest to generate an out-of-sample result.
        </p>
      )}
    </Popover>
  )
}
