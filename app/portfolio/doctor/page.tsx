'use client'

/**
 * /portfolio/doctor — F7 Portfolio Doctor (Pro+, Elite unlimited).
 *
 * Upload-or-broker flow → InsightAI 4-agent CoT per position →
 * composite portfolio score + risk flags + action recommendation.
 *
 * Persistence: ``portfolio_doctor_reports`` table (PR 34 migration).
 * Tier enforced at ``/api/portfolio/doctor/analyze`` by
 * ``RequireFeature("portfolio_doctor_pro")`` + monthly quota check.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ClipboardList,
  Download,
  Loader2,
  PlusCircle,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from '@/lib/icons'

import { AppShell } from '@/components/shell/AppShell'
import { EyebrowMono } from '@/components/foundation'
import RebalanceCard from '@/components/portfolio/RebalanceCard'
import {
  api,
  handleApiError,
  type DoctorReport,
  type DoctorRiskFlag,
  type DoctorPositionResult,
} from '@/lib/api'
import { publicLabel } from '@/lib/models'
import { stockHref } from '@/lib/stock-href'
import { MONO } from '@/lib/tokens'

type PositionDraft = {
  symbol: string
  weight: string   // user types percentages → converted on submit
}

const DEFAULT_DRAFT: PositionDraft = { symbol: '', weight: '' }

/* ── Tri-theme-safe tone system ─────────────────────────────────────
 * No hex anywhere. A tone enum maps a score / severity to a coherent
 * set of token-backed Tailwind utilities. `text` for inline numerics
 * (replaces the old `style={{ color }}`); `tint` for the tinted panels
 * (replaces `${color}10`/`${color}55` inline backgrounds). */
type Tone = 'good' | 'ok' | 'warn' | 'bad' | 'muted'

const TONE_TEXT: Record<Tone, string> = {
  good: 'text-up',
  ok: 'text-d-text-primary',
  warn: 'text-warning',
  bad: 'text-down',
  muted: 'text-d-text-muted',
}

/** Tinted panel/pill surface — border + bg + text in one token-safe set. */
const TONE_TINT: Record<Tone, string> = {
  good: 'border-up/40 bg-up/10 text-up',
  ok: 'border-line bg-wrap-hover text-d-text-primary',
  warn: 'border-warning/40 bg-warning/10 text-warning',
  bad: 'border-down/40 bg-down/10 text-down',
  muted: 'border-line bg-wrap-hover text-d-text-muted',
}

function toneForScore(score: number): Tone {
  if (score >= 70) return 'good'
  if (score >= 55) return 'ok'
  if (score >= 40) return 'warn'
  return 'bad'
}


export default function PortfolioDoctorPage() {
  const [quota, setQuota] = useState<Awaited<ReturnType<typeof api.portfolioDoctor.quota>> | null>(null)
  const [history, setHistory] = useState<Awaited<ReturnType<typeof api.portfolioDoctor.reports>>>([])
  const [positions, setPositions] = useState<PositionDraft[]>([DEFAULT_DRAFT, { ...DEFAULT_DRAFT }])
  const [capital, setCapital] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<DoctorReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const [q, h] = await Promise.all([
        api.portfolioDoctor.quota(),
        api.portfolioDoctor.reports(20).catch(() => []),
      ])
      setQuota(q)
      setHistory(h || [])
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const totalWeight = useMemo(
    () => positions.reduce((s, p) => s + (parseFloat(p.weight) || 0), 0),
    [positions],
  )
  const weightOk = Math.abs(totalWeight - 100) < 0.5
  const canRun =
    !running && positions.length > 0 &&
    positions.every((p) => p.symbol.trim()) && weightOk

  const addPosition = () => setPositions((p) => [...p, { ...DEFAULT_DRAFT }])
  const removePosition = (i: number) =>
    setPositions((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))
  const updatePos = (i: number, patch: Partial<PositionDraft>) =>
    setPositions((p) => p.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const payload = {
        source: 'manual' as const,
        capital: capital ? Number(capital) : undefined,
        positions: positions.map((p) => ({
          symbol: p.symbol.trim().toUpperCase().replace(/\.NS$/, ''),
          weight: Math.max(0, Math.min(1, (parseFloat(p.weight) || 0) / 100)),
        })),
      }
      const r = await api.portfolioDoctor.analyze(payload)
      setReport(r)
      setQuota({ ...r.quota, engine: quota?.engine ?? publicLabel('cot_agents') })
      refresh()
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setRunning(false)
    }
  }

  const reset = () => {
    setReport(null)
    setError(null)
  }

  // ---------- render

  return (
    <AppShell>
      <div className="w-full space-y-5 p-4 md:p-6 xl:px-8">
        <PageHeader quota={quota} engine={quota?.engine} />

        {error && !report && (
          <div className="rounded-sm border border-down/40 bg-down/10 px-4 py-3 text-[12px] text-down">
            {error}
          </div>
        )}

        {report ? (
          <ReportView report={report} onBack={reset} />
        ) : (
          <>
            {/* Quota banner */}
            {quota && <QuotaBanner quota={quota} />}

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <HoldingsForm
                  positions={positions}
                  capital={capital}
                  setCapital={setCapital}
                  totalWeight={totalWeight}
                  weightOk={weightOk}
                  addPosition={addPosition}
                  removePosition={removePosition}
                  updatePos={updatePos}
                  canRun={canRun}
                  running={running}
                  onRun={run}
                />
              </div>
              <div className="space-y-4">
                <HistoryPanel history={history} onPick={async (id) => {
                  try {
                    const r = await api.portfolioDoctor.report(id)
                    setReport(r)
                  } catch (err) {
                    setError(handleApiError(err))
                  }
                }} />
              </div>
            </section>
          </>
        )}

        <p className="text-[10px] text-d-text-muted text-center">
          Portfolio Doctor is an AI-generated educational review, not personalised investment advice.
          SEBI-compliant tool. Past model accuracy is not predictive of future results.
        </p>
      </div>
    </AppShell>
  )
}


/* ───────────────────────── components ───────────────────────── */


function PageHeader({
  quota,
  engine,
}: {
  quota: { tier: string; runs_this_month: number; quota: number | null } | null
  engine?: string
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
      <div>
        <EyebrowMono className="mb-1.5">F7 · Portfolio Doctor</EyebrowMono>
        <h1 className="font-display text-[26px] font-normal text-d-text-primary flex items-center gap-2.5">
          <Stethoscope className="w-5 h-5 text-d-text-secondary" />
          Portfolio Doctor
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] rounded-sm px-2 py-0.5 bg-ai/10 text-ai border border-ai/30">
            Pro
          </span>
        </h1>
        <p className="text-[12px] text-d-text-secondary mt-1 max-w-2xl">
          An AI agent grades every holding on concentration, sector exposure, drawdown risk &amp; news sentiment, then rolls it up to one portfolio score. AI-reasoned guidance, not a substitute for your own research.
        </p>
      </div>
    </header>
  )
}


function QuotaBanner({ quota }: { quota: { tier: string; runs_this_month: number; quota: number | null; remaining: number | null } }) {
  const unlimited = quota.quota === null
  const low = !unlimited && quota.remaining !== null && quota.remaining <= 0
  const tone: Tone = low ? 'bad' : unlimited ? 'good' : 'warn'
  return (
    <section
      className={`rounded-[20px] border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 ${TONE_TINT[tone]}`}
    >
      <p className="text-[12px]">
        {unlimited
          ? `Unlimited runs this month (tier: ${quota.tier})`
          : low
            ? `Monthly quota exhausted · ${quota.runs_this_month}/${quota.quota} used`
            : `${quota.runs_this_month}/${quota.quota} runs used this month · ${quota.remaining} remaining`}
      </p>
      {low && (
        <Link href="/pricing" className="text-[11px] font-medium text-d-text-primary underline-offset-2 hover:underline">
          Upgrade to Elite for unlimited →
        </Link>
      )}
    </section>
  )
}


function HoldingsForm({
  positions,
  capital,
  setCapital,
  totalWeight,
  weightOk,
  addPosition,
  removePosition,
  updatePos,
  canRun,
  running,
  onRun,
}: {
  positions: PositionDraft[]
  capital: string
  setCapital: (v: string) => void
  totalWeight: number
  weightOk: boolean
  addPosition: () => void
  removePosition: (i: number) => void
  updatePos: (i: number, patch: Partial<PositionDraft>) => void
  canRun: boolean
  running: boolean
  onRun: () => void
}) {
  return (
    <div className="rounded-[20px] border border-line bg-wrap p-5">
      <h2 className="text-[14px] font-normal text-d-text-primary flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-d-text-secondary" />
        Your holdings
      </h2>

      <div className="mb-4">
        <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-d-text-muted mb-1">
          Capital (optional)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-d-text-secondary">₹</span>
          <input
            type="number"
            min={0}
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            placeholder="500000"
            className={`${MONO} flex-1 bg-main border border-line rounded-xl px-3 py-1.5 text-[13px] text-d-text-primary focus:outline-none focus:border-d-text-muted`}
          />
        </div>
      </div>

      <div className="space-y-2">
        {positions.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={p.symbol}
              onChange={(e) => updatePos(i, { symbol: e.target.value.toUpperCase() })}
              placeholder="TCS"
              className="flex-1 bg-main border border-line rounded-xl px-3 py-1.5 text-[13px] text-d-text-primary focus:outline-none focus:border-d-text-muted"
            />
            <div className="relative w-28">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={p.weight}
                onChange={(e) => updatePos(i, { weight: e.target.value })}
                placeholder="25"
                className={`${MONO} w-full bg-main border border-line rounded-xl px-3 py-1.5 pr-6 text-[13px] text-d-text-primary focus:outline-none focus:border-d-text-muted`}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-d-text-muted">%</span>
            </div>
            <button
              onClick={() => removePosition(i)}
              disabled={positions.length <= 1}
              className="p-1.5 rounded-sm glass-control text-d-text-muted hover:text-down disabled:opacity-40 disabled:hover:text-d-text-muted"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addPosition}
        disabled={positions.length >= 30}
        className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-d-text-secondary hover:text-d-text-primary disabled:opacity-50"
      >
        <PlusCircle className="w-3 h-3" />
        Add holding ({positions.length}/30)
      </button>

      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
        <p className={`text-[11px] ${MONO} ${weightOk ? 'text-up' : 'text-warning'}`}>
          Weights sum to {totalWeight.toFixed(1)}%
          {!weightOk && ' · must total 100% to run'}
        </p>
        <button
          onClick={onRun}
          disabled={!canRun}
          className="inline-flex items-center gap-2 px-5 py-2 glass-control-accent rounded-full text-[12px] font-normal active:scale-[0.97] transition-[transform,opacity] duration-150 ease-out disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {running ? 'Grading holdings…' : 'Grade my portfolio'}
        </button>
      </div>
    </div>
  )
}


function HistoryPanel({
  history,
  onPick,
}: {
  history: Awaited<ReturnType<typeof api.portfolioDoctor.reports>>
  onPick: (id: string) => void
}) {
  return (
    <div className="rounded-[20px] border border-line bg-wrap overflow-hidden">
      <div className="px-5 py-3 border-b border-line">
        <p className="text-[13px] font-normal text-d-text-primary">Past checkups</p>
        <p className="text-[10px] text-d-text-muted">your last 20 AI portfolio reports</p>
      </div>
      {history.length === 0 ? (
        <div className="p-6 text-center text-[12px] text-d-text-muted">
          No checkups yet. Grade your portfolio to get your first AI report.
        </div>
      ) : (
        <div className="divide-y divide-line max-h-[500px] overflow-y-auto">
          {history.map((r) => (
            <button
              key={r.id}
              onClick={() => onPick(r.id)}
              className="w-full text-left px-5 py-3 hover:bg-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className={`text-[12px] text-d-text-primary ${MONO}`}>
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <span className={`${MONO} text-[12px] font-medium ${TONE_TEXT[toneForScore(r.composite_score)]}`}>
                  {r.composite_score}/100
                </span>
              </div>
              <p className="text-[10px] text-d-text-muted mt-0.5">
                {r.position_count} positions · {r.action.replace('_', ' ')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


function ReportView({ report, onBack }: { report: DoctorReport; onBack: () => void }) {
  const tone = toneForScore(report.composite_score)
  const high = report.risk_flags.filter((f) => f.severity === 'high')
  const medium = report.risk_flags.filter((f) => f.severity === 'medium')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] text-d-text-secondary hover:text-d-text-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          New checkup
        </button>
        {/* PR 67 — print → save-as-PDF. Browser print dialog
            handles PDF generation natively; the print stylesheet
            below hides nav + form chrome so the report prints clean. */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.print()
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-control text-[11px] text-d-text-primary"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>

      {/* Composite strip — tone-tinted, token-safe (no inline hex) */}
      <section className={`rounded-[20px] border border-l-[3px] p-5 ${TONE_TINT[tone]}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-d-text-muted">
              Composite portfolio score
            </p>
            <p className={`${MONO} text-[40px] font-normal mt-1 ${TONE_TEXT[tone]}`}>
              {report.composite_score}
              <span className="text-[18px] text-d-text-muted font-normal">/100</span>
            </p>
          </div>
          {report.diversification_score != null && (
            <div className="min-w-[120px]">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-d-text-muted">Diversification</p>
              <p className={`${MONO} text-[22px] font-normal mt-1 ${TONE_TEXT[toneForScore(report.diversification_score)]}`}>
                {report.diversification_score}<span className="text-[12px] text-d-text-muted font-normal">/100</span>
              </p>
            </div>
          )}
          {report.risk_score != null && (
            <div className="min-w-[120px]">
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-d-text-muted">Risk control</p>
              <p className={`${MONO} text-[22px] font-normal mt-1 ${TONE_TEXT[toneForScore(report.risk_score)]}`}>
                {report.risk_score}<span className="text-[12px] text-d-text-muted font-normal">/100</span>
              </p>
            </div>
          )}
          <div className="min-w-[160px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-d-text-muted">Action</p>
            <p className="text-[15px] font-normal text-d-text-primary mt-1 capitalize">
              {report.action.replace('_', ' ')}
            </p>
          </div>
          <div className="min-w-[120px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-d-text-muted">Generated</p>
            <p className={`text-[13px] text-d-text-primary ${MONO} mt-1`}>
              {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
              {new Date(report.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-d-text-secondary leading-relaxed">
          {report.narrative}
        </p>
      </section>

      {/* Risk flags */}
      {report.risk_flags.length > 0 && (
        <section className="rounded-[20px] border border-line bg-wrap p-5">
          <h3 className="text-[14px] font-normal text-d-text-primary flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Risk flags
          </h3>
          <div className="space-y-2">
            {[...high, ...medium].map((f, i) => <RiskFlagRow key={i} f={f} />)}
          </div>
        </section>
      )}

      {/* AI rebalancing (user-triggered) */}
      <RebalanceCard positions={report.per_position.map((p) => ({ symbol: p.symbol, weight: p.weight }))} />

      {/* Per-position grid */}
      <section className="rounded-[20px] border border-line bg-wrap overflow-hidden">
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <h3 className="text-[14px] font-normal text-d-text-primary">
            AI grade per holding · {report.per_position.length} positions
          </h3>
          <p className="text-[10px] text-d-text-muted">
            weakest first
          </p>
        </div>
        <div className="divide-y divide-line">
          {[...report.per_position]
            .sort((a, b) => a.composite_score - b.composite_score)
            .map((p) => <PositionRow key={p.symbol} p={p} />)}
        </div>
      </section>
    </div>
  )
}


function RiskFlagRow({ f }: { f: DoctorRiskFlag }) {
  const sev = f.severity
  const tone: Tone = sev === 'high' ? 'bad' : sev === 'medium' ? 'warn' : 'muted'
  return (
    <div className="tile-tint flex items-start gap-3 px-3 py-2.5">
      <span
        className={`mt-0.5 font-mono text-[9px] tracking-[0.1em] uppercase rounded-sm px-1.5 py-0.5 border ${TONE_TINT[tone]}`}
      >
        {sev}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-d-text-primary leading-snug">{f.message}</p>
        <p className="text-[10px] text-d-text-muted mt-0.5 capitalize">{f.kind.replace('_', ' ')}</p>
      </div>
    </div>
  )
}


function PositionRow({ p }: { p: DoctorPositionResult }) {
  const tone = toneForScore(p.composite_score)
  return (
    <div className="px-5 py-3 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={stockHref(p.symbol)}
            className="text-[13px] font-normal text-d-text-primary hover:text-d-text-secondary"
          >
            {p.symbol}
          </Link>
          <span className={`text-[10px] text-d-text-muted ${MONO}`}>
            {(p.weight * 100).toFixed(1)}% of portfolio
          </span>
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm border ${TONE_TINT[tone]}`}
          >
            {p.action}
          </span>
        </div>
        {p.narrative && (
          <p className="text-[11px] text-d-text-secondary mt-1 leading-relaxed">
            {p.narrative}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-d-text-muted">Score</p>
        <p className={`${MONO} text-[16px] font-medium ${TONE_TEXT[tone]}`}>
          {p.composite_score}
        </p>
      </div>
    </div>
  )
}
