'use client'

/**
 * /fo-strategies (PR-AU) — F&O strategies dashboard.
 *
 * Three surfaces in one page:
 *   1. Recommendation grid (live rule-based proposals — F6 Elite)
 *      One card per symbol/strategy with view, breakevens, max P/L,
 *      probability of profit. Each card has a "Deploy to paper" button.
 *   2. Open paper positions panel
 *      Live mark-to-market P&L on every multi-leg position, per-leg
 *      breakdown, and a "Close" button.
 *   3. Recently closed positions (last 10) for an audit trail.
 *
 * Backed by:
 *   GET  /api/fo-strategies/overview            — recommendations
 *   POST /api/fo-strategies/paper/open          — deploy to paper
 *   GET  /api/fo-strategies/paper/positions     — open + recent positions (MTM)
 *   POST /api/fo-strategies/paper/{id}/close    — close at current marks
 */

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  CartesianGrid, ComposedChart, Legend, Line, ReferenceLine,
  ResponsiveContainer, Scatter, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts'
import {
  AlertTriangle, BarChart3, Brain, CheckCircle2, ChevronRight, Loader2, Radio,
  RefreshCw, Sparkles, Target, TrendingDown, TrendingUp, Wrench, XCircle,
} from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  EmptyState,
  DisclaimerFooter,
  NumericInput,
  PageHeader,
  Skeleton,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@/components/foundation'
import OptionsCopilotCard from '@/components/fno/OptionsCopilotCard'
import { api, handleApiError, type FoStrategyProposal } from '@/lib/api'
import { AI } from '@/lib/tokens'

const SWR_RECS = {
  revalidateOnFocus: false,
  refreshInterval: 5 * 60_000,   // 5 min — recommendations refresh slowly
  dedupingInterval: 60_000,
  keepPreviousData: true,
}
const SWR_POSITIONS = {
  revalidateOnFocus: false,
  refreshInterval: 30_000,       // 30s — live MTM
  dedupingInterval: 10_000,
  keepPreviousData: true,
}

const fmtInr = (n: number | null | undefined, decimals = 0) => {
  if (n == null) return '—'
  const sign = n < 0 ? '-' : n > 0 ? '+' : ''
  return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: decimals })}`
}

const fmtInrAbs = (n: number | null | undefined, decimals = 0) =>
  n == null ? '—' : `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: decimals })}`

const fmtPct = (n: number | null | undefined, decimals = 1) =>
  n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`

const STRATEGY_LABEL: Record<string, string> = {
  iron_condor: 'Iron Condor',
  bull_call_spread: 'Bull Call Spread',
  bear_put_spread: 'Bear Put Spread',
  long_straddle: 'Long Straddle',
  short_strangle: 'Short Strangle',
  iron_butterfly: 'Iron Butterfly',
}

export function FoStrategiesWorkspace() {
  const { data: overview, isLoading: recsLoading, mutate: refreshRecs } = useSWR(
    'fo:overview',
    () => api.foStrategies.overview(),
    SWR_RECS,
  )
  const { data: posResp, isLoading: posLoading, mutate: refreshPositions } = useSWR(
    'fo:paper:positions',
    () => api.foStrategies.paperPositions(),
    SWR_POSITIONS,
  )

  const [deployFor, setDeployFor] = useState<FoStrategyProposal | null>(null)
  const [lots, setLots] = useState<number>(1)
  const [deploying, setDeploying] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)

  // PR-AW.2 — Inline backtest modal state per recommendation card
  const [backtestFor, setBacktestFor] = useState<FoStrategyProposal | null>(null)
  const [backtestResult, setBacktestResult] = useState<Record<string, any> | null>(null)
  const [backtestLoading, setBacktestLoading] = useState(false)
  const [backtestError, setBacktestError] = useState<string | null>(null)

  // PR-BD — AI strategy suggestion modal state
  // PR-BE — adds includePortfolio toggle so the AI can size hedges
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiSymbol, setAiSymbol] = useState<'NIFTY' | 'BANKNIFTY' | 'FINNIFTY'>('NIFTY')
  const [aiCapital, setAiCapital] = useState<number | ''>('')
  const [aiIncludePortfolio, setAiIncludePortfolio] = useState(false)
  const [aiFocusSymbol, setAiFocusSymbol] = useState('')
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiResult, setAiResult] = useState<Awaited<
    ReturnType<typeof api.foStrategies.aiSuggest>
  > | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const allRecs: FoStrategyProposal[] = useMemo(() => {
    if (!overview) return []
    const out: FoStrategyProposal[] = []
    for (const recs of Object.values(overview.recommendations ?? {})) {
      out.push(...(recs as FoStrategyProposal[]))
    }
    return out
  }, [overview])

  const positions = posResp?.positions ?? []
  const openPositions = positions.filter((p) => p.status === 'open')
  const closedPositions = positions.filter((p) => p.status !== 'open').slice(0, 10)

  // Aggregate stats across all open positions
  const stats = useMemo(() => {
    return openPositions.reduce(
      (acc, p) => {
        acc.unrealized += Number(p.unrealized_pnl) || 0
        acc.maxLoss += Number(p.max_loss) || 0
        return acc
      },
      { unrealized: 0, maxLoss: 0 },
    )
  }, [openPositions])

  const realizedTotal = useMemo(
    () =>
      closedPositions.reduce(
        (acc, p) => acc + (Number(p.realized_pnl) || 0),
        0,
      ),
    [closedPositions],
  )

  const handleDeploy = async () => {
    if (!deployFor) return
    setDeploying(true)
    try {
      const r = await api.foStrategies.paperOpen({
        template: deployFor.strategy,
        symbol: deployFor.symbol,
        lots,
      })
      toast.success(
        `Deployed ${STRATEGY_LABEL[deployFor.strategy] ?? deployFor.strategy} on ${deployFor.symbol}`,
        { description: `Net premium: ${fmtInr(r.net_premium)} · ${lots} lot(s)` },
      )
      setDeployFor(null)
      setLots(1)
      refreshPositions()
    } catch (e) {
      toast.error('Deploy failed', { description: handleApiError(e) })
    } finally {
      setDeploying(false)
    }
  }

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return
    setAiSuggesting(true)
    setAiResult(null)
    setAiError(null)
    try {
      const r = await api.foStrategies.aiSuggest({
        prompt: aiPrompt.trim(),
        symbol: aiSymbol,
        capital_inr: aiCapital === '' ? undefined : Number(aiCapital),
        include_portfolio: aiIncludePortfolio,
        focus_symbol: aiFocusSymbol.trim() ? aiFocusSymbol.trim().toUpperCase() : undefined,
      })
      setAiResult(r)
    } catch (e) {
      setAiError(handleApiError(e))
    } finally {
      setAiSuggesting(false)
    }
  }

  const deployAISuggestion = async () => {
    if (!aiResult) return
    setAiSuggesting(true)
    try {
      const r = await api.foStrategies.paperOpen({
        template: aiResult.template,
        symbol: aiResult.symbol,
        lots: aiResult.lots_suggestion,
      })
      toast.success(`Deployed AI suggestion · ${aiResult.template}`, {
        description: `Net premium ${fmtInr(r.net_premium)} · ${aiResult.lots_suggestion} lot(s)`,
      })
      setAiOpen(false)
      setAiResult(null)
      setAiPrompt('')
      setAiCapital('')
      refreshPositions()
    } catch (e) {
      toast.error('Deploy failed', { description: handleApiError(e) })
    } finally {
      setAiSuggesting(false)
    }
  }

  const handleBacktest = async (rec: FoStrategyProposal) => {
    setBacktestFor(rec)
    setBacktestResult(null)
    setBacktestError(null)
    setBacktestLoading(true)
    try {
      const r = await api.foStrategies.backtestTemplate({
        template: rec.strategy,
        symbol: rec.symbol,
        lookback_days: 180,
        initial_capital: 100_000,
      })
      setBacktestResult(r)
    } catch (e) {
      setBacktestError(handleApiError(e))
    } finally {
      setBacktestLoading(false)
    }
  }

  const handleClose = async (positionId: string) => {
    setClosingId(positionId)
    try {
      const r = await api.foStrategies.paperClose(positionId)
      toast.success('Position closed', {
        description: `Realised ${fmtInr(r.realized_pnl)} (${fmtPct(r.realized_pnl_pct)})`,
      })
      refreshPositions()
    } catch (e) {
      toast.error('Close failed', { description: handleApiError(e) })
    } finally {
      setClosingId(null)
    }
  }

  return (
    <div className="w-full space-y-5">
      <PageHeader
        eyebrow="AI options desk"
        title="Options strategies"
        description="Regime-aware, rule-based multi-leg structures for NIFTY / BANKNIFTY / FINNIFTY, scored against live VIX. Ask the AI copilot for a structure, deploy to paper, and watch live mark-to-market P&L."
        actions={
          <>
            <Button onClick={() => setAiOpen(true)}>
              <Brain className="mr-1 h-4 w-4" />
              Ask the AI
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                refreshRecs()
                refreshPositions()
              }}
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Refresh</span>
            </Button>
          </>
        }
      />

      {/* ─── Header KPIs ─── */}
      <section
        aria-label="Aggregate stats"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <StatCard
          label="Open positions"
          value={String(openPositions.length)}
          loading={posLoading && !posResp}
        />
        <StatCard
          label="Unrealized P&L"
          value={
            <span className={stats.unrealized >= 0 ? 'text-up' : 'text-down'}>
              {fmtInr(stats.unrealized)}
            </span>
          }
          loading={posLoading && !posResp}
        />
        <StatCard
          label="Realized P&L (last 10 closed)"
          value={
            <span className={realizedTotal >= 0 ? 'text-up' : 'text-down'}>
              {fmtInr(realizedTotal)}
            </span>
          }
          loading={posLoading && !posResp}
        />
        <StatCard
          label="Max risk exposed"
          value={fmtInrAbs(stats.maxLoss)}
          tooltip="Risk-gated view: sum of max_loss across all open positions. Naked positions = unbounded; not counted."
          loading={posLoading && !posResp}
        />
      </section>

      {/* ─── Market context strip ─── */}
      {overview?.regime && (
        <Card className="border-line bg-wrap/60">
          <CardBody className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-xs">
            <Meta label="Regime" value={overview.regime.name} />
            <Meta
              label="VIX"
              value={
                overview.vix.current != null
                  ? `${overview.vix.current.toFixed(2)} (${overview.vix.direction})`
                  : '—'
              }
            />
            <Meta
              label="VIX 5d mean"
              value={overview.vix.mean_5d != null ? overview.vix.mean_5d.toFixed(2) : '—'}
            />
            <span className="ml-auto text-d-text-muted">
              as of {new Date(overview.as_of).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </CardBody>
        </Card>
      )}

      {/* AIL v2 P3 — Options Copilot agent (plain-English options Q&A over live market context) */}
      <OptionsCopilotCard />

      <Tabs defaultValue="recommendations">
        <TabsList>
          <TabsTrigger value="recommendations">
            Recommendations {allRecs.length > 0 && (
              <Badge tone="primary" className="ml-2">{allRecs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="open">
            Open {openPositions.length > 0 && (
              <Badge tone="primary" className="ml-2">{openPositions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed {closedPositions.length > 0 && (
              <Badge className="ml-2">{closedPositions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chain">Chain</TabsTrigger>
        </TabsList>

        {/* ─── Recommendations ─── */}
        <TabsContent value="recommendations" className="mt-4">
          {recsLoading && !overview ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} w="100%" h="240px" />)}
            </div>
          ) : allRecs.length === 0 ? (
            <EmptyState
              icon={<Target className="h-8 w-8" />}
              title="No structures flagged right now"
              description="The engine ranks multi-leg structures per index symbol from the current regime + VIX slope. In a transition tape none may clear. Check back at the next 9:30 IST refresh."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {allRecs.map((r, i) => (
                <RecommendationCard
                  key={`${r.symbol}-${r.strategy}-${i}`}
                  rec={r}
                  onDeploy={() => {
                    setDeployFor(r)
                    setLots(1)
                  }}
                  onBacktest={() => handleBacktest(r)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Open positions ─── */}
        <TabsContent value="open" className="mt-4">
          {posLoading && !posResp ? (
            <Skeleton w="100%" h="200px" />
          ) : openPositions.length === 0 ? (
            <EmptyState
              icon={<Radio className="h-8 w-8" />}
              title="No open paper positions"
              description="Pick a flagged structure above and click Deploy to paper to open a multi-leg position. The book marks to market live, refreshed every 30 seconds."
            />
          ) : (
            <div className="space-y-3">
              {openPositions.map((p) => (
                <OpenPositionCard
                  key={p.id}
                  position={p}
                  closing={closingId === p.id}
                  onClose={() => handleClose(p.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Closed ─── */}
        <TabsContent value="closed" className="mt-4">
          {closedPositions.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8" />}
              title="No closed positions yet"
              description="Closed positions appear here with realised P&L + exit reason."
            />
          ) : (
            <div className="space-y-2">
              {closedPositions.map((p) => (
                <ClosedPositionRow key={p.id} position={p} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Live option chain (PR-AX) ─── */}
        <TabsContent value="chain" className="mt-4">
          <OptionChainPanel />
        </TabsContent>
      </Tabs>

      {/* ─── Deploy confirmation modal ─── */}
      <Dialog
        open={!!deployFor}
        onClose={() => {
          if (deploying) return
          setDeployFor(null)
          setLots(1)
        }}
        title={
          deployFor
            ? `Deploy ${STRATEGY_LABEL[deployFor.strategy] ?? deployFor.strategy} — ${deployFor.symbol}`
            : ''
        }
        className="!max-w-md"
      >
        {deployFor && (
          <div className="space-y-3">
            <p className="text-xs text-d-text-secondary">
              {deployFor.view}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <SmallMeta label="Net premium" value={fmtInr(deployFor.net_premium)} />
              <SmallMeta
                label={deployFor.credit_debit === 'credit' ? 'Max profit (credit)' : 'Max profit'}
                value={fmtInr(deployFor.max_profit)}
              />
              <SmallMeta
                label="Max loss"
                value={deployFor.max_loss != null ? fmtInr(-Math.abs(deployFor.max_loss)) : 'Unbounded'}
              />
              <SmallMeta
                label="P(profit)"
                value={
                  deployFor.probability_of_profit != null
                    ? `${(deployFor.probability_of_profit * 100).toFixed(0)}%`
                    : '—'
                }
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lots-input" className="text-xs font-medium text-d-text-primary">
                Deployment lots (×{deployFor.lot_size} per lot)
              </label>
              <NumericInput
                id="lots-input"
                value={lots}
                onChange={(v) => setLots(Math.max(1, Math.min(20, Number(v) || 1)))}
                min={1}
                max={20}
              />
              <p className="font-mono text-[10px] text-d-text-muted">
                {lots * deployFor.lot_size} shares per leg ·
                {' '}cash {deployFor.credit_debit === 'debit' ? 'out' : 'in'} ≈{' '}
                {fmtInr(deployFor.net_premium * lots)}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeployFor(null)
                  setLots(1)
                }}
                disabled={deploying}
              >
                Cancel
              </Button>
              <button
                onClick={handleDeploy}
                disabled={deploying || lots < 1}
                className="glass-control-accent inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold transition-transform active:scale-[0.97] disabled:opacity-50"
              >
                {deploying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4" />
                )}
                Deploy to paper
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ─── Backtest results modal (PR-AW.2) ─── */}
      <Dialog
        open={!!backtestFor}
        onClose={() => {
          if (backtestLoading) return
          setBacktestFor(null)
          setBacktestResult(null)
          setBacktestError(null)
        }}
        title={
          backtestFor
            ? `Backtest — ${STRATEGY_LABEL[backtestFor.strategy] ?? backtestFor.strategy} · ${backtestFor.symbol}`
            : ''
        }
        className="!max-w-2xl"
      >
        {backtestFor && (
          <div className="space-y-4">
            <p className="text-xs text-d-text-secondary">
              180 days of historical {backtestFor.symbol} closes, weekly-roll
              convention, ₹1 Lakh starting capital. BS-mid premiums, σ from
              rolling realised vol.
            </p>

            {backtestLoading ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-d-text-muted">
                  Running backtest — this can take 10-20 seconds…
                </p>
              </div>
            ) : backtestError ? (
              <div className="rounded-xl border border-down/30 bg-down/5 p-3 text-xs text-down">
                {backtestError}
              </div>
            ) : backtestResult ? (
              <BacktestResultPanel result={backtestResult} />
            ) : null}

            <div className="flex justify-end border-t border-line pt-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setBacktestFor(null)
                  setBacktestResult(null)
                  setBacktestError(null)
                }}
                disabled={backtestLoading}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ─── AI strategy suggestion modal (PR-BD) ───
          Advisory only: user types a view, AI picks a template, user
          still has to click Deploy. Memory lock honoured (LLM never
          places trades unilaterally). */}
      <Dialog
        open={aiOpen}
        onClose={() => {
          if (aiSuggesting) return
          setAiOpen(false)
          setAiResult(null)
          setAiError(null)
        }}
        title="Ask the AI copilot for an options structure"
        className="!max-w-xl"
      >
        <div className="space-y-3">
          <p className="text-xs text-d-text-secondary">
            Describe your market view in plain English. The copilot reads the
            live regime + VIX and picks one multi-leg structure that fits.
            You stay in control: you click Deploy, the AI never places a trade
            for you.
          </p>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                Underlying
              </label>
              <div className="mt-1 inline-flex w-full items-center gap-0.5 rounded-full border border-line p-0.5">
                {(['NIFTY', 'BANKNIFTY', 'FINNIFTY'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAiSymbol(s)}
                    className={`flex-1 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                      aiSymbol === s ? 'glass-control-accent'
                                      : 'text-d-text-muted hover:text-d-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="ai-capital" className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                Capital (optional, ₹)
              </label>
              <NumericInput
                id="ai-capital"
                value={aiCapital === '' ? undefined : Number(aiCapital)}
                onChange={(v) => setAiCapital(v == null || isNaN(Number(v)) ? '' : Number(v))}
                placeholder="e.g. 200000"
                min={10_000}
                max={10_000_000}
              />
            </div>
          </div>

          <div>
            <label htmlFor="ai-prompt" className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
              Your view
            </label>
            <div
              className="mt-1 rounded-2xl border bg-wrap p-1 transition-colors focus-within:border-ai/60"
              style={{ borderColor: `color-mix(in srgb, ${AI} 28%, transparent)` }}
            >
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 'I think Nifty will stay range-bound between 23800-24300 this week. Want defined risk, prefer collecting premium.'"
                rows={3}
                maxLength={600}
                className="w-full resize-none rounded-[14px] bg-transparent px-3 py-2 text-sm text-d-text-primary outline-none placeholder:text-d-text-muted"
              />
            </div>
            <p className="mt-1 text-[10px] text-d-text-muted">
              {aiPrompt.length} / 600 chars
            </p>
          </div>

          {/* PR-BE — Portfolio-aware toggle */}
          <label className="flex items-start gap-2 rounded-xl border border-line bg-wrap/60 px-3 py-2 text-xs text-d-text-secondary">
            <input
              type="checkbox"
              checked={aiIncludePortfolio}
              onChange={(e) => setAiIncludePortfolio(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line bg-main accent-primary"
            />
            <span>
              <span className="font-medium text-d-text-primary">
                Include my positions for hedge sizing
              </span>
              <br />
              <span className="text-[10px] text-d-text-muted">
                Loads your open equity + option positions, computes net delta
                exposure, and lets the AI size a hedge that offsets it.
                Best for &ldquo;hedge my book&rdquo; prompts.
              </span>
            </span>
          </label>

          {/* PR-BF.1 — Optional focus on one underlying when portfolio is on */}
          {aiIncludePortfolio && (
            <div>
              <label htmlFor="ai-focus" className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                Focus symbol (optional)
              </label>
              <input
                id="ai-focus"
                type="text"
                value={aiFocusSymbol}
                onChange={(e) => setAiFocusSymbol(e.target.value)}
                placeholder="e.g. RELIANCE — leave empty to hedge whole book"
                maxLength={20}
                className="mt-1 w-full rounded-xl border border-line bg-main px-3 py-1.5 font-mono text-xs uppercase text-d-text-primary outline-none placeholder:normal-case placeholder:text-d-text-muted focus:border-primary"
              />
              <p className="mt-1 text-[10px] text-d-text-muted">
                Narrows the hedge to a single underlying&apos;s exposure
                instead of the net book.
              </p>
            </div>
          )}

          {/* Quick-fire prompts */}
          {!aiResult && (
            <div className="flex flex-wrap gap-1">
              {[
                { p: 'Bullish on Nifty next week, want defined risk', hedge: false },
                { p: 'Bearish on Bank Nifty, expecting a sharp drop', hedge: false },
                { p: 'Expect a big move on RBI day — direction unclear', hedge: false },
                { p: 'Range-bound view, want to collect premium safely', hedge: false },
                { p: 'Hedge my book against a 3% downside move', hedge: true },
              ].map(({ p, hedge }) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setAiPrompt(p)
                    if (hedge) setAiIncludePortfolio(true)
                  }}
                  className="glass-control rounded-full px-2.5 py-1 text-[10px] text-d-text-secondary transition-colors hover:text-d-text-primary"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {aiError && (
            <div className="rounded-xl border border-down/30 bg-down/5 p-3 text-xs text-down">
              {aiError}
            </div>
          )}

          {/* Result */}
          {aiResult && (
            <div className="space-y-3 border-t border-line pt-3">
              <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3">
                <div className="flex items-start gap-2">
                  <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-d-text-secondary">
                      The AI copilot recommends:
                    </p>
                    <p className="font-semibold text-d-text-primary">
                      {(STRATEGY_LABEL[aiResult.template] ?? aiResult.template)} ·{' '}
                      <span className="font-mono text-sm text-primary">
                        {aiResult.lots_suggestion} lot{aiResult.lots_suggestion !== 1 ? 's' : ''}
                      </span>
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-d-text-secondary">
                      {aiResult.reasoning}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <SmallMeta label="Expected outcome" value={aiResult.expected_outcome || '—'} />
                <SmallMeta label="Risk" value={aiResult.risk_summary || '—'} />
                <SmallMeta
                  label="Regime / VIX"
                  value={`${aiResult.context.regime} · ${aiResult.context.vix.toFixed(2)} (${aiResult.context.vix_direction})`}
                />
                <SmallMeta
                  label="Confidence"
                  value={`${Math.round((aiResult.confidence ?? 0.5) * 100)}%`}
                />
              </div>

              {/* PR-BE — Portfolio context tile when hedge mode was on */}
              {aiResult.portfolio_context && aiResult.portfolio_context.has_positions && (
                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-2">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-primary">
                    Your book context (factored into the suggestion)
                  </p>
                  <p className="font-mono text-[11px] text-d-text-primary">
                    Equity: {aiResult.portfolio_context.equity_count} positions ·{' '}
                    delta {fmtInr(aiResult.portfolio_context.equity_delta_inr)}
                    <br />
                    Options: {aiResult.portfolio_context.options_count} positions ·{' '}
                    delta {fmtInr(aiResult.portfolio_context.option_delta_inr)}
                    <br />
                    <span className={`font-semibold ${
                      aiResult.portfolio_context.net_delta_inr >= 0 ? 'text-up' : 'text-down'
                    }`}>
                      NET DELTA {fmtInr(aiResult.portfolio_context.net_delta_inr)} ({
                        Math.abs(aiResult.portfolio_context.net_delta_inr) < 50_000
                          ? 'near-flat'
                          : aiResult.portfolio_context.net_delta_inr > 0
                            ? 'LONG bias'
                            : 'SHORT bias'
                      })
                    </span>
                  </p>

                  {/* PR-BF.1 — Per-underlying breakdown */}
                  {Object.keys(aiResult.portfolio_context.by_symbol ?? {}).length > 0 && (
                    <div className="rounded-lg border border-line bg-wrap/40 p-2">
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                        Top exposures · click to focus next ask
                      </p>
                      <div className="space-y-0.5">
                        {Object.entries(aiResult.portfolio_context.by_symbol)
                          .sort((a, b) => Math.abs(b[1].total_delta_inr) - Math.abs(a[1].total_delta_inr))
                          .slice(0, 5)
                          .map(([sym, d]) => (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => setAiFocusSymbol(sym)}
                              className={`flex w-full items-center justify-between rounded px-1.5 py-1 text-left font-mono text-[11px] hover:bg-wrap-hover ${
                                aiFocusSymbol === sym ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                              }`}
                            >
                              <span className="text-d-text-primary">{sym}</span>
                              <span className="flex items-center gap-2">
                                <span className={`tabular-nums ${
                                  d.total_delta_inr >= 0 ? 'text-up' : 'text-down'
                                }`}>
                                  {fmtInr(d.total_delta_inr)}
                                </span>
                                <Badge
                                  tone={d.bias === 'LONG' ? 'up' : d.bias === 'SHORT' ? 'down' : 'primary'}
                                  className="text-[9px]"
                                >
                                  {d.bias}
                                </Badge>
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {aiResult.proposal && (
                <div className="rounded-xl border border-line bg-wrap/60 p-2">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                    Pre-priced legs
                  </p>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {aiResult.proposal.legs.map((l, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span>
                          <span className={l.action === 'BUY' ? 'text-up' : 'text-down'}>
                            {l.action}
                          </span>{' '}
                          {l.option_type} {l.strike}
                        </span>
                        <span className="text-d-text-muted">@ ₹{l.premium?.toFixed(2) ?? '—'}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between text-[10px] text-d-text-muted">
                    <span>Net premium {fmtInr(aiResult.proposal.net_premium)}</span>
                    <span>
                      Max profit {fmtInr(aiResult.proposal.max_profit)} · Max loss{' '}
                      {aiResult.proposal.max_loss != null
                        ? fmtInr(-Math.abs(aiResult.proposal.max_loss))
                        : 'Unbounded'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
            <Button
              variant="ghost"
              onClick={() => {
                setAiOpen(false)
                setAiResult(null)
                setAiError(null)
              }}
              disabled={aiSuggesting}
            >
              Close
            </Button>
            {aiResult ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAiResult(null)
                    setAiError(null)
                  }}
                  disabled={aiSuggesting}
                >
                  Ask again
                </Button>
                <button
                  onClick={deployAISuggestion}
                  disabled={aiSuggesting}
                  className="glass-control-accent inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold transition-transform active:scale-[0.97] disabled:opacity-50"
                >
                  {aiSuggesting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Radio className="h-3.5 w-3.5" />
                  )}
                  Deploy AI suggestion
                </button>
              </>
            ) : (
              <Button onClick={handleAskAI} disabled={aiSuggesting || aiPrompt.trim().length < 4}>
                {aiSuggesting ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Brain className="mr-1 h-3.5 w-3.5" />
                )}
                Suggest a structure
              </Button>
            )}
          </div>
        </div>
      </Dialog>

      <DisclaimerFooter variant="derivatives" />
    </div>
  )
}

// ─── Backtest result rendering ───
function BacktestResultPanel({ result }: { result: Record<string, any> }) {
  const summary = result.summary ?? result
  const totalReturn = Number(summary.total_return_pct ?? summary.return_pct ?? 0)
  const winRate = Number(summary.win_rate ?? 0)
  const sharpe = Number(summary.sharpe_ratio ?? summary.sharpe ?? 0)
  const maxDd = Number(summary.max_drawdown_pct ?? summary.max_dd_pct ?? 0)
  const totalTrades = Number(summary.total_trades ?? 0)
  const winners = Number(summary.winners ?? summary.winning_trades ?? 0)
  const losers = Number(summary.losers ?? summary.losing_trades ?? totalTrades - winners)
  const finalCapital = Number(summary.final_capital ?? 0)
  const initialCapital = Number(summary.initial_capital ?? 100_000)
  const totalReturnInr = finalCapital - initialCapital

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi
          label="Total return"
          value={
            <span className={totalReturn >= 0 ? 'text-up' : 'text-down'}>
              {totalReturn >= 0 ? '+' : ''}
              {totalReturn.toFixed(2)}%
            </span>
          }
        />
        <Kpi
          label="Net P&L"
          value={
            <span className={totalReturnInr >= 0 ? 'text-up' : 'text-down'}>
              {fmtInr(totalReturnInr)}
            </span>
          }
        />
        <Kpi label="Sharpe" value={sharpe.toFixed(2)} />
        <Kpi
          label="Max drawdown"
          value={<span className="text-down">-{Math.abs(maxDd).toFixed(1)}%</span>}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Total trades" value={String(totalTrades)} />
        <Kpi
          label="Winners"
          value={<span className="text-up">{winners}</span>}
        />
        <Kpi
          label="Losers"
          value={<span className="text-down">{losers}</span>}
        />
      </div>
      <div className="rounded-xl border border-line bg-wrap/40 p-3">
        <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
          Win rate
        </p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-line/60">
            <div
              className="h-full rounded-full bg-up"
              style={{ width: `${Math.min(100, Math.max(0, winRate * 100))}%` }}
            />
          </div>
          <span className="font-mono text-xs font-medium text-d-text-primary tabular-nums">
            {(winRate * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      {Array.isArray(result.trades) && result.trades.length > 0 && (
        <details className="rounded-xl border border-line bg-wrap/40 p-2">
          <summary className="cursor-pointer text-xs text-d-text-secondary">
            Last {Math.min(10, result.trades.length)} trade outcomes
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-[11px]">
            {result.trades.slice(-10).map((t: any, i: number) => {
              const pnl = Number(t.pnl ?? t.net_pnl ?? 0)
              return (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-d-text-muted">
                    {t.entry_date ?? t.opened_at} → {t.exit_date ?? t.closed_at}
                  </span>
                  <span className={pnl >= 0 ? 'text-up' : 'text-down'}>{fmtInr(pnl)}</span>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-wrap/60 p-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-d-text-primary tabular-nums">
        {value}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  onDeploy,
  onBacktest,
}: {
  rec: FoStrategyProposal
  onDeploy: () => void
  onBacktest: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <Badge tone="primary" className="uppercase">{rec.symbol}</Badge>
          <span className="truncate text-sm font-semibold text-d-text-primary">
            {STRATEGY_LABEL[rec.strategy] ?? rec.name}
          </span>
        </span>
        <Badge tone={rec.credit_debit === 'credit' ? 'up' : 'down'} className="uppercase">
          {rec.credit_debit}
        </Badge>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-xs text-d-text-secondary">{rec.view}</p>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <KPI label="Max profit" value={fmtInr(rec.max_profit)} tone="up" />
          <KPI
            label="Max loss"
            value={rec.max_loss != null ? fmtInr(-Math.abs(rec.max_loss)) : 'Unbounded'}
            tone="down"
          />
          <KPI
            label="P(profit)"
            value={
              rec.probability_of_profit != null
                ? `${(rec.probability_of_profit * 100).toFixed(0)}%`
                : '—'
            }
          />
        </div>

        <div className="rounded-xl border border-line bg-wrap/60 p-2">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
            Legs
          </p>
          <ul className="space-y-1 font-mono text-[11px]">
            {rec.legs.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span>
                  <span className={l.action === 'BUY' ? 'text-up' : 'text-down'}>
                    {l.action}
                  </span>{' '}
                  {l.option_type} {l.strike}
                </span>
                <span className="text-d-text-muted">@ ₹{l.premium?.toFixed(2) ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-d-text-muted">
            Expiry {rec.expiry} · Net premium {fmtInr(rec.net_premium)}
          </span>
          <span className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onBacktest}>
              <BarChart3 className="mr-1 h-3.5 w-3.5" />
              Backtest
            </Button>
            <Button size="sm" onClick={onDeploy}>
              <Radio className="mr-1 h-3.5 w-3.5" />
              Deploy
              <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </Button>
          </span>
        </div>
      </CardBody>
    </Card>
  )
}

function OpenPositionCard({
  position: p,
  closing,
  onClose,
}: {
  position: any
  closing: boolean
  onClose: () => void
}) {
  const pnl = Number(p.unrealized_pnl) || 0
  const pnlTone = pnl > 0 ? 'text-up' : pnl < 0 ? 'text-down' : 'text-d-text-primary'
  const TrendIcon = pnl >= 0 ? TrendingUp : TrendingDown
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Badge tone="primary" className="uppercase">{p.underlying}</Badge>
          <span className="text-sm font-semibold text-d-text-primary">
            {STRATEGY_LABEL[p.template_slug ?? ''] ?? p.template_slug ?? 'Multi-leg'}
          </span>
          <span className="hidden font-mono text-[10px] text-d-text-muted md:inline">
            exp {p.expiry_date}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          {/* WIRING #1 (2026-05-31) — Strategy adjustment engine button.
              Endpoint POST /api/screener/fno/adjustments was orphaned
              before this — now reachable from every open position card. */}
          <AdjustmentButton position={p} />
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={closing}
            aria-label="Close position"
          >
            {closing ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="mr-1 h-3.5 w-3.5" />
            )}
            Close
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-3 p-0">
        <div className="grid grid-cols-2 gap-px bg-line/40 sm:grid-cols-4">
          <Cell
            label="Unrealised P&L"
            value={
              <span className={`inline-flex items-center gap-1 ${pnlTone}`}>
                <TrendIcon className="h-3 w-3" />
                {fmtInr(pnl)}
              </span>
            }
          />
          <Cell label="Net premium (entry)" value={fmtInr(p.net_premium)} />
          <Cell label="Current value" value={fmtInr(p.current_value)} />
          <Cell
            label="Max loss"
            value={p.max_loss != null ? fmtInr(-Math.abs(Number(p.max_loss))) : 'Unbounded'}
            tone="down"
          />
        </div>
        <div className="mx-4 mb-3 overflow-hidden rounded-xl border border-line">
          <div className="grid grid-cols-12 gap-2 border-b border-line bg-wrap/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
            <span className="col-span-2">Side</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-3 text-right">Strike</span>
            <span className="col-span-2 text-right">Lots</span>
            <span className="col-span-3 text-right">Entry → LTP</span>
          </div>
          {(p.legs ?? []).map((l: any) => {
            const sideTone = l.side === 'BUY' ? 'text-up' : 'text-down'
            return (
              <div
                key={l.id}
                className="grid grid-cols-12 items-center gap-2 border-b border-line/60 px-3 py-1.5 font-mono text-[11px] last:border-b-0"
              >
                <span className={`col-span-2 ${sideTone}`}>{l.side}</span>
                <span className="col-span-2">{l.option_type}</span>
                <span className="col-span-3 text-right tabular-nums">{l.strike}</span>
                <span className="col-span-2 text-right tabular-nums">{l.lots}</span>
                <span className="col-span-3 text-right tabular-nums text-d-text-secondary">
                  ₹{Number(l.entry_price).toFixed(2)} →{' '}
                  {l.current_price ? `₹${Number(l.current_price).toFixed(2)}` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

function ClosedPositionRow({ position: p }: { position: any }) {
  const realized = Number(p.realized_pnl) || 0
  const tone = realized > 0 ? 'text-up' : realized < 0 ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded-xl border border-line bg-wrap/40 px-3 py-2 text-xs">
      <span className="col-span-3 font-mono text-d-text-primary">
        {p.underlying} · {STRATEGY_LABEL[p.template_slug ?? ''] ?? p.template_slug}
      </span>
      <span className="col-span-2 font-mono text-d-text-muted">
        {p.exit_reason ?? '—'}
      </span>
      <span className="col-span-3 font-mono text-d-text-muted">
        {p.closed_at
          ? new Date(p.closed_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })
          : '—'}
      </span>
      <span className={`col-span-2 text-right font-mono tabular-nums ${tone}`}>
        {fmtInr(realized)}
      </span>
      <span className="col-span-2 text-right font-mono text-[10px] text-d-text-muted">
        entry {fmtInr(p.net_premium)}
      </span>
    </div>
  )
}

function KPI({
  label, value, tone = 'neutral',
}: {
  label: string; value: string; tone?: 'up' | 'down' | 'neutral'
}) {
  const cls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="rounded-xl border border-line bg-wrap/60 p-2 text-center">
      <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${cls}`}>{value}</p>
    </div>
  )
}

function Cell({
  label, value, tone = 'neutral',
}: {
  label: string; value: React.ReactNode; tone?: 'up' | 'down' | 'neutral'
}) {
  const cls = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="bg-wrap p-3">
      <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${cls}`}>{value}</p>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-d-text-muted">{label}</span>
      <span className="font-mono font-medium text-d-text-primary">{value}</span>
    </span>
  )
}

function SmallMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-wrap/60 p-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-xs font-medium text-d-text-primary tabular-nums">
        {value}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// PR-AX — Live option chain panel
// One-symbol picker + nearest-expiry chain pulled via the user's broker.
// Strike-centric layout: CE columns left, strike in middle, PE right —
// the conventional NSE chain shape every Indian options trader expects.
// ─────────────────────────────────────────────────────────────────────

// PR-BC — Builder selection state
export type SelectedLeg = {
  side: 'BUY' | 'SELL'
  option_type: 'CE' | 'PE'
  strike: number
  ltp: number
}

function OptionChainPanel() {
  const [symbol, setSymbol] = useState<'NIFTY' | 'BANKNIFTY' | 'FINNIFTY'>('NIFTY')
  const [view, setView] = useState<'trading' | 'greeks' | 'smile' | 'term' | 'cone'>('trading')
  // PR-BC — Selected legs for the builder. Capped at 4 legs (Iron
  // Condor / Iron Butterfly are the most complex retail structures).
  const [selectedLegs, setSelectedLegs] = useState<SelectedLeg[]>([])
  const [builderLots, setBuilderLots] = useState(1)
  const [builderDeploying, setBuilderDeploying] = useState(false)

  const { data, isLoading, mutate } = useSWR(
    ['fo:chain', symbol],
    () => api.foStrategies.chain(symbol),
    {
      revalidateOnFocus: false,
      refreshInterval: 30_000,  // chain is heavy — 30s refresh, not 5s
      dedupingInterval: 15_000,
      keepPreviousData: true,
    },
  )

  const toggleLeg = (leg: SelectedLeg) => {
    setSelectedLegs((prev) => {
      const idx = prev.findIndex(
        (l) => l.strike === leg.strike && l.option_type === leg.option_type,
      )
      if (idx >= 0) {
        // Same strike+type clicked again → flip BUY/SELL or remove
        const existing = prev[idx]
        if (existing.side !== leg.side) {
          // Flip side
          const updated = [...prev]
          updated[idx] = leg
          return updated
        }
        // Same side → remove (toggle off)
        return prev.filter((_, i) => i !== idx)
      }
      if (prev.length >= 4) {
        toast.error('Max 4 legs', { description: 'Iron Condor is the most complex template supported.' })
        return prev
      }
      return [...prev, leg]
    })
  }

  const clearLegs = () => {
    setSelectedLegs([])
    setBuilderLots(1)
  }

  const deployCustomLegs = async () => {
    if (selectedLegs.length === 0) return
    setBuilderDeploying(true)
    try {
      // Pass legs as LegSpec dicts to the existing paperOpen endpoint
      // using PCT_OFFSET anchor (most robust for arbitrary strikes).
      const spot = data?.spot ?? selectedLegs[0].strike
      const r = await api.foStrategies.paperOpen({
        symbol,
        lots: builderLots,
        legs: selectedLegs.map((l) => ({
          side: l.side.toLowerCase(),
          option_type: l.option_type,
          strike_anchor: 'PCT_OFFSET',
          strike_offset: +(((l.strike / spot) - 1) * 100).toFixed(4),
          expiry: 'CURRENT_WEEK',
          qty_lots: 1,
        })),
      })
      toast.success('Custom position deployed', {
        description: `Net premium ${fmtInr(r.net_premium)} · ${builderLots} lot(s)`,
      })
      clearLegs()
    } catch (e) {
      toast.error('Deploy failed', { description: handleApiError(e) })
    } finally {
      setBuilderDeploying(false)
    }
  }

  // Pair CE + PE at the same strike so the table reads horizontally.
  const rows = data?.rows ?? []
  const grouped = useMemo(() => {
    const byStrike = new Map<number, { ce?: any; pe?: any }>()
    for (const r of rows) {
      const cur = byStrike.get(r.strike) ?? {}
      if (r.option_type === 'CE') cur.ce = r
      else cur.pe = r
      byStrike.set(r.strike, cur)
    }
    return Array.from(byStrike.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([strike, pair]) => ({ strike, ...pair }))
  }, [rows])

  if (data?.source === 'unavailable') {
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="Connect a broker for the live option chain"
        description="The chain streams real-time from your Zerodha / Upstox / Angel account. Without a connected broker we fall back to model-estimated premiums for paper MTM."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-full border border-line p-0.5">
          {(['NIFTY', 'BANKNIFTY', 'FINNIFTY'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSymbol(s)}
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                symbol === s
                  ? 'glass-control-accent'
                  : 'text-d-text-muted hover:text-d-text-primary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-full border border-line p-0.5">
          {(['trading', 'greeks', 'smile', 'term', 'cone'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                view === v
                  ? 'glass-control-accent'
                  : 'text-d-text-muted hover:text-d-text-primary'
              }`}
            >
              {v === 'trading' ? 'OI / LTP' :
                v === 'greeks' ? 'Greeks' :
                v === 'smile' ? 'Smile' :
                v === 'term' ? 'Term' : 'Cone'}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-d-text-muted">
          {data?.spot && (
            <span>Spot ₹{data.spot.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          )}
          {data?.rows[0]?.expiry && <span>Expiry {data.rows[0].expiry}</span>}
        </span>
      </div>

      {isLoading && !data ? (
        <Skeleton w="100%" h="300px" />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title="No chain rows returned"
          description="Try a different symbol, or check the broker connection."
        />
      ) : view === 'trading' ? (
        <ChainTradingTable
          grouped={grouped}
          selectedLegs={selectedLegs}
          onLegClick={toggleLeg}
        />
      ) : view === 'greeks' ? (
        <ChainGreeksTable grouped={grouped} />
      ) : view === 'smile' ? (
        <ChainSmileChart grouped={grouped} spot={data?.spot} />
      ) : view === 'term' ? (
        <TermStructureChart symbol={symbol} />
      ) : (
        <VolConeChart symbol={symbol} />
      )}

      {/* PR-BC — Builder panel: appears when ≥1 legs are selected via
          the chain trading table. Auto-detects strategy + scaffolds a
          paper deploy. */}
      {selectedLegs.length > 0 && (
        <BuilderPanel
          legs={selectedLegs}
          spot={data?.spot}
          lots={builderLots}
          onLotsChange={setBuilderLots}
          onRemoveLeg={(strike, ot) =>
            setSelectedLegs((prev) =>
              prev.filter((l) => !(l.strike === strike && l.option_type === ot)),
            )
          }
          onClear={clearLegs}
          onDeploy={deployCustomLegs}
          deploying={builderDeploying}
        />
      )}
      <p className="text-[10px] text-d-text-muted">
        Streaming live from your connected broker · refreshes every 30s · 15s
        in-process cache so paper MTM uses the same prices.
      </p>
    </div>
  )
}

// Conventional NSE strike-centric layout — OI / Vol / LTP / Bid + Ask.
// PR-BC: CE LTP / PE LTP cells are clickable to toggle into the builder.
// Click once = BUY, click again = SELL, third = remove.
function ChainTradingTable({
  grouped,
  selectedLegs = [],
  onLegClick,
}: {
  grouped: Array<{ strike: number; ce?: any; pe?: any }>
  selectedLegs?: SelectedLeg[]
  onLegClick?: (leg: SelectedLeg) => void
}) {
  const isSelected = (strike: number, ot: 'CE' | 'PE') =>
    selectedLegs.find((l) => l.strike === strike && l.option_type === ot)

  const handleClick = (
    e: React.MouseEvent, strike: number, ot: 'CE' | 'PE', ltp: number,
  ) => {
    e.preventDefault()
    if (!onLegClick || !ltp) return
    const existing = isSelected(strike, ot)
    // Shift-click → SELL, plain click → BUY. Or cycle if same.
    let side: 'BUY' | 'SELL' = e.shiftKey ? 'SELL' : 'BUY'
    if (existing && existing.side === side) {
      // Same side already selected → toggle off via parent's matching delete
      onLegClick({ side, option_type: ot, strike, ltp })
      return
    }
    onLegClick({ side, option_type: ot, strike, ltp })
  }

  const cellClasses = (strike: number, ot: 'CE' | 'PE', baseColor: string) => {
    const sel = isSelected(strike, ot)
    if (!sel) return `${baseColor} cursor-pointer hover:bg-primary/10`
    return sel.side === 'BUY'
      ? 'bg-up/20 text-up cursor-pointer ring-1 ring-up/50'
      : 'bg-down/20 text-down cursor-pointer ring-1 ring-down/50'
  }

  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <div className="grid min-w-[560px] grid-cols-9 gap-2 border-b border-line bg-wrap/80 px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
        <span className="col-span-1 text-right">CE OI</span>
        <span className="col-span-1 text-right">CE Vol</span>
        <span className="col-span-1 text-right">CE LTP</span>
        <span className="col-span-1 text-right">CE Bid</span>
        <span className="col-span-1 text-center bg-primary/5 text-primary">Strike</span>
        <span className="col-span-1 text-left">PE Ask</span>
        <span className="col-span-1 text-left">PE LTP</span>
        <span className="col-span-1 text-left">PE Vol</span>
        <span className="col-span-1 text-left">PE OI</span>
      </div>
      <div className="max-h-[60vh] min-w-[560px] overflow-y-auto">
        {grouped.map(({ strike, ce, pe }) => (
          <div
            key={strike}
            className="grid grid-cols-9 items-center gap-2 border-b border-line/60 px-2 py-1 font-mono text-[11px] last:border-b-0 hover:bg-wrap-hover/40"
          >
            <span className="col-span-1 text-right text-d-text-muted tabular-nums">
              {ce?.oi ? (ce.oi / 1000).toFixed(0) + 'K' : '—'}
            </span>
            <span className="col-span-1 text-right text-d-text-muted tabular-nums">
              {ce?.volume ? (ce.volume / 1000).toFixed(0) + 'K' : '—'}
            </span>
            <button
              type="button"
              disabled={!ce?.ltp}
              onClick={(e) => handleClick(e, strike, 'CE', ce?.ltp ?? 0)}
              className={`col-span-1 -my-0.5 rounded px-1 py-0.5 text-right font-semibold tabular-nums transition-colors disabled:cursor-default disabled:bg-transparent disabled:hover:bg-transparent ${cellClasses(strike, 'CE', 'text-up')}`}
              title={ce?.ltp ? 'Click to BUY · Shift+click to SELL' : ''}
            >
              {ce?.ltp ? ce.ltp.toFixed(2) : '—'}
            </button>
            <span className="col-span-1 text-right text-d-text-muted tabular-nums">
              {ce?.bid ? ce.bid.toFixed(2) : '—'}
            </span>
            <span className="col-span-1 text-center font-semibold text-d-text-primary tabular-nums">
              {strike}
            </span>
            <span className="col-span-1 text-left text-d-text-muted tabular-nums">
              {pe?.ask ? pe.ask.toFixed(2) : '—'}
            </span>
            <button
              type="button"
              disabled={!pe?.ltp}
              onClick={(e) => handleClick(e, strike, 'PE', pe?.ltp ?? 0)}
              className={`col-span-1 -my-0.5 rounded px-1 py-0.5 text-left font-semibold tabular-nums transition-colors disabled:cursor-default disabled:bg-transparent disabled:hover:bg-transparent ${cellClasses(strike, 'PE', 'text-down')}`}
              title={pe?.ltp ? 'Click to BUY · Shift+click to SELL' : ''}
            >
              {pe?.ltp ? pe.ltp.toFixed(2) : '—'}
            </button>
            <span className="col-span-1 text-left text-d-text-muted tabular-nums">
              {pe?.volume ? (pe.volume / 1000).toFixed(0) + 'K' : '—'}
            </span>
            <span className="col-span-1 text-left text-d-text-muted tabular-nums">
              {pe?.oi ? (pe.oi / 1000).toFixed(0) + 'K' : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// PR-BC — Builder panel
// Auto-detects strategy name from the selected legs + lets the user
// deploy them as a custom paper position. Strategy heuristics cover
// the canonical retail structures; everything else is "Custom (N legs)".
function BuilderPanel({
  legs,
  spot,
  lots,
  onLotsChange,
  onRemoveLeg,
  onClear,
  onDeploy,
  deploying,
}: {
  legs: SelectedLeg[]
  spot?: number
  lots: number
  onLotsChange: (n: number) => void
  onRemoveLeg: (strike: number, ot: 'CE' | 'PE') => void
  onClear: () => void
  onDeploy: () => void
  deploying: boolean
}) {
  // Heuristic strategy detection
  const detectStrategy = (): { name: string; description: string } => {
    const n = legs.length
    if (n === 0) return { name: '—', description: '' }
    if (n === 1) {
      const l = legs[0]
      const verb = l.side === 'BUY' ? 'Long' : 'Short'
      const kind = l.option_type === 'CE' ? 'Call' : 'Put'
      return {
        name: `${verb} ${kind}`,
        description: l.side === 'BUY'
          ? 'Pay premium up front. Profit if price moves in your favour past breakeven.'
          : 'Collect premium. Unbounded risk if price moves against you.',
      }
    }
    const ce = legs.filter((l) => l.option_type === 'CE')
    const pe = legs.filter((l) => l.option_type === 'PE')
    const buys = legs.filter((l) => l.side === 'BUY')
    const sells = legs.filter((l) => l.side === 'SELL')

    if (n === 2) {
      if (ce.length === 2) {
        const [low, high] = [...ce].sort((a, b) => a.strike - b.strike)
        if (low.side === 'BUY' && high.side === 'SELL')
          return { name: 'Bull Call Spread', description: 'Debit. Max profit if price ≥ upper strike at expiry.' }
        if (low.side === 'SELL' && high.side === 'BUY')
          return { name: 'Bear Call Spread', description: 'Credit. Max profit if price ≤ lower strike at expiry.' }
      }
      if (pe.length === 2) {
        const [low, high] = [...pe].sort((a, b) => a.strike - b.strike)
        if (low.side === 'SELL' && high.side === 'BUY')
          return { name: 'Bear Put Spread', description: 'Debit. Max profit if price ≤ lower strike at expiry.' }
        if (low.side === 'BUY' && high.side === 'SELL')
          return { name: 'Bull Put Spread', description: 'Credit. Max profit if price ≥ upper strike at expiry.' }
      }
      if (ce.length === 1 && pe.length === 1) {
        const sameStrike = ce[0].strike === pe[0].strike
        if (ce[0].side === pe[0].side) {
          const word = sameStrike ? 'Straddle' : 'Strangle'
          const verb = ce[0].side === 'BUY' ? 'Long' : 'Short'
          return {
            name: `${verb} ${word}`,
            description: ce[0].side === 'BUY'
              ? 'Volatility bet — profits on a large move in either direction.'
              : 'Theta harvest — profits if price stays inside a range. Unbounded risk on a large move.',
          }
        }
      }
    }
    if (n === 4 && buys.length === 2 && sells.length === 2 && ce.length === 2 && pe.length === 2) {
      const ceSells = ce.filter((l) => l.side === 'SELL')
      const peSells = pe.filter((l) => l.side === 'SELL')
      // Iron Butterfly: short ATM CE + short ATM PE at the same strike
      if (ceSells.length === 1 && peSells.length === 1 && ceSells[0].strike === peSells[0].strike)
        return { name: 'Iron Butterfly', description: 'Credit. Max profit if price = body strike at expiry. Tight range.' }
      return {
        name: 'Iron Condor',
        description: 'Credit. Max profit if price stays inside the short strikes. Wider profit zone than butterfly.',
      }
    }
    return { name: `Custom (${n} legs)`, description: 'No standard template detected.' }
  }

  const detected = detectStrategy()
  const sortedLegs = [...legs].sort((a, b) => {
    if (a.strike !== b.strike) return a.strike - b.strike
    return a.option_type === 'CE' ? -1 : 1
  })
  // Net debit/credit estimate from LTPs (per single lot)
  const netDebitPerLot = legs.reduce(
    (sum, l) => sum + (l.side === 'BUY' ? l.ltp : -l.ltp),
    0,
  )

  return (
    <Card className="sticky bottom-2 border-primary/40 bg-wrap/95 shadow-lg backdrop-blur">
      <CardHeader className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-d-text-primary">
            Builder · <span className="text-primary">{detected.name}</span>
          </span>
        </span>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-xs text-d-text-secondary">{detected.description}</p>

        {/* Selected legs */}
        <div className="space-y-1">
          {sortedLegs.map((l) => {
            const sideTone = l.side === 'BUY' ? 'text-up' : 'text-down'
            return (
              <div
                key={`${l.strike}-${l.option_type}`}
                className="flex items-center justify-between rounded-lg border border-line bg-wrap/60 px-2 py-1 font-mono text-xs"
              >
                <span className="flex items-center gap-2">
                  <span className={`font-semibold ${sideTone}`}>{l.side}</span>
                  <span className="text-d-text-primary">
                    {l.option_type} {l.strike}
                  </span>
                  <span className="text-d-text-muted">@ ₹{l.ltp.toFixed(2)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveLeg(l.strike, l.option_type)}
                  className="text-d-text-muted hover:text-down"
                  aria-label="Remove leg"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Net premium estimate + lots + deploy */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                Net per share
              </p>
              <p className={`font-mono text-sm font-semibold tabular-nums ${netDebitPerLot >= 0 ? 'text-down' : 'text-up'}`}>
                {netDebitPerLot >= 0 ? `Debit ₹${netDebitPerLot.toFixed(2)}` : `Credit ₹${Math.abs(netDebitPerLot).toFixed(2)}`}
              </p>
            </div>
            <div>
              <label htmlFor="builder-lots" className="font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
                Lots
              </label>
              <NumericInput
                id="builder-lots"
                value={lots}
                onChange={(v) => onLotsChange(Math.max(1, Math.min(20, Number(v) || 1)))}
                min={1}
                max={20}
                className="w-20"
              />
            </div>
          </div>
          <Button onClick={onDeploy} disabled={deploying || legs.length === 0}>
            {deploying ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Radio className="mr-1 h-3.5 w-3.5" />
            )}
            Deploy {legs.length}-leg to paper
          </Button>
        </div>

        <p className="text-[10px] text-d-text-muted">
          Click any CE/PE LTP cell to add a leg (click = BUY, Shift+click = SELL,
          click again to remove). Strikes resolve to PCT_OFFSET anchors so the
          backend executor can re-resolve at order placement.
        </p>
      </CardBody>
    </Card>
  )
}

// Volatility smile chart (PR-AZ).
// X-axis: strike (linear, ascending). Y-axis: IV%.
// CE line in green, PE line in red. Vertical reference line at spot
// for the ATM marker. Dotted black line for ATM IV anchor — helpful
// to see skew (PE above CE = put skew; classic "fear" / left-tail
// hedging demand on NIFTY).
function ChainSmileChart({
  grouped,
  spot,
}: {
  grouped: Array<{ strike: number; ce?: any; pe?: any }>
  spot?: number
}) {
  // Filter to strikes that have IV on at least one side
  const data = useMemo(
    () =>
      grouped
        .map((g) => ({
          strike: g.strike,
          ceIv: g.ce?.iv != null ? +(g.ce.iv * 100).toFixed(2) : null,
          peIv: g.pe?.iv != null ? +(g.pe.iv * 100).toFixed(2) : null,
        }))
        .filter((d) => d.ceIv != null || d.peIv != null),
    [grouped],
  )

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="No IV data to plot"
        description="Smile needs at least one strike with a non-zero LTP so we can imply σ. Check back after market open."
      />
    )
  }

  // Find ATM strike for the reference + IV anchor display
  const atmStrike =
    spot && grouped.length > 0
      ? grouped.reduce((best, g) =>
          Math.abs(g.strike - spot) < Math.abs(best.strike - spot) ? g : best,
        ).strike
      : null
  const atmRow = data.find((d) => d.strike === atmStrike)
  const atmIv =
    atmRow && atmRow.ceIv != null && atmRow.peIv != null
      ? (atmRow.ceIv + atmRow.peIv) / 2
      : atmRow?.ceIv ?? atmRow?.peIv ?? null

  // Compute a simple skew metric: average PE IV over ATM-5 to ATM, vs
  // average CE IV over ATM to ATM+5 wings. Positive = put skew (NIFTY
  // norm); negative = call skew (rare; usually meme/squeeze).
  let skewPct: number | null = null
  if (atmStrike != null) {
    const atmIdx = data.findIndex((d) => d.strike === atmStrike)
    if (atmIdx >= 0) {
      const peWing = data.slice(Math.max(0, atmIdx - 5), atmIdx + 1)
        .map((d) => d.peIv).filter((x): x is number => x != null)
      const ceWing = data.slice(atmIdx, Math.min(data.length, atmIdx + 6))
        .map((d) => d.ceIv).filter((x): x is number => x != null)
      if (peWing.length && ceWing.length) {
        const peMean = peWing.reduce((s, x) => s + x, 0) / peWing.length
        const ceMean = ceWing.reduce((s, x) => s + x, 0) / ceWing.length
        skewPct = +(peMean - ceMean).toFixed(2)
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="ATM strike"
          value={atmStrike != null ? String(atmStrike) : '—'}
        />
        <Kpi
          label="ATM IV"
          value={atmIv != null ? `${atmIv.toFixed(1)}%` : '—'}
        />
        <Kpi
          label="Skew (PE wing − CE wing)"
          value={
            skewPct == null ? (
              '—'
            ) : (
              <span className={skewPct >= 0 ? 'text-down' : 'text-up'}>
                {skewPct >= 0 ? '+' : ''}
                {skewPct.toFixed(2)} pts
              </span>
            )
          }
        />
        <Kpi
          label="Strikes plotted"
          value={String(data.length)}
        />
      </div>

      {/* Smile chart */}
      <div className="rounded-md border border-line bg-wrap/40 p-3">
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,30,41,0.4)" />
            <XAxis
              dataKey="strike"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => String(v)}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'var(--color-muted)' }}
              stroke="var(--color-line)"
            />
            <YAxis
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'var(--color-muted)' }}
              stroke="var(--color-line)"
              domain={['auto', 'auto']}
              label={{
                value: 'Implied vol',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'monospace' },
              }}
            />
            <RTooltip
              contentStyle={{
                backgroundColor: 'color-mix(in srgb, var(--color-wrap-hover) 95%, transparent)',
                border: '1px solid var(--color-line)',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'monospace',
              }}
              labelStyle={{ color: 'var(--color-desc)', fontWeight: 600 }}
              formatter={(value: any, name: string) => {
                if (value == null) return ['—', name]
                return [`${Number(value).toFixed(2)}%`, name === 'ceIv' ? 'CE IV' : 'PE IV']
              }}
              labelFormatter={(strike) => `Strike ${strike}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }}
              formatter={(v) => (v === 'ceIv' ? 'CE IV' : 'PE IV')}
            />
            {atmStrike != null && (
              <ReferenceLine
                x={atmStrike}
                stroke="var(--chart-primary)"
                strokeDasharray="4 4"
                label={{
                  value: 'ATM',
                  position: 'top',
                  fill: 'var(--chart-primary)',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="ceIv"
              stroke="var(--color-up)"
              strokeWidth={2}
              dot={{ r: 2, fill: 'var(--color-up)' }}
              activeDot={{ r: 4 }}
              connectNulls
              name="ceIv"
            />
            <Line
              type="monotone"
              dataKey="peIv"
              stroke="var(--color-down)"
              strokeWidth={2}
              dot={{ r: 2, fill: 'var(--color-down)' }}
              activeDot={{ r: 4 }}
              connectNulls
              name="peIv"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-d-text-muted">
        Implied vol per strike, derived from the live broker option chain
        LTPs. Skew = average PE IV in the 5 strikes below ATM minus average
        CE IV in the 5 strikes above. Positive skew (red &gt; green on the
        left wing) is the NIFTY norm — put hedges are pricier than equivalent
        upside calls.
      </p>
    </div>
  )
}

// Term structure chart (PR-BA).
// ATM IV across the four standard expiries — front-week → next-month.
// Shape classified server-side: contango = upward (back > front),
// backwardation = downward (front > back, event premium), flat.
function TermStructureChart({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR(
    ['fo:term', symbol],
    () => api.foStrategies.termStructure(symbol),
    {
      revalidateOnFocus: false,
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      keepPreviousData: true,
    },
  )

  if (isLoading && !data) {
    return <Skeleton w="100%" h="380px" />
  }
  if (data?.source === 'unavailable') {
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="Connect a broker to see term structure"
        description="Term structure pulls chains for current week / next week / current month / next month. All four require a connected broker."
      />
    )
  }
  if (!data || data.expiries.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="No IV data across expiries"
        description="The broker returned no priceable strikes near ATM on any expiry. Check back after market open."
      />
    )
  }

  const rows = data.expiries.map((e) => ({
    expiry: e.expiry,
    days: e.days_to_expiry,
    atmIv: +(e.atm_iv * 100).toFixed(2),
    ceIv: e.ce_iv != null ? +(e.ce_iv * 100).toFixed(2) : null,
    peIv: e.pe_iv != null ? +(e.pe_iv * 100).toFixed(2) : null,
    label: `${e.days_to_expiry}d (${e.expiry.slice(5)})`,
  }))

  const shape = data.shape
  const shapeMeta = {
    flat: { label: 'Flat', tone: 'text-d-text-primary',
            note: 'Near + far vol roughly equal.' },
    contango: { label: 'Contango', tone: 'text-up',
                note: 'Back > front — normal. Longer vega exposure commands more premium.' },
    backwardation: { label: 'Backwardation', tone: 'text-down',
                     note: 'Front > back — event premium baked into the near expiry (earnings, RBI/Fed, expiry effect).' },
  }[shape]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Spot" value={`₹${data.spot.toLocaleString('en-IN')}`} />
        <Kpi label="Front expiry IV" value={`${rows[0].atmIv.toFixed(1)}%`} />
        <Kpi label="Back expiry IV" value={`${rows[rows.length - 1].atmIv.toFixed(1)}%`} />
        <Kpi
          label="Shape"
          value={<span className={shapeMeta.tone}>{shapeMeta.label}</span>}
        />
      </div>

      <div className="rounded-md border border-line bg-wrap/40 p-3">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={rows} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,30,41,0.4)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'var(--color-muted)' }}
              stroke="var(--color-line)"
            />
            <YAxis
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'var(--color-muted)' }}
              stroke="var(--color-line)"
              domain={['auto', 'auto']}
              label={{
                value: 'ATM IV',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'monospace' },
              }}
            />
            <RTooltip
              contentStyle={{
                backgroundColor: 'color-mix(in srgb, var(--color-wrap-hover) 95%, transparent)',
                border: '1px solid var(--color-line)',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'monospace',
              }}
              labelStyle={{ color: 'var(--color-desc)', fontWeight: 600 }}
              formatter={(v: any, name: string) => {
                if (v == null) return ['—', name]
                const labelMap: Record<string, string> = {
                  atmIv: 'ATM mean', ceIv: 'CE IV', peIv: 'PE IV',
                }
                return [`${Number(v).toFixed(2)}%`, labelMap[name] ?? name]
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }}
              formatter={(v) => ({ atmIv: 'ATM mean', ceIv: 'CE IV', peIv: 'PE IV' }[v as string] ?? v)}
            />
            <Line
              type="monotone"
              dataKey="ceIv"
              stroke="var(--color-up)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 2, fill: 'var(--color-up)' }}
              connectNulls
              name="ceIv"
            />
            <Line
              type="monotone"
              dataKey="peIv"
              stroke="var(--color-down)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 2, fill: 'var(--color-down)' }}
              connectNulls
              name="peIv"
            />
            <Line
              type="monotone"
              dataKey="atmIv"
              stroke="var(--chart-primary)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--chart-primary)' }}
              activeDot={{ r: 6 }}
              name="atmIv"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-d-text-muted">
        {shapeMeta.note} Each dot is the ATM IV at one expiry; the blue
        solid line is the mean of CE + PE at ATM, dashed lines show each
        side separately. Front-month skews can hide an event premium — if
        front is much higher than back, the market is pricing something
        specific into the near contract.
      </p>
    </div>
  )
}

// Vol cone (PR-BB).
// X-axis: realised-vol windows (7d/14d/21d/30d/60d/90d).
// Y-axis: annualised vol %.
// Stacked area bands at p10-p25, p25-p75, p75-p90 (light to dark grey),
// median (p50) line on top, current realised vol dot per window, and
// current ATM IV dots (scattered to their nearest window). When IV
// sits above the p90 band the options are rich vs history; below p10
// → cheap.
function VolConeChart({ symbol }: { symbol: string }) {
  const { data, isLoading } = useSWR(
    ['fo:cone', symbol],
    () => api.foStrategies.volCone(symbol),
    {
      revalidateOnFocus: false,
      refreshInterval: 5 * 60_000,    // historical vol moves slowly — 5min
      dedupingInterval: 60_000,
      keepPreviousData: true,
    },
  )

  if (isLoading && !data) {
    return <Skeleton w="100%" h="380px" />
  }
  if (!data || data.windows.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="No vol cone data"
        description="Need ~100 days of bars to build the percentile distribution. Check back later."
      />
    )
  }

  // Pre-scale percentiles to percent for the chart
  const rows = data.windows.map((w) => ({
    window: `${w.window_days}d`,
    p10: +(w.p10 * 100).toFixed(2),
    // stacked: lower / mid-low / mid-high / top — Recharts stacks values
    // by ADDING them per row, so we feed deltas.
    p25_minus_p10: +((w.p25 - w.p10) * 100).toFixed(2),
    p75_minus_p25: +((w.p75 - w.p25) * 100).toFixed(2),
    p90_minus_p75: +((w.p90 - w.p75) * 100).toFixed(2),
    p50: +(w.p50 * 100).toFixed(2),
    current_rv: +(w.current_rv * 100).toFixed(2),
  }))

  // Map current IVs to chart x positions
  const ivOverlay = data.current_ivs.map((iv) => ({
    window: iv.window_days != null ? `${iv.window_days}d` : `${iv.days}d`,
    iv: +(iv.iv * 100).toFixed(2),
    expiry: iv.expiry,
  }))

  // Quick richness read: compare nearest expiry IV to its bucket's
  // percentile band
  const nearestIV = ivOverlay[0]
  const nearestWindow = nearestIV
    ? data.windows.find((w) => `${w.window_days}d` === nearestIV.window)
    : null
  let richness: { label: string; tone: string } | null = null
  if (nearestIV && nearestWindow) {
    const iv = nearestIV.iv / 100
    if (iv >= nearestWindow.p90) richness = { label: 'RICH (>p90)', tone: 'text-down' }
    else if (iv >= nearestWindow.p75) richness = { label: 'Elevated (p75-p90)', tone: 'text-warning' }
    else if (iv <= nearestWindow.p10) richness = { label: 'CHEAP (<p10)', tone: 'text-up' }
    else if (iv <= nearestWindow.p25) richness = { label: 'Below normal (p10-p25)', tone: 'text-up' }
    else richness = { label: 'Normal (p25-p75)', tone: 'text-d-text-primary' }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Symbol"
          value={`${data.symbol} · spot ₹${data.spot.toLocaleString('en-IN')}`}
        />
        <Kpi
          label="Sample size"
          value={`${data.windows[0]?.samples ?? 0} bars`}
        />
        <Kpi
          label="Nearest IV"
          value={nearestIV ? `${nearestIV.iv.toFixed(1)}%` : '—'}
        />
        <Kpi
          label="Richness vs history"
          value={
            richness ? <span className={richness.tone}>{richness.label}</span> : '—'
          }
        />
      </div>

      <div className="rounded-md border border-line bg-wrap/40 p-3">
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={rows} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,30,41,0.4)" />
            <XAxis
              dataKey="window"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'var(--color-muted)' }}
              stroke="var(--color-line)"
              label={{
                value: 'Realised vol window',
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'monospace' },
              }}
            />
            <YAxis
              tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'var(--color-muted)' }}
              stroke="var(--color-line)"
              domain={['auto', 'auto']}
              label={{
                value: 'Annualised vol',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 10, fill: 'var(--color-muted)', fontFamily: 'monospace' },
              }}
            />
            <RTooltip
              contentStyle={{
                backgroundColor: 'color-mix(in srgb, var(--color-wrap-hover) 95%, transparent)',
                border: '1px solid var(--color-line)',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: 'monospace',
              }}
              labelFormatter={(w) => `${w} realised vol`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }}
            />
            {/* Cone bands — stacked areas from p10 up to p90 */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="var(--color-muted)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-muted)' }}
              name="p50 (median)"
            />
            <Line
              type="monotone"
              dataKey="current_rv"
              stroke="var(--color-warning)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-warning)' }}
              name="Current RV"
            />
            {/* Each percentile as its own line for clarity */}
            <Line type="monotone" dataKey="p10" stroke="#444" strokeDasharray="2 2" dot={false} name="p10" />
            <Line type="monotone" dataKey="p90" stroke="#444" strokeDasharray="2 2" dot={false} name="p90" />
            {/* Overlay current IVs as scatter dots */}
            {ivOverlay.length > 0 && (
              <Scatter
                name="Current IV"
                data={ivOverlay}
                dataKey="iv"
                fill="var(--chart-primary)"
                shape="diamond"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-d-text-muted">
        Cone shape = where realised vol has spent its time over the past
        year. Above p90 = rich (options pricing in event premium); below
        p10 = cheap (mean-reversion candidate for net-vol buyers). Blue
        diamonds are current ATM implied vols per expiry; orange dots
        are the latest realised vol per window.
      </p>
    </div>
  )
}

// Term structure chart (PR-BA). Calculated
// from the chain LTP via BS implied-vol solver (PR-AY backend).
function ChainGreeksTable({
  grouped,
}: {
  grouped: Array<{ strike: number; ce?: any; pe?: any }>
}) {
  const fmt = (x: number | null | undefined, d = 4) =>
    x == null ? '—' : x.toFixed(d)
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <div className="grid min-w-[640px] grid-cols-11 gap-2 border-b border-line bg-wrap/80 px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider text-d-text-muted">
        <span className="col-span-1 text-right">CE IV</span>
        <span className="col-span-1 text-right">CE Δ</span>
        <span className="col-span-1 text-right">CE Γ</span>
        <span className="col-span-1 text-right">CE Θ</span>
        <span className="col-span-1 text-right">CE V</span>
        <span className="col-span-1 text-center bg-primary/5 text-primary">Strike</span>
        <span className="col-span-1 text-left">PE V</span>
        <span className="col-span-1 text-left">PE Θ</span>
        <span className="col-span-1 text-left">PE Γ</span>
        <span className="col-span-1 text-left">PE Δ</span>
        <span className="col-span-1 text-left">PE IV</span>
      </div>
      <div className="max-h-[60vh] min-w-[640px] overflow-y-auto">
        {grouped.map(({ strike, ce, pe }) => (
          <div
            key={strike}
            className="grid grid-cols-11 items-center gap-2 border-b border-line/60 px-2 py-1 font-mono text-[11px] last:border-b-0 hover:bg-wrap-hover"
          >
            <span className="col-span-1 text-right text-d-text-secondary tabular-nums">
              {ce?.iv != null ? `${(ce.iv * 100).toFixed(1)}%` : '—'}
            </span>
            <span className="col-span-1 text-right text-up tabular-nums">
              {fmt(ce?.delta, 3)}
            </span>
            <span className="col-span-1 text-right text-d-text-muted tabular-nums">
              {fmt(ce?.gamma, 5)}
            </span>
            <span className="col-span-1 text-right text-down tabular-nums">
              {fmt(ce?.theta, 2)}
            </span>
            <span className="col-span-1 text-right text-d-text-muted tabular-nums">
              {fmt(ce?.vega, 2)}
            </span>
            <span className="col-span-1 text-center font-semibold text-d-text-primary tabular-nums">
              {strike}
            </span>
            <span className="col-span-1 text-left text-d-text-muted tabular-nums">
              {fmt(pe?.vega, 2)}
            </span>
            <span className="col-span-1 text-left text-down tabular-nums">
              {fmt(pe?.theta, 2)}
            </span>
            <span className="col-span-1 text-left text-d-text-muted tabular-nums">
              {fmt(pe?.gamma, 5)}
            </span>
            <span className="col-span-1 text-left text-down tabular-nums">
              {fmt(pe?.delta, 3)}
            </span>
            <span className="col-span-1 text-left text-d-text-secondary tabular-nums">
              {pe?.iv != null ? `${(pe.iv * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────
// WIRING #1 (2026-05-31) — Strategy adjustment engine button.
// Opens a modal that POSTs the current position + legs + spot to
// /api/screener/fno/adjustments and renders ranked roll/hedge/defend/
// close/scale-out suggestions by urgency.
// ─────────────────────────────────────────────────────────────────

function AdjustmentButton({ position }: { position: any }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  async function loadAdjustments() {
    setLoading(true)
    setError(null)
    try {
      // Derive legs from position.legs (already attached by paperPositions API)
      const legs = (position.legs || []).map((L: any) => ({
        side: L.side,
        option_type: L.option_type,
        strike: Number(L.strike),
        lots: Number(L.lots),
        lot_size: Number(L.lot_size),
      }))
      // Spot fallback: closest strike — adjustment engine uses it for
      // tested-side detection. UI-only proxy; backend authoritative.
      const spot = legs.length > 0 ? legs[Math.floor(legs.length / 2)].strike : 0
      const res = await api.screener.fnoAdjustments({
        position: {
          net_premium: Number(position.net_premium) || 0,
          unrealized_pnl: Number(position.unrealized_pnl) || 0,
          expiry_date: position.expiry_date,
        },
        legs,
        spot,
        vix: null,
      })
      setAdjustments(res.adjustments || [])
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => { setOpen(true); loadAdjustments() }}
        aria-label="Suggest adjustments"
      >
        <Wrench className="mr-1 h-3.5 w-3.5" />
        Adjust
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[20px] border border-line bg-main p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-d-text-primary">
                  Defend &amp; adjust
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-d-text-muted hover:text-d-text-primary"
                aria-label="Close"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} w="100%" h="60px" />)}
              </div>
            ) : error ? (
              <p className="rounded-xl border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">
                {error}
              </p>
            ) : adjustments.length === 0 ? (
              <p className="py-6 text-center text-sm text-d-text-muted">
                Position doesn't match any adjustment rule right now —
                hold per your original thesis.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {adjustments.map((a, i) => (
                  <li key={i} className="rounded-xl border border-line bg-wrap p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-d-text-primary">
                          {a.name}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${
                            a.urgency === 'critical' ? 'border-down bg-down/10 text-down'
                              : a.urgency === 'recommended' ? 'border-primary/60 bg-primary/5 text-primary'
                                : 'border-line bg-main text-d-text-muted'
                          }`}
                        >
                          {a.urgency}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-d-text-muted">
                        {a.action}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-d-text-secondary">{a.rationale}</p>
                    {a.steps?.length > 0 && (
                      <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-[11px] text-d-text-secondary">
                        {a.steps.map((s: string, j: number) => <li key={j}>{s}</li>)}
                      </ol>
                    )}
                    {a.risk_notes?.length > 0 && (
                      <ul className="mt-2 space-y-0.5 border-t border-line/60 pt-2 text-[10px] text-d-text-muted">
                        {a.risk_notes.map((r: string, j: number) => <li key={j}>⚠ {r}</li>)}
                      </ul>
                    )}
                    <p className="mt-1 text-[9px] text-d-text-muted opacity-70">
                      {a.source_label}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 border-t border-line pt-3 text-[10px] text-d-text-muted">
              Adjustments are rule-based suggestions, not auto-executed.
              Review and place orders manually via your broker.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
