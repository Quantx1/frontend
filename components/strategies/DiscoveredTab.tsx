'use client'

/**
 * DiscoveredTab (PR-G4) — UI for the Strategy Discovery Engine.
 *
 * Three nested views:
 *   1. Run list  — recent discovery batches with status + best score
 *   2. Run detail — top-K candidates from a selected run, sortable
 *   3. New-run modal — pick kind (equity_swing / equity_position /
 *      fo_weekly / fo_monthly) + sample size + universe, start
 *
 * The backend persists every run + candidate to Supabase. Promotion
 * copies the candidate DSL into the user's `user_strategies` table so
 * the existing My-strategies flow handles paper → live transitions.
 */

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  NumericInput,
  Skeleton,
  toast,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'

type DiscoveryKind =
  | 'equity_swing' | 'equity_position'
  | 'fo_weekly' | 'fo_monthly'
  | 'intraday_5m' | 'intraday_15m'

const KIND_LABELS: Record<DiscoveryKind, string> = {
  equity_swing: 'Equity · Swing (5–20 day hold)',
  equity_position: 'Equity · Position (20–90 day hold)',
  fo_weekly: 'F&O · Weekly contracts',
  fo_monthly: 'F&O · Monthly contracts',
  intraday_5m: 'Intraday · 5-minute bars',
  intraday_15m: 'Intraday · 15-minute bars',
}

const STATUS_TONE: Record<string, 'up' | 'down' | 'warning' | 'muted' | 'primary'> = {
  pending: 'muted',
  running: 'warning',
  completed: 'up',
  failed: 'down',
  cancelled: 'muted',
}

/** What a run row from /api/discovery/runs looks like in the UI. */
interface RunRow {
  id: string
  kind: string
  status: string
  started_at: string | null
  completed_at: string | null
  candidates_total: number
  candidates_viable: number
  best_score: number | null
  error: string | null
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────

export function DiscoveredTab() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [showNewRun, setShowNewRun] = useState(false)

  // Auto-refresh the run list every 5s while there's a running batch in
  // view; otherwise every 30s. Keeps the UI live without hammering API.
  const { data, error, mutate, isLoading } = useSWR(
    'discovery:runs',
    () => api.discovery.listRuns({ limit: 30 }),
    {
      revalidateOnFocus: false,
      refreshInterval: 5_000,
      keepPreviousData: true,
    },
  )

  const runs: RunRow[] = data?.runs ?? []

  if (selectedRunId) {
    return (
      <RunDetail
        runId={selectedRunId}
        onBack={() => setSelectedRunId(null)}
        onCandidatePromoted={() => mutate()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-d-text-primary">
            <Brain className="h-4 w-4 text-primary" />
            Strategy Discovery
          </h2>
          <p className="mt-0.5 text-xs text-d-text-muted">
            AI samples new strategies from the DSL space, backtests them across
            a basket of symbols, and ranks the survivors. Promote winners
            straight to your library.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => mutate()}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setShowNewRun(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            New discovery run
          </Button>
        </div>
      </div>

      {/* Error / empty / list */}
      {error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Could not load discovery runs"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : isLoading && runs.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} w="100%" h="72px" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-7 w-7" />}
          title="No discovery runs yet"
          description="Start a new run to have the engine sample, backtest, and rank new strategies for equity or F&O."
          action={
            <Button onClick={() => setShowNewRun(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Start one
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {runs.map((r) => (
            <RunRowCard
              key={r.id}
              run={r}
              onOpen={() => setSelectedRunId(r.id)}
            />
          ))}
        </div>
      )}

      {showNewRun && (
        <NewRunModal
          onClose={() => setShowNewRun(false)}
          onCreated={(runId) => {
            setShowNewRun(false)
            mutate()
            setSelectedRunId(runId)
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Run-row card (in the list view)
// ─────────────────────────────────────────────────────────────────────

function RunRowCard({ run, onOpen }: { run: RunRow; onOpen: () => void }) {
  const tone = STATUS_TONE[run.status] ?? 'muted'
  const duration = run.completed_at && run.started_at
    ? Math.max(0, (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : null
  const isLive = run.status === 'pending' || run.status === 'running'
  const kindLabel = KIND_LABELS[run.kind as DiscoveryKind] ?? run.kind

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={tone}>
              {isLive && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {run.status}
            </Badge>
            <p className="truncate font-medium text-d-text-primary">{kindLabel}</p>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-d-text-muted">
            {run.candidates_viable}/{run.candidates_total} viable
            {run.best_score != null && ` · best score ${run.best_score.toFixed(2)}`}
            {duration != null && ` · ${duration.toFixed(1)}s`}
            {run.error && ` · ${run.error.slice(0, 60)}`}
          </p>
        </button>
        <Button size="sm" variant="ghost" onClick={onOpen}>
          View candidates →
        </Button>
      </CardBody>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Run detail (top-K candidates list)
// ─────────────────────────────────────────────────────────────────────

function RunDetail({
  runId,
  onBack,
  onCandidatePromoted,
}: {
  runId: string
  onBack: () => void
  onCandidatePromoted: () => void
}) {
  // Run row — also auto-refreshed while status is non-terminal
  const { data: runData, mutate: mutateRun } = useSWR(
    ['discovery:run', runId],
    () => api.discovery.getRun(runId),
    {
      revalidateOnFocus: false,
      refreshInterval: 5_000,
      keepPreviousData: true,
    },
  )
  const isLive = runData?.status === 'pending' || runData?.status === 'running'

  const { data, mutate, isLoading, error } = useSWR(
    ['discovery:candidates', runId],
    () => api.discovery.listCandidates(runId, { limit: 30, only_viable: false }),
    {
      revalidateOnFocus: false,
      refreshInterval: isLive ? 5_000 : 0,
      keepPreviousData: true,
    },
  )

  const candidates = data?.candidates ?? []
  const kindLabel = runData
    ? (KIND_LABELS[runData.kind as DiscoveryKind] ?? runData.kind)
    : ''

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-1 text-xs text-d-text-muted hover:text-d-text-primary"
          >
            ← Back to runs
          </button>
          <h2 className="text-base font-semibold text-d-text-primary">
            {kindLabel || 'Run'}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-d-text-muted">
            run {runId.slice(0, 8)} · status {runData?.status ?? '—'}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => { mutate(); mutateRun() }}>
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Could not load candidates"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : isLoading && candidates.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} w="100%" h="90px" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-7 w-7" />}
          title={isLive ? 'Run still in progress' : 'No candidates yet'}
          description={
            isLive
              ? 'Backtests are running. Candidates appear as the run finishes — usually within 30-90s.'
              : 'This run completed without producing any usable candidates. Try a larger sample size or a different universe.'
          }
        />
      ) : (
        <div className="space-y-2">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              onPromoted={() => { mutate(); onCandidatePromoted() }}
              onArchived={() => mutate()}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Single-candidate card with score breakdown + promote/archive
// ─────────────────────────────────────────────────────────────────────

interface CandidateUI {
  id: string
  label: string
  score: number
  sharpe: number | null
  calmar: number | null
  max_drawdown_pct: number | null
  win_rate: number | null
  profit_factor: number | null
  total_return_pct: number | null
  trade_count: number | null
  avg_hold_days: number | null
  regime_scores: {
    bull?: number; sideways?: number; bear?: number
    bull_trades?: number; sideways_trades?: number; bear_trades?: number
  }
  status: 'candidate' | 'promoted' | 'archived' | 'failed'
}

function CandidateCard({
  candidate: c,
  onPromoted,
  onArchived,
}: {
  candidate: CandidateUI
  onPromoted: () => void
  onArchived: () => void
}) {
  const [busy, setBusy] = useState(false)

  const promote = async (mode: 'paper' | 'live') => {
    setBusy(true)
    try {
      const r = await api.discovery.promote(c.id, { mode })
      toast.success(`Promoted to ${mode}`, {
        description: `Strategy id ${r.user_strategy_id.slice(0, 8)}`,
      })
      onPromoted()
    } catch (e) {
      toast.error('Promote failed', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  const archive = async () => {
    if (!confirm('Archive this candidate? You can restore from the audit log later.')) return
    setBusy(true)
    try {
      await api.discovery.archive(c.id)
      onArchived()
    } catch (e) {
      toast.error('Archive failed', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  // Score colouring — green when score > 0.5, amber 0-0.5, red < 0.
  const scoreTone: 'up' | 'down' | 'warning' | 'muted' =
    c.score >= 0.5 ? 'up' : c.score >= 0 ? 'warning' : 'down'

  const regimeConcentrated = useMemo(() => {
    const total =
      (c.regime_scores.bull_trades ?? 0) +
      (c.regime_scores.sideways_trades ?? 0) +
      (c.regime_scores.bear_trades ?? 0)
    if (total === 0) return false
    const maxShare = Math.max(
      c.regime_scores.bull_trades ?? 0,
      c.regime_scores.sideways_trades ?? 0,
      c.regime_scores.bear_trades ?? 0,
    ) / total
    return maxShare > 0.85
  }, [c.regime_scores])

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={scoreTone}>score {c.score.toFixed(2)}</Badge>
              {c.status === 'promoted' && (
                <Badge tone="primary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  promoted
                </Badge>
              )}
              {c.status === 'archived' && <Badge tone="muted">archived</Badge>}
              {regimeConcentrated && (
                <Badge tone="warning">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  regime-concentrated
                </Badge>
              )}
            </div>
            <p className="mt-1 truncate font-mono text-xs text-d-text-secondary">
              {c.label}
            </p>
          </div>

          {c.status === 'candidate' && (
            <div className="flex items-center gap-1.5">
              <Button size="sm" onClick={() => promote('paper')} disabled={busy}>
                <Play className="mr-1 h-3.5 w-3.5" />
                Promote · Paper
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => promote('live')}
                disabled={busy}
              >
                Promote · Live
              </Button>
              <Button size="sm" variant="ghost" onClick={archive} disabled={busy}
                aria-label="Archive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-3 md:grid-cols-6">
          <Metric label="Sharpe" value={fmt(c.sharpe, 2)} />
          <Metric label="Calmar" value={fmt(c.calmar, 2)} />
          <Metric label="Max DD" value={c.max_drawdown_pct != null ? `${c.max_drawdown_pct.toFixed(1)}%` : '—'} />
          <Metric label="Win %" value={c.win_rate != null ? `${(c.win_rate * 100).toFixed(0)}%` : '—'} />
          <Metric label="PF" value={fmt(c.profit_factor, 2)} />
          <Metric label="Trades" value={c.trade_count?.toString() ?? '—'} />
        </div>

        {/* Per-regime mini bar */}
        {(c.regime_scores.bull_trades ?? 0) +
         (c.regime_scores.sideways_trades ?? 0) +
         (c.regime_scores.bear_trades ?? 0) > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[11px]">
            <span className="text-d-text-muted">Regime scores:</span>
            <RegimePill icon={<TrendingUp className="h-3 w-3" />} label="bull"
                       score={c.regime_scores.bull ?? 0}
                       trades={c.regime_scores.bull_trades ?? 0} />
            <RegimePill icon={<span className="h-3 w-3 rounded-full bg-d-text-muted/40" />}
                       label="sideways"
                       score={c.regime_scores.sideways ?? 0}
                       trades={c.regime_scores.sideways_trades ?? 0} />
            <RegimePill icon={<TrendingDown className="h-3 w-3" />} label="bear"
                       score={c.regime_scores.bear ?? 0}
                       trades={c.regime_scores.bear_trades ?? 0} />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-d-text-primary">
        {value}
      </p>
    </div>
  )
}

function RegimePill({
  icon, label, score, trades,
}: {
  icon: React.ReactNode; label: string; score: number; trades: number
}) {
  if (trades === 0) return null
  const tone = score > 0.3 ? 'up' : score < -0.1 ? 'down' : 'muted'
  return (
    <Badge tone={tone}>
      {icon}
      <span className="ml-1">
        {label} {score.toFixed(2)} · {trades}t
      </span>
    </Badge>
  )
}

function fmt(v: number | null, digits = 2): string {
  if (v == null) return '—'
  return v.toFixed(digits)
}

// ─────────────────────────────────────────────────────────────────────
// New-run modal
// ─────────────────────────────────────────────────────────────────────

function NewRunModal({
  onClose, onCreated,
}: {
  onClose: () => void
  onCreated: (runId: string) => void
}) {
  const [kind, setKind] = useState<DiscoveryKind>('equity_swing')
  const [mode, setMode] = useState<'random' | 'ga'>('random')
  const [universe, setUniverse] = useState('nifty50')
  const [sampleSize, setSampleSize] = useState(20)
  const [symbolsPerCandidate, setSymbolsPerCandidate] = useState(6)
  const [seed, setSeed] = useState(42)
  // GA knobs — only used when mode='ga'
  const [gaPopSize, setGaPopSize] = useState(12)
  const [gaGenerations, setGaGenerations] = useState(3)
  const [gaElite, setGaElite] = useState(4)
  const [gaChildren, setGaChildren] = useState(2)
  // Walk-forward folds (0 = off, 3 = standard 3-fold)
  const [walkForwardFolds, setWalkForwardFolds] = useState(0)
  const [busy, setBusy] = useState(false)

  // Switch universe options based on kind
  const universeOptions = kind.startsWith('fo_')
    ? ['NIFTY', 'BANKNIFTY', 'FINNIFTY']
    : kind.startsWith('intraday_')
      ? ['nifty50', 'nifty100']
      : ['nifty50', 'nifty100', 'nifty500']

  // Keep universe valid when kind changes
  useEffect(() => {
    if (kind.startsWith('fo_') && !['NIFTY', 'BANKNIFTY', 'FINNIFTY'].includes(universe)) {
      setUniverse('NIFTY')
    } else if (kind.startsWith('intraday_') && !['nifty50', 'nifty100'].includes(universe)) {
      setUniverse('nifty50')
    } else if (!kind.startsWith('fo_') && !kind.startsWith('intraday_') &&
               !['nifty50', 'nifty100', 'nifty500'].includes(universe)) {
      setUniverse('nifty50')
    }
  }, [kind, universe])

  const start = async () => {
    setBusy(true)
    try {
      const r = await api.discovery.createRun({
        kind, mode, universe,
        sample_size: sampleSize,
        symbols_per_candidate: symbolsPerCandidate, seed,
        ga_pop_size: gaPopSize,
        ga_generations: gaGenerations,
        ga_elite: gaElite,
        ga_children_per_elite: gaChildren,
        walk_forward_folds: walkForwardFolds,
      })
      const totalCandidates = mode === 'ga'
        ? gaPopSize * gaGenerations
        : sampleSize
      toast.success('Discovery run started', {
        description: `${mode === 'ga' ? 'GA' : 'Random'} · ${totalCandidates} candidates × ${kind.startsWith('fo_') ? 1 : symbolsPerCandidate} symbols`,
      })
      onCreated(r.run_id)
    } catch (e) {
      toast.error('Failed to start run', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-main shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-d-text-primary">
            <Sparkles className="h-4 w-4 text-primary" />
            New discovery run
          </h3>
          <button onClick={onClose} aria-label="Close"
                  className="text-d-text-muted hover:text-d-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {/* Kind */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              Strategy type
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {(Object.keys(KIND_LABELS) as DiscoveryKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    k === kind
                      ? 'border-primary bg-primary/10 text-d-text-primary'
                      : 'border-line bg-wrap text-d-text-secondary hover:border-line/80 hover:text-d-text-primary'
                  }`}
                >
                  <span>{KIND_LABELS[k]}</span>
                  {k === kind && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Universe */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              {kind.startsWith('fo_') ? 'Underlying' : 'Universe tier'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {universeOptions.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUniverse(u)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    u === universe
                      ? 'border-primary bg-primary/10 text-d-text-primary'
                      : 'border-line bg-wrap text-d-text-secondary hover:text-d-text-primary'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Search mode — random vs GA */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              Search mode
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMode('random')}
                className={`rounded-md border px-3 py-2 text-left text-xs ${
                  mode === 'random'
                    ? 'border-primary bg-primary/10 text-d-text-primary'
                    : 'border-line bg-wrap text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                <div className="font-medium">Random</div>
                <div className="text-[10px] text-d-text-muted">N independent draws — fast + broad</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('ga')}
                className={`rounded-md border px-3 py-2 text-left text-xs ${
                  mode === 'ga'
                    ? 'border-primary bg-primary/10 text-d-text-primary'
                    : 'border-line bg-wrap text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                <div className="font-medium">Genetic (GA)</div>
                <div className="text-[10px] text-d-text-muted">Survivors breed mutated children — focused</div>
              </button>
            </div>
          </div>

          {/* Sizing — different controls for random vs GA */}
          {mode === 'random' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Sample size (5–60)
                </p>
                <NumericInput
                  value={sampleSize}
                  onChange={(v) => setSampleSize(Math.max(5, Math.min(60, v ?? 20)))}
                  min={5} max={60} step={5}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Seed
                </p>
                <NumericInput
                  value={seed}
                  onChange={(v) => setSeed(v ?? 42)}
                  min={0} max={999999} step={1}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Pop size (4–30)
                </p>
                <NumericInput
                  value={gaPopSize}
                  onChange={(v) => setGaPopSize(Math.max(4, Math.min(30, v ?? 12)))}
                  min={4} max={30} step={1}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Generations (1–6)
                </p>
                <NumericInput
                  value={gaGenerations}
                  onChange={(v) => setGaGenerations(Math.max(1, Math.min(6, v ?? 3)))}
                  min={1} max={6} step={1}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Elite survivors
                </p>
                <NumericInput
                  value={gaElite}
                  onChange={(v) => setGaElite(Math.max(1, Math.min(gaPopSize - 1, v ?? 4)))}
                  min={1} max={Math.max(1, gaPopSize - 1)} step={1}
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Children / elite
                </p>
                <NumericInput
                  value={gaChildren}
                  onChange={(v) => setGaChildren(Math.max(1, Math.min(5, v ?? 2)))}
                  min={1} max={5} step={1}
                />
              </div>
            </div>
          )}

          {/* Symbols / candidate + walk-forward + seed (GA-only seed row) */}
          <div className="grid grid-cols-2 gap-3">
            {!kind.startsWith('fo_') && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Symbols / candidate
                </p>
                <NumericInput
                  value={symbolsPerCandidate}
                  onChange={(v) => setSymbolsPerCandidate(Math.max(1, Math.min(20, v ?? 6)))}
                  min={1} max={20} step={1}
                />
              </div>
            )}
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                Walk-forward folds
              </p>
              <div className="flex gap-1">
                {[0, 2, 3, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setWalkForwardFolds(n)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${
                      walkForwardFolds === n
                        ? 'border-primary bg-primary/10 text-d-text-primary'
                        : 'border-line bg-wrap text-d-text-secondary hover:text-d-text-primary'
                    }`}
                  >
                    {n === 0 ? 'Off' : `${n}-fold`}
                  </button>
                ))}
              </div>
            </div>
            {mode === 'ga' && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  Seed
                </p>
                <NumericInput
                  value={seed}
                  onChange={(v) => setSeed(v ?? 42)}
                  min={0} max={999999} step={1}
                />
              </div>
            )}
          </div>

          <p className="rounded-md border border-line bg-wrap p-2.5 text-[11px] text-d-text-muted">
            {mode === 'random' ? (
              <>
                Random sample: {sampleSize} candidates × {kind.startsWith('fo_') ? 1 : symbolsPerCandidate} symbols.
              </>
            ) : (
              <>
                GA: {gaPopSize} candidates × {gaGenerations} generations
                = {gaPopSize * gaGenerations} total scorings.
                Top {gaElite} survive each gen → {gaChildren} mutated children each.
              </>
            )}
            {walkForwardFolds > 1 && ` Walk-forward enabled (${walkForwardFolds} folds).`}
            {' '}Typical wall time: {Math.round((mode === 'ga' ? gaPopSize * gaGenerations : sampleSize) * (kind.startsWith('fo_') ? 1 : symbolsPerCandidate) * (walkForwardFolds > 1 ? 0.25 : 0.15))}–
            {Math.round((mode === 'ga' ? gaPopSize * gaGenerations : sampleSize) * (kind.startsWith('fo_') ? 1 : symbolsPerCandidate) * (walkForwardFolds > 1 ? 0.6 : 0.4))}s.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={start} disabled={busy}>
            {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            Start run
          </Button>
        </div>
      </div>
    </div>
  )
}
