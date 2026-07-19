'use client'

/**
 * /strategies (PR-S) — strategy Library + My strategies + Builder.
 *
 *   Library     → templates from /api/strategies/catalog/sections
 *   My         → user-saved DSL strategies (/api/strategies)
 *   Builder    → NL prompt → POST /studio/compile → DSL preview →
 *                save as draft → run backtest inline.
 *
 * The Library tab still falls back to the legacy marketplace catalog
 * if the v2 endpoint returns empty, so we never ship a blank library
 * while the DSL templates are still being seeded.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Wand2,
  RotateCcw,
  Save,
} from '@/lib/icons'

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DisclaimerFooter,
  EmptyState,
  EyebrowMono,
  Input,
  NumericInput,
  PageHeader,
  Reveal,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { EmbeddedAgent } from '@/components/copilot/EmbeddedAgent'
import OptionsCopilotCard from '@/components/fno/OptionsCopilotCard'
import { ChipRow, ArtifactCard, ActionRow } from '@/components/copilot/artifacts'
import type { Tok } from '@/components/copilot/types'
import { api } from '@/lib/api'
import { handleApiError } from '@/lib/api'
import { MONO, AI } from '@/lib/tokens'
import { formatPercent } from '@/lib/utils'
import type {
  CatalogSections,
  CatalogTemplate,
  DSLBacktestResult,
  DSLStrategy,
  StudioClarification,
  UserStrategy,
} from '@/types/strategies'

import { BacktestViewer } from '@/components/strategies/BacktestViewer'
import { DSLPreview } from '@/components/strategies/DSLPreview'
import { StrategyActionRow } from '@/components/strategies/StrategyActionRow'
import { DiscoveredTab } from '@/components/strategies/DiscoveredTab'
import { StrategyCompareCard } from '@/components/strategies/StrategyCompareCard'
import VisionUpload from '@/components/strategies/VisionUpload'

const EXAMPLE_PROMPTS: string[] = [
  'Buy Nifty 50 stocks when 20EMA crosses above 50EMA and RSI is between 50 and 70. Exit when 20EMA crosses below 50EMA. Stop loss 3%.',
  'Mean-reversion: buy when RSI(14) drops under 28 in a bull regime. Exit when RSI crosses back above 50. Stop loss 4%.',
  'Trend-pullback: enter when price closes above 50EMA and pulls back to 20EMA, in any non-bear regime. Trail 5%.',
]

export default function StrategiesPage() {
  const router = useRouter()
  const [tab, setTab] = useState('library')
  return (
    <div className="w-full pb-8">
      {/* C-archetype page header — breadcrumb eyebrow + title + description */}
      <PageHeader
        eyebrow="Build · Backtest · Gate"
        title="AI Algos"
        description="Describe a strategy in plain English. The AI compiles it, walk-forward backtests it on out-of-sample data, and gates it before it trades live."
        actions={
          <Button
            variant="ai"
            onClick={() =>
              dispatchCopilotOpen('Help me pick a strategy that matches my risk profile and the current regime.')
            }
          >
            <Sparkles className="mr-1 h-4 w-4" /> Ask Copilot
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-5 md:px-6 xl:px-8">
        {/* Strategy Agent — frames the Studio with REAL catalog data (no LLM
            tokens on load). The actual NL→DSL compile stays user-triggered in
            the Builder tab, so cost only fires on an explicit Compile. */}
        <Reveal delay={0.04}>
          <StrategyAgentHero onOpenBuilder={() => setTab('builder')} />
        </Reveal>

        {/* tabs — every existing tab preserved */}
        <Reveal delay={0.08}>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="mine">My strategies</TabsTrigger>
              <TabsTrigger value="deployed" onClick={() => router.push('/strategies/deployed')}>
                Deployed
              </TabsTrigger>
              <TabsTrigger value="builder">Builder</TabsTrigger>
              <TabsTrigger value="discovered">Discovered</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-5">
              <LibraryTab onOpenTemplate={(slug) => router.push(`/strategies/${slug}`)} />
            </TabsContent>

            <TabsContent value="mine" className="mt-5">
              <MyStrategiesTab />
            </TabsContent>

            <TabsContent value="builder" className="mt-5">
              <BuilderTab />
            </TabsContent>

            <TabsContent value="discovered" className="mt-5">
              <DiscoveredTab />
            </TabsContent>

            {/* The trigger navigates to /strategies/deployed; this panel keeps
                the content region from going blank if that nav is slow. */}
            <TabsContent value="deployed" className="mt-5">
              <div className="py-10 text-center text-[13px] text-d-text-muted">Opening deployed strategies…</div>
            </TabsContent>
          </Tabs>
        </Reveal>

        <DisclaimerFooter />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// STRATEGY AGENT — embedded GenUI hero.
//
// LIVE mode: `run` hits /api/strategies/catalog/sections (pure data — no LLM
// tokens), ranks the tested templates by Sharpe, and streams a Studio framing.
// The real NL→DSL compile + backtest lives in the Builder tab below; the
// "Open the Builder" CTA jumps there. Only the Builder's Compile button
// spends LLM tokens — never page load.
// ═══════════════════════════════════════════════════════════════════════

function StrategyAgentHero({ onOpenBuilder }: { onOpenBuilder: () => void }) {
  const router = useRouter()
  const [tops, setTops] = useState<CatalogTemplate[]>([])

  const run = async () => {
    const r = await api.strategies.getCatalogSections()
    const s = r.sections
    const all = [s.exclusive, s.featured, s.swing, s.intraday, s.options]
      .filter(Boolean)
      .flatMap((sec) => sec.templates ?? [])
    const ranked = all
      .filter((t) => t.backtest_sharpe != null)
      .sort((a, b) => (b.backtest_sharpe ?? 0) - (a.backtest_sharpe ?? 0))
    const top = ranked.slice(0, 3)
    setTops(top)
    const best = ranked[0]

    const narration: Tok[] = [
      ['The library holds ', 0],
      [`${all.length} strategies`, 1],
      [', ', 0],
      [`${ranked.length} with a logged backtest`, 1],
      ['. ', 0],
    ]
    if (best) {
      narration.push(['Strongest by risk-adjusted return: ', 0])
      narration.push([`${best.name} (Sharpe ${best.backtest_sharpe!.toFixed(2)}`, 1])
      if (best.backtest_win_rate != null) narration.push([`, ${formatPercent(best.backtest_win_rate, 0)} win`, 0])
      narration.push(['). ', 0])
    }
    narration.push(["Describe your own in plain English. I compile it to a DSL, then walk-forward backtest it on out-of-sample data before anything trades.", 0])

    return {
      narration,
      trace: (
        <>
          Scanned {all.length} templates · {ranked.length} backtested · ranked by Sharpe · gate: backtest → deploy
        </>
      ),
    }
  }

  return (
    <div className="space-y-2">
      <EmbeddedAgent
        name="Strategy Agent"
        scope="Scoped to Studio · plain English in, walk-forward-gated DSL out"
        query="What's in the strategy library, and how do I build my own?"
        run={run}
        askPrompt="Help me design a strategy — e.g. buy when 20EMA crosses 50EMA with RSI 50-70"
        renderArtifacts={(step) => (
          <>
            {step >= 3 && (
              <ChipRow
                label="Studio"
                addable={false}
                items={[
                  { icon: Wand2, k: 'AI compiles', v: 'Plain English → DSL' },
                  { icon: TrendingUp, k: 'Then', v: 'Walk-forward backtest' },
                  { icon: Sparkles, k: 'Gate', v: 'Sharpe → deploy' },
                ]}
              />
            )}
            {step >= 4 && tops.length > 0 && (
              <ArtifactCard title="Strongest tested strategies" meta="ranked by Sharpe">
                <div className="divide-y divide-line">
                  {tops.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() => router.push(`/strategies/${t.slug}`)}
                      className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2 text-left text-[12px] hover:bg-wrap-hover"
                    >
                      <span className="truncate font-medium text-d-text-primary">{t.name}</span>
                      <span className={`tabular-nums text-d-text-secondary ${MONO}`}>
                        Sharpe {t.backtest_sharpe!.toFixed(2)}
                      </span>
                      <span className={`tabular-nums text-up ${MONO}`}>
                        {t.backtest_win_rate != null ? formatPercent(t.backtest_win_rate, 0) : '-'}
                      </span>
                      <span className="rounded bg-wrap px-1.5 py-0.5 text-[10px] uppercase text-d-text-muted">
                        {t.tier_required}
                      </span>
                    </button>
                  ))}
                </div>
              </ArtifactCard>
            )}
            {step >= 5 && <ActionRow items={[[Wand2, 'Describe your own in plain English'], [Sparkles, 'Ask Copilot']]} />}
          </>
        )}
      />
      {/* Real CTA — jumps to the Builder tab where the LLM compile happens. */}
      <button
        onClick={onOpenBuilder}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12px] font-medium text-d-text-secondary transition-colors hover:text-d-text-primary"
        style={{ borderColor: `color-mix(in srgb, ${AI} 30%, transparent)` }}
      >
        <Wand2 size={13} className="text-ai" /> Build your own
      </button>
      {/* F&O quick-Q&A agent. The full options workspace now lives on /fno
          (Strategy Lab tab); this lightweight copilot stays here for convenience. */}
      <OptionsCopilotCard />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// LIBRARY TAB — /api/strategies/catalog/sections with legacy fallback
// ═══════════════════════════════════════════════════════════════════════

function LibraryTab({ onOpenTemplate }: { onOpenTemplate: (slug: string) => void }) {
  const [sections, setSections] = useState<CatalogSections | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.strategies.getCatalogSections()
        if (cancelled) return
        setSections(r.sections)
      } catch (e) {
        if (cancelled) return
        setError(handleApiError(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkelCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        tone="error"
        icon={<TrendingUp className="h-6 w-6" />}
        title="Library wouldn't load"
        description={error}
        action={<Button onClick={() => window.location.reload()}>Retry</Button>}
      />
    )
  }

  const sectionKeys: Array<keyof CatalogSections> = [
    'exclusive',
    'featured',
    'swing',
    'intraday',
    'options',
  ]
  const totalCount = sectionKeys.reduce(
    (n, k) => n + ((sections && sections[k]?.templates?.length) || 0),
    0,
  )

  if (!sections || totalCount === 0) {
    return (
      <EmptyState
        icon={<Wand2 className="h-6 w-6" />}
        title="Library's still filling up"
        description="The catalog is being seeded. Head to the Builder, describe your own in plain English, and let the AI compile and gate it."
      />
    )
  }

  return (
    <div className="space-y-8">
      {sectionKeys.map((key) => {
        const section = sections[key]
        if (!section || section.templates.length === 0) return null
        return (
          <section key={key} aria-labelledby={`lib-${key}`}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2
                  id={`lib-${key}`}
                  className="text-base font-semibold text-d-text-primary"
                >
                  {section.title}
                </h2>
                <p className="text-xs text-d-text-muted">{section.tagline}</p>
              </div>
              <p className="font-mono text-[11px] tabular-nums text-d-text-muted">
                {section.templates.length} templates
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.templates.map((t) => (
                <TemplateCard
                  key={t.slug}
                  t={t}
                  onClick={() => onOpenTemplate(t.slug)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TemplateCard({
  t,
  onClick,
}: {
  t: CatalogTemplate
  onClick: () => void
}) {
  return (
    <Card variant="clickable" onClick={onClick}>
      <CardHeader className="flex items-center justify-between gap-2">
        <span className="truncate" title={t.name}>
          {t.name}
        </span>
        {t.tags?.includes('coming-soon') ? (
          <Badge tone="muted">Coming soon</Badge>
        ) : (
          <Badge tone={t.tier_required === 'free' ? 'muted' : 'warning'}>
            {t.tier_required}
          </Badge>
        )}
      </CardHeader>
      {t.description && (
        <CardBody className="line-clamp-2 min-h-[2.5rem] text-xs text-d-text-muted">
          {t.description}
        </CardBody>
      )}
      <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
        <Stat label="Win rate" value={formatPercent(t.backtest_win_rate, 1)} />
        <Stat
          label="Sharpe"
          value={
            t.backtest_sharpe != null ? t.backtest_sharpe.toFixed(2) : '-'
          }
        />
        <Stat
          label="Min capital"
          value={t.min_capital ? `₹${(t.min_capital / 1000).toFixed(0)}k` : '-'}
        />
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm text-d-text-primary tabular-nums">
        {value}
      </p>
    </div>
  )
}

function SkelCard() {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-wrap p-4">
      <Skeleton w="60%" h="16px" />
      <Skeleton w="100%" h="32px" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton w="100%" h="36px" />
        <Skeleton w="100%" h="36px" />
        <Skeleton w="100%" h="36px" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MY STRATEGIES TAB — /api/strategies (list + transition controls)
// ═══════════════════════════════════════════════════════════════════════

function MyStrategiesTab() {
  const router = useRouter()
  const [items, setItems] = useState<UserStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.strategies.list()
      setItems(r.strategies)
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} w="100%" h="80px" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        tone="error"
        icon={<TrendingUp className="h-6 w-6" />}
        title="Your strategies wouldn't load"
        description={error}
        action={<Button onClick={load}>Retry</Button>}
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Wand2 className="h-7 w-7" />}
        title="Nothing built yet"
        description="Grab a tested template from the Library, or describe one in plain English and let the AI compile and gate it in the Builder."
        action={
          <Button
            onClick={() =>
              dispatchCopilotOpen('Suggest a strategy I can deploy with ₹1L starting capital.')
            }
          >
            Ask Copilot for a pick
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.length >= 2 && (
        <StrategyCompareCard strategies={items.map((s) => ({ id: s.id, name: s.name }))} />
      )}
      {items.map((s) => (
        <UserStrategyRow
          key={s.id}
          s={s}
          onTransitioned={load}
          onClick={() => router.push(`/strategies/mine/${s.id}`)}
        />
      ))}
    </div>
  )
}

function UserStrategyRow({
  s,
  onClick,
  onTransitioned,
}: {
  s: UserStrategy
  onClick: () => void
  onTransitioned: () => void
}) {
  const [busy, setBusy] = useState(false)

  const transition = async (to: UserStrategy['status']) => {
    setBusy(true)
    try {
      await api.strategies.transition(s.id, to)
      toast.success(`Strategy moved to ${to}`)
      onTransitioned()
    } catch (e) {
      toast.error('Transition failed', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  const archive = async () => {
    if (!confirm(`Archive "${s.name}"? You can still see it but it won't trade.`))
      return
    setBusy(true)
    try {
      await api.strategies.archive(s.id)
      toast.success('Strategy archived')
      onTransitioned()
    } catch (e) {
      toast.error('Archive failed', { description: handleApiError(e) })
    } finally {
      setBusy(false)
    }
  }

  const summary = s.last_backtest
  const tone = STATUS_TONE[s.status]

  return (
    <Card variant="glass">
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-d-text-primary">{s.name}</p>
            <Badge tone={tone}>{s.status}</Badge>
            <Badge tone="muted">{s.dsl.timeframe}</Badge>
            <Badge tone="muted">{s.dsl.universe}</Badge>
          </div>
          {summary && (
            <p className="mt-1 truncate font-mono text-xs text-d-text-muted">
              Last backtest · Sharpe {summary.sharpe_ratio.toFixed(2)} · Win{' '}
              {(summary.win_rate * 100).toFixed(0)}% · Return{' '}
              {summary.total_return_pct >= 0 ? '+' : ''}
              {summary.total_return_pct.toFixed(2)}%
            </p>
          )}
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          {s.status === 'draft' && (
            <Button size="sm" onClick={() => transition('paper')} disabled={busy}>
              Promote to paper
            </Button>
          )}
          {s.status === 'paper' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => transition('paused')}
              disabled={busy}
            >
              Pause
            </Button>
          )}
          {s.status === 'live' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => transition('paused')}
              disabled={busy}
            >
              Pause
            </Button>
          )}
          {s.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => transition('paper')}
              disabled={busy}
            >
              Resume
            </Button>
          )}
          {s.status !== 'archived' && (
            <Button size="sm" variant="ghost" onClick={archive} disabled={busy}>
              Archive
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

const STATUS_TONE: Record<UserStrategy['status'], 'up' | 'down' | 'warning' | 'muted' | 'primary'> = {
  draft: 'muted',
  backtest: 'muted',
  paper: 'primary',
  live: 'up',
  paused: 'warning',
  archived: 'muted',
}

// ═══════════════════════════════════════════════════════════════════════
// BUILDER TAB — NL prompt → /studio/compile → DSL preview → save → backtest
// ═══════════════════════════════════════════════════════════════════════

type BuilderPhase = 'idle' | 'compiling' | 'preview' | 'backtesting' | 'backtested'

function BuilderTab() {
  const [phase, setPhase] = useState<BuilderPhase>('idle')
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState<UserStrategy | null>(null)
  const [previewDsl, setPreviewDsl] = useState<DSLStrategy | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [clarify, setClarify] = useState<StudioClarification | null>(null)
  const [clarifyAnswer, setClarifyAnswer] = useState('')

  // Backtest params (shown once we have a draft)
  const [btSymbol, setBtSymbol] = useState('RELIANCE')
  const [btLookback, setBtLookback] = useState(180)
  const [btCapital, setBtCapital] = useState(500_000)
  const [btResult, setBtResult] = useState<DSLBacktestResult | null>(null)
  const [btError, setBtError] = useState<string | null>(null)

  const onCompile = async (override?: string) => {
    const q = (override ?? prompt).trim()
    if (!q || q.length < 3) {
      toast.error('Describe the strategy in at least a few words.')
      return
    }
    setPhase('compiling')
    setCompileError(null)
    try {
      const r = await api.strategies.studioCompile(q, true)
      if (r.needs_clarification === true) {
        setClarify(r)
        setPhase('idle')
        return
      }
      setClarify(null)
      setPreviewDsl(r.strategy)
      setDraft(r.saved_row || null)
      if (r.save_error) {
        toast.warning('Compiled but could not save', { description: r.save_error })
      }
      if (r.strategy.symbol) setBtSymbol(r.strategy.symbol)
      if (r.strategy.lookback_days) setBtLookback(r.strategy.lookback_days)
      setPhase('preview')
    } catch (e) {
      setCompileError(handleApiError(e))
      setPhase('idle')
    }
  }

  const onAnswerClarify = async () => {
    const ans = clarifyAnswer.trim()
    if (!ans) return
    const merged = `${prompt.trim()} — ${ans}`
    setPrompt(merged)
    setClarify(null)
    setClarifyAnswer('')
    await onCompile(merged)
  }

  const onSave = async () => {
    if (!previewDsl || draft) return
    try {
      const r = await api.strategies.create({
        dsl: previewDsl as unknown as Record<string, unknown>,
        name: previewDsl.name,
        source: 'studio',
      })
      setDraft(r.strategy)
      toast.success('Saved as draft')
    } catch (e) {
      toast.error('Save failed', { description: handleApiError(e) })
    }
  }

  const onBacktest = async () => {
    if (!draft) return
    setPhase('backtesting')
    setBtError(null)
    setBtResult(null)
    try {
      const r = await api.strategies.backtest(draft.id, {
        symbol: btSymbol.trim().toUpperCase(),
        lookback_days: btLookback,
        initial_capital: btCapital,
      })
      setBtResult(r)
      setPhase('backtested')
    } catch (e) {
      setBtError(handleApiError(e))
      setPhase('preview')
    }
  }

  const reset = () => {
    setPhase('idle')
    setPrompt('')
    setPreviewDsl(null)
    setDraft(null)
    setBtResult(null)
    setBtError(null)
    setCompileError(null)
    setClarify(null)
    setClarifyAnswer('')
  }

  if (phase === 'idle' || phase === 'compiling') {
    return (
      <div className="space-y-5">
        {/* Describe-intent area — the C-archetype NL composer. 16px radius,
            violet AI accent (this is the AI/NL builder surface). The actual
            NL→DSL compile is the only LLM-spending action here. */}
        <section>
          <EyebrowMono className="mb-2 flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5 text-ai" aria-hidden="true" />
            Describe it · AI compiles your entry and exit logic
          </EyebrowMono>
          <div
            className="rounded-2xl border bg-wrap p-1 transition-colors focus-within:border-ai/60"
            style={{ borderColor: `color-mix(in srgb, ${AI} 28%, transparent)` }}
          >
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Buy Nifty 50 stocks when 20EMA crosses above 50EMA and RSI is between 50 and 70. Exit when 20EMA crosses back below 50EMA, or stop-loss at -3%."
              className="w-full resize-none rounded-[14px] bg-transparent p-3 text-sm text-d-text-primary outline-none placeholder:text-d-text-muted"
              aria-label="Strategy description"
              disabled={phase === 'compiling'}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2 pt-1">
              <p className="text-[11px] text-d-text-muted">
                The Studio agent turns your words into a DSL. Walk-forward
                backtest it, clear the gate, then deploy.
              </p>
              <button
                type="button"
                onClick={() => onCompile()}
                disabled={phase === 'compiling' || !prompt.trim()}
                className="bg-gradient-cta inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold text-on-signature transition-transform active:scale-[0.97] disabled:opacity-50"
              >
                {phase === 'compiling' ? 'Compiling…' : 'Compile to DSL'}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {compileError && (
            <p className="mt-3 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-xs text-down">
              {compileError}
            </p>
          )}

          {clarify && (
            <div
              className="mt-3 rounded-2xl border bg-wrap p-4"
              style={{ borderColor: `color-mix(in srgb, ${AI} 34%, transparent)` }}
            >
              <p className="text-sm text-d-text-primary">{clarify.question}</p>
              {clarify.missing.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {clarify.missing.map((m) => (
                    <span
                      key={m}
                      className="rounded-pill border border-line px-2 py-0.5 text-[11px] capitalize text-d-text-secondary"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {clarify.assumptions.length > 0 && (
                <p className="mt-2.5 text-[11px] text-d-text-muted">
                  If you don’t say, I’ll assume: {clarify.assumptions.join(' · ')}
                </p>
              )}
              <textarea
                rows={3}
                value={clarifyAnswer}
                onChange={(e) => setClarifyAnswer(e.target.value)}
                placeholder="Add the missing details…"
                className="mt-3 w-full resize-none rounded-[14px] border border-line bg-transparent p-3 text-sm text-d-text-primary outline-none placeholder:text-d-text-muted focus:border-ai/60"
                aria-label="Clarification answer"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onAnswerClarify}
                  disabled={!clarifyAnswer.trim() || phase === 'compiling'}
                  className="bg-gradient-cta inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold text-on-signature transition-transform active:scale-[0.97] disabled:opacity-50"
                >
                  Refine &amp; compile
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Example prompts — quick-start chips */}
        <section>
          <EyebrowMono className="mb-2">Hand the AI a starting point</EyebrowMono>
          <div className="flex flex-col gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrompt(p)}
                className="rounded-lg border border-line bg-wrap px-3 py-2.5 text-left text-xs text-d-text-secondary transition-colors hover:border-wrap-line hover:text-d-text-primary"
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Vision-to-Strategy — upload a chart screenshot → synthesized prompt.
            Fills the textarea above; the user reviews/edits then hits Compile. */}
        <section>
          <EyebrowMono className="mb-2">Or read a chart screenshot</EyebrowMono>
          <VisionUpload onPromptReady={(p) => { setPrompt(p); setClarify(null) }} />
        </section>
      </div>
    )
  }

  // preview / backtesting / backtested — DSL + form + (optional) results
  return (
    <div className="space-y-4">
      {previewDsl && <DSLPreview dsl={previewDsl} />}

      {/* Config grid — backtest period + params in a clean hairline card */}
      <Card>
        <CardHeader>Set up the walk-forward backtest</CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <EyebrowMono className="mb-1.5">Symbol</EyebrowMono>
              <Input
                value={btSymbol}
                onChange={(e) => setBtSymbol(e.target.value)}
                placeholder="RELIANCE"
                aria-label="Backtest symbol"
              />
            </div>
            <div>
              <EyebrowMono className="mb-1.5">Lookback (days)</EyebrowMono>
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
              <EyebrowMono className="mb-1.5">Initial capital (₹)</EyebrowMono>
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

          {btError && (
            <p className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-xs text-down">
              {btError}
            </p>
          )}

          {/* uTrade-grade inline validate→deploy grammar:
              Paper/Live · Backtest · Payoff · Margin · Deploy + gate badge. */}
          <StrategyActionRow
            dsl={previewDsl}
            draft={draft}
            phase={phase}
            capital={btCapital}
            onSave={onSave}
            onBacktest={onBacktest}
            onReset={reset}
            btResult={btResult}
          />
          {!draft && previewDsl && (
            <p className="text-[11px] text-d-text-muted">
              Save the draft first. The backtest needs a strategy ID to log
              results against.
            </p>
          )}
        </CardBody>
      </Card>

      {btResult && <BacktestViewer result={btResult} />}
    </div>
  )
}
