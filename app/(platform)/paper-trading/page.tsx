'use client'

/**
 * /paper-trading — F11 paper trading dashboard (Step 4 §5.3 rebuild).
 *
 * Layout:
 *   - Top hero: achievements strip (streak + trades + total + badges)
 *   - Row 1: equity curve (8/12) · stat cards (4/12)
 *   - Row 2: Paper League leaderboard (full width)
 *   - Conditional: Go-Live CTA panel (shown at ≥30 days paper trading)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, TrendingUp, Zap, ArrowUpRight, RefreshCw, RotateCcw, AlertTriangle, Calculator } from '@/lib/icons'

import CalculatorModal from '@/components/CalculatorModal'
import AchievementsStrip from '@/components/paper/AchievementsStrip'
import PaperLeagueLeaderboard from '@/components/paper/PaperLeagueLeaderboard'
import PaperWindowCard from '@/components/paper/PaperWindowCard'
import EquityCurveWithBenchmark from '@/components/paper/EquityCurveWithBenchmark'
import { EyebrowMono, Reveal } from '@/components/foundation'
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'

/** Card surface — xAI flat panel (replaces legacy `.trading-surface`). */
const CARD = 'rounded-sm border border-line bg-wrap p-4'

type EquityPoint = {
  snapshot_date: string
  equity: number
  cash: number
  invested: number
  drawdown_pct: number | null
  nifty_close: number | null
  return_pct: number
  nifty_pct: number
}

export default function PaperTradingPage() {
  const [equity, setEquity] = useState<{
    points: EquityPoint[]
    latest: any
  } | null>(null)
  const [achievements, setAchievements] = useState<Awaited<ReturnType<typeof api.paper.getAchievements>> | null>(null)
  const [league, setLeague] = useState<Awaited<ReturnType<typeof api.paper.getLeague>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plannerOpen, setPlannerOpen] = useState(false)
  // Point-of-action position sizer — a lighter entry than the full planner.
  const [sizerOpen, setSizerOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [eq, ach, lg] = await Promise.all([
        api.paper.getEquityCurve(90).catch(() => null),
        api.paper.getAchievements().catch(() => null),
        api.paper.getLeague(1).catch(() => null),
      ])
      setEquity(eq as any)
      setAchievements(ach as any)
      setLeague(lg as any)
    } catch (e: any) {
      setError(e?.message || 'Failed to load paper-trading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const confirmReset = async () => {
    setResetting(true)
    setResetError(null)
    setResetSuccess(null)
    try {
      const r = await api.paper.reset()
      setResetSuccess(r.message || 'Account reset to ₹10,00,000')
      setResetOpen(false)
      await loadAll()
      window.setTimeout(() => setResetSuccess(null), 4000)
    } catch (e: any) {
      setResetError(e?.message || 'Failed to reset paper account')
    } finally {
      setResetting(false)
    }
  }

  const latestEquity = achievements?.current_equity ?? equity?.latest?.equity ?? 10_00_000
  const points = equity?.points ?? []
  const latestPoint = points[points.length - 1]
  const yourPct = latestPoint?.return_pct ?? 0
  const niftyPct = latestPoint?.nifty_pct ?? 0
  const vsNifty = yourPct - niftyPct

  if (loading && !equity && !achievements) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6 w-full space-y-5">
        {/* ── Title row ── */}
        <Reveal className="flex items-end justify-between gap-4 flex-wrap border-b border-line pb-5">
          <div>
            <EyebrowMono className="mb-1.5">F11 · AI signals, virtual capital</EyebrowMono>
            <h1 className="font-display text-[26px] font-normal text-d-text-primary">Paper trading</h1>
            <p className="text-[12px] text-d-text-secondary mt-1">
              Trade the AI signal stack on a virtual ₹10,00,000 book. Every fill recorded. No capital at risk.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Position sizer — capital + risk% + entry/stop → share count. */}
            <button
              onClick={() => setSizerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-line rounded-sm text-d-text-secondary hover:text-d-text-primary hover:bg-hover transition-colors"
            >
              <Calculator className="w-3 h-3" />
              Position size
            </button>
            {/* AI Trade Planner — entry/stop/capital/risk% → size, R-ladder, drawdown */}
            <button
              onClick={() => setPlannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-line rounded-sm text-d-text-secondary hover:text-d-text-primary hover:bg-hover transition-colors"
            >
              <Calculator className="w-3 h-3" />
              Trade planner
            </button>
            <button
              onClick={loadAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-line rounded-sm text-d-text-secondary hover:text-d-text-primary hover:bg-hover transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
            <button
              onClick={() => { setResetError(null); setResetOpen(true) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-down/30 rounded-sm text-down hover:bg-down/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset account
            </button>
          </div>
        </Reveal>

        {error && (
          <div className="rounded-sm border border-down/40 bg-down/10 px-4 py-3 text-down text-[12px]">{error}</div>
        )}
        {resetSuccess && (
          <div className="rounded-sm border border-up/40 bg-up/10 px-4 py-3 text-up text-[12px]" role="status">
            {resetSuccess}
          </div>
        )}

        {/* ── Risk manager (warn-only, honest-empty when clean) ── */}
        <RiskBanner />

        {/* ── Achievements strip ── */}
        {achievements && (
          <Reveal delay={0.05}>
            <AchievementsStrip
              streakDays={achievements.streak_days}
              tradeCount={achievements.trade_count}
              totalReturnPct={achievements.total_return_pct}
              badges={achievements.badges}
            />
          </Reveal>
        )}

        {/* ── Model validation window (paper → real-money gate) ── */}
        <Reveal delay={0.08}>
          <PaperWindowCard />
        </Reveal>

        {/* ── Row 1: equity curve + stat cards ── */}
        <Reveal delay={0.1} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Chart card */}
          <div className={`lg:col-span-8 ${CARD}`}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-d-text-muted">
                  Equity curve · last 90 days
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={`${MONO} text-[26px] font-normal text-d-text-primary`}>
                    ₹{Math.round(latestEquity).toLocaleString('en-IN')}
                  </span>
                  <span className={`${MONO} text-[13px] font-medium ${yourPct >= 0 ? 'text-up' : 'text-down'}`}>
                    {yourPct >= 0 ? '+' : ''}{yourPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <EquityCurveWithBenchmark points={points} />
          </div>

          {/* Stats column */}
          <div className="lg:col-span-4 space-y-3">
            <Reveal delay={Math.min(0, 8) * 0.04}>
              <StatCard
                label="vs Nifty 50"
                value={`${vsNifty >= 0 ? '+' : ''}${vsNifty.toFixed(2)}%`}
                sub={`You ${yourPct.toFixed(1)}% · Nifty ${niftyPct.toFixed(1)}%`}
                tone={vsNifty >= 0 ? 'up' : 'down'}
              />
            </Reveal>
            <Reveal delay={Math.min(1, 8) * 0.04}>
              <StatCard
                label="Closed trades"
                value={String(achievements?.trade_count ?? 0)}
                sub="Since account open"
                tone="neutral"
              />
            </Reveal>
            <Reveal delay={Math.min(2, 8) * 0.04}>
              <StatCard
                label="Days trading"
                value={String(achievements?.days_trading ?? 0)}
                sub="Snapshots captured"
                tone="neutral"
              />
            </Reveal>
            <Reveal delay={Math.min(3, 8) * 0.04}>
              <StatCard
                label="Drawdown"
                value={`${latestPoint?.drawdown_pct?.toFixed(2) ?? '0.00'}%`}
                sub="vs 90-day peak"
                tone={(latestPoint?.drawdown_pct ?? 0) < -5 ? 'down' : 'warn'}
              />
            </Reveal>
          </div>
        </Reveal>

        {/* ── Go live CTA (≥30 days) ── */}
        {achievements?.go_live_eligible && (
          <Reveal delay={0.15} className="rounded-sm border border-l-[3px] border-warning/40 border-l-warning bg-warning/[0.06] p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-[16px] font-normal text-d-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-warning" />
                You&apos;ve paper-traded for 30+ days
              </h3>
              <p className="text-[12px] text-d-text-secondary mt-1">
                Ready to switch to live? Connect your broker and let the AI run the same signal
                stack on real capital, with risk-gated sizing and a kill-switch.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/settings?tab=broker"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-normal bg-primary text-main border border-primary rounded-pill hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-out"
              >
                <Zap className="w-3.5 h-3.5" />
                Connect broker
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-normal border border-line text-d-text-primary rounded-pill hover:bg-hover transition-colors"
              >
                Upgrade to Elite
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </Reveal>
        )}

        {/* ── Paper League ── */}
        {league && (
          <Reveal delay={0.2}>
            <PaperLeagueLeaderboard rows={league.top_20} />
          </Reveal>
        )}

      <p className="text-[10px] text-d-text-muted pt-6 border-t border-line">
        Paper trading results do not include market impact, slippage, or after-hours risk. Live
        trading introduces execution cost and tax. Market investments carry risk.
      </p>

      <CalculatorModal isOpen={plannerOpen} onClose={() => setPlannerOpen(false)} type="planner" />
      {/* Conditionally rendered so it remounts fresh each open. */}
      {sizerOpen && (
        <CalculatorModal isOpen={sizerOpen} onClose={() => setSizerOpen(false)} type="position" />
      )}

      {resetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !resetting && setResetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="paper-reset-title"
        >
          <div
            className="w-full max-w-md rounded-sm border border-line bg-wrap p-5 shadow-[0_25px_60px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-down/10 text-down">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="paper-reset-title" className="text-[15px] font-normal text-d-text-primary">
                  Reset paper account?
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-d-text-secondary">
                  All open paper positions will be closed and your cash balance will return to{' '}
                  <span className="text-d-text-primary font-medium">₹10,00,000</span>. Trade history is
                  preserved. Only positions and cash revert. This cannot be undone.
                </p>
              </div>
            </div>

            {resetError && (
              <div className="mt-3 rounded-sm border border-down/30 bg-down/10 px-3 py-2 text-[11px] text-down">
                {resetError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setResetOpen(false)}
                disabled={resetting}
                className="px-3 py-1.5 text-[12px] border border-line rounded-pill text-d-text-secondary hover:text-d-text-primary hover:bg-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-normal rounded-pill bg-down/20 border border-down/40 text-down hover:bg-down/30 transition-colors disabled:opacity-50"
              >
                {resetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                {resetting ? 'Resetting…' : 'Reset account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** KPI tone → token-backed value colour. `neutral` = primary text (no
 *  hex). Duotone up/down reserved for financial direction; warn for caution. */
type StatTone = 'up' | 'down' | 'warn' | 'neutral'
const STAT_TONE: Record<StatTone, string> = {
  up: 'text-up',
  down: 'text-down',
  warn: 'text-warning',
  neutral: 'text-d-text-primary',
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone: StatTone
}) {
  return (
    <div className={CARD}>
      <p className="font-mono text-[10px] text-d-text-muted uppercase tracking-[0.1em]">{label}</p>
      <p className={`${MONO} text-[20px] font-normal mt-0.5 ${STAT_TONE[tone]}`}>{value}</p>
      {sub && <p className="text-[10px] text-d-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function RiskBanner() {
  const [warnings, setWarnings] = useState<Array<{ key: string; severity: string; message: string }>>([])

  useEffect(() => {
    let alive = true
    api
      .riskStatus()
      .then((r) => {
        if (alive && r?.warnings?.length) setWarnings(r.warnings)
      })
      .catch(() => {
        /* honest-empty — no banner when the check is unavailable */
      })
    return () => {
      alive = false
    }
  }, [])

  if (warnings.length === 0) return null

  return (
    <div className="rounded-sm border border-l-[3px] border-warning/40 border-l-warning bg-warning/[0.06] p-4 space-y-1.5" role="status">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-d-text-muted flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3 text-warning" />
        Risk manager
      </p>
      {warnings.map((w) => (
        <p key={w.key} className="text-[11.5px] leading-relaxed text-warning">
          {w.message}
        </p>
      ))}
    </div>
  )
}
