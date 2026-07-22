'use client'

/**
 * PowerScreenersTab (PR-S7) — confluence + deep-dive technical screener.
 *
 * Three controls:
 *   1. Scanner picker — categorised checkboxes (breakout / momentum /
 *      reversal / volume / pattern / candle / ma / volatility / smart_money / fo)
 *   2. Sector filter chips — pre-filter the universe before confluence
 *   3. Min hits — only show stocks matched by N+ scanners
 *
 * Result cards rank by composite_score (weighted hits + category
 * diversity + price/vol confirm − bearish drag). Click a card to open
 * the deep-dive drawer with every indicator currently firing + ATR
 * levels + sector breadth + news + earnings + AI thesis.
 */

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  AlertTriangle,
  Bookmark,
  Brain,
  CheckCircle2,
  ChevronRight,
  Newspaper,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from '@/lib/icons'

import {
  Badge,
  Button,
  ChangeBadge,
  EmptyState,
  Skeleton,
  toast,
} from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { api, handleApiError } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

// PR-S11 — IST market-hours auto-refresh
function _isMarketHoursIST(): boolean {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  if (day === 0 || day === 6) return false
  const h = ist.getHours()
  const m = ist.getMinutes()
  const mins = h * 60 + m
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30
}

type Match = NonNullable<
  Awaited<ReturnType<typeof api.screener.powerConfluence>>
>['matches'][number]

type Explain = Awaited<ReturnType<typeof api.screener.powerExplain>>

// Default scanner set — diverse high-conviction picks
const DEFAULT_SCANNERS = [1, 4, 8, 14, 17, 23, 24, 26, 36, 46]

const CATEGORY_TONE: Record<string, 'up' | 'down' | 'warning' | 'muted' | 'primary'> = {
  breakout: 'up',
  momentum: 'up',
  reversal: 'warning',
  volume: 'primary',
  pattern: 'primary',
  candle: 'muted',
  ma: 'muted',
  volatility: 'muted',
  smart_money: 'up',
  fo: 'warning',
  weakness: 'down',
  other: 'muted',
}

export default function PowerScreenersTab() {
  const [selectedScanners, setSelectedScanners] = useState<number[]>(DEFAULT_SCANNERS)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [minHits, setMinHits] = useState(2)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Catalog of all scanners (categorised)
  const { data: catalog } = useSWR(
    'power_catalog',
    () => api.screener.powerCatalog(),
    { revalidateOnFocus: false, dedupingInterval: 600_000 },
  )

  const { data: sectorsData } = useSWR(
    'patterns_v2_sectors',
    () => api.screener.patternsV2Sectors(),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )

  const { data, error, isLoading, mutate } = useSWR(
    ['power_confluence', selectedScanners.join(','), minHits, selectedSectors.join(',')],
    () => api.screener.powerConfluence({
      scanners: selectedScanners,
      min_hits: minHits,
      sectors: selectedSectors.length ? selectedSectors : undefined,
      limit: 50,
    }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60_000,
      // PR-S11 — auto-tick every 60s during market hours
      refreshInterval: () => (_isMarketHoursIST() ? 60_000 : 0),
    },
  )

  // PR-S10 — pre-load scanner stats so the deep-dive can show WR per scanner
  const { data: statsData } = useSWR(
    'scanner_stats_all',
    () => api.screener.scannerStats(),
    { revalidateOnFocus: false, dedupingInterval: 600_000 },
  )
  const statsBySid: Record<number, NonNullable<typeof statsData>['stats'][number]> = {}
  for (const s of statsData?.stats ?? []) statsBySid[s.scanner_id] = s

  const matches = data?.matches ?? []
  const groupedScanners = useMemo(() => {
    const groups: Record<string, typeof catalog extends infer T ? (T extends { scanners: infer S } ? S : never) : never> = {}
    if (!catalog) return groups as any
    for (const s of catalog.scanners) {
      if (!groups[s.category]) (groups as any)[s.category] = []
      ;(groups as any)[s.category].push(s)
    }
    return groups
  }, [catalog])

  const toggleScanner = (id: number) =>
    setSelectedScanners((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])

  const toggleSector = (sector: string) =>
    setSelectedSectors((cur) => cur.includes(sector) ? cur.filter((x) => x !== sector) : [...cur, sector])

  return (
    <div className="space-y-4">
      {/* Header strip — scanner count + min hits + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-wrap/60 px-3 py-2">
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <Badge tone="primary">{selectedScanners.length} scanners</Badge>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              Min hits
            </span>
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMinHits(n)}
                className={`rounded-md px-2 py-1 ${
                  minHits === n
                    ? 'glass-control-accent'
                    : 'glass-control text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                {n}+
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-d-text-muted">
          {data && (
            <span className="font-mono">
              {data.count} confluence hits · {data.symbols_evaluated} symbols
            </span>
          )}
          <Button
            size="sm" variant="ghost"
            onClick={async () => {
              const name = prompt('Name this saved scan:', `Confluence ${selectedScanners.length} scanners`)
              if (!name) return
              try {
                await api.screener.createSavedScan({
                  name,
                  scanner_ids: selectedScanners,
                  universe: 'nifty500',
                  sectors: selectedSectors.length ? selectedSectors : undefined,
                  min_hits: minHits,
                  schedule: 'hourly',
                  notify_channels: ['push'],
                })
                toast.success('Saved — will auto-run hourly', {
                  description: 'Open the "Saved & Alerts" tab to manage.',
                })
              } catch (e) {
                toast.error('Save failed', { description: handleApiError(e) })
              }
            }}
            aria-label="Save this scan"
          >
            <Bookmark className="mr-1 h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => mutate()} aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Sector chips */}
      {sectorsData && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-wrap/40 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Sector
          </span>
          <button
            type="button"
            onClick={() => setSelectedSectors([])}
            className={`rounded-full px-2.5 py-0.5 text-[11px] ${
              selectedSectors.length === 0
                ? 'glass-control-accent'
                : 'glass-control text-d-text-secondary hover:text-d-text-primary'
            }`}
          >
            All
          </button>
          {sectorsData.sectors.filter((s) => s.count > 0).map((s) => (
            <button
              key={s.sector}
              type="button"
              onClick={() => toggleSector(s.sector)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                selectedSectors.includes(s.sector)
                  ? 'glass-control-accent'
                  : 'glass-control text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {s.sector}
            </button>
          ))}
        </div>
      )}

      {/* Scanner picker — collapsible by category */}
      {catalog && (
        <details className="rounded-md border border-line bg-wrap/40 px-3 py-2">
          <summary className="cursor-pointer text-xs text-d-text-secondary hover:text-d-text-primary">
            Scanners ({selectedScanners.length}/{catalog.count} selected) — click to customise
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groupedScanners).map(([cat, scanners]) => (
              <div key={cat}>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                  {cat.replace('_', ' ')}
                </p>
                <ul className="space-y-1">
                  {(scanners as any[]).map((s: any) => {
                    const wr = statsBySid[s.id]
                    return (
                      <li key={s.id}>
                        <label className="flex cursor-pointer items-center gap-1.5 text-[11px]">
                          <input
                            type="checkbox"
                            checked={selectedScanners.includes(s.id)}
                            onChange={() => toggleScanner(s.id)}
                            className="h-3 w-3 accent-primary"
                          />
                          <span className={s.direction === 'bearish' ? 'text-down' : 'text-d-text-secondary'}>
                            {s.name}
                          </span>
                          {s.weight > 1.0 && (
                            <span className="font-mono text-[9px] text-primary">×{s.weight.toFixed(1)}</span>
                          )}
                          {wr && wr.total_hits > 10 && (
                            <span
                              className={`font-mono text-[9px] ${
                                wr.win_rate_5d >= 0.55 ? 'text-up'
                                  : wr.win_rate_5d >= 0.45 ? 'text-d-text-secondary'
                                    : 'text-d-text-muted'
                              }`}
                              title={`${wr.total_hits} hits · 5d WR ${(wr.win_rate_5d * 100).toFixed(0)}% · avg ${wr.avg_return_5d_pct.toFixed(1)}%`}
                            >
                              · {(wr.win_rate_5d * 100).toFixed(0)}% WR
                            </span>
                          )}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Results */}
      {error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Confluence screener failed"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : isLoading && matches.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} w="100%" h="100px" />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-7 w-7" />}
          title="No confluence hits"
          description="Try lowering the min hits, expanding the sector filter, or adding more scanners."
        />
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <ConfluenceCard key={m.symbol} match={m} onOpen={() => setSelectedMatch(m)} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-d-text-muted">
        Confluence = stocks matching multiple independent setups simultaneously.
        Composite score blends hit count, category diversity, per-scanner weight,
        price/volume confirmation, and a bearish-scanner drag. Not a trade signal.
      </p>

      {selectedMatch && (
        <ExplainDrawer match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────
// One confluence card
// ─────────────────────────────────────────────────────────────────────

function ConfluenceCard({ match, onOpen }: { match: Match; onOpen: () => void }) {
  const tone = match.composite_score >= 4
    ? 'up'
    : match.composite_score >= 2
      ? 'primary'
      : 'muted'
  return (
    <article
      className="cursor-pointer rounded-lg border border-line bg-wrap/60 p-3 transition-colors hover:bg-wrap-hover"
      onClick={onOpen}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SymbolLogo symbol={match.symbol} size={28} />
            <h3 className="font-semibold text-d-text-primary">{match.symbol}</h3>
            <Badge tone={tone}>score {match.composite_score.toFixed(1)}</Badge>
            <Badge tone="muted">
              {match.bull_count} bull{match.bear_count > 0 ? ` · ${match.bear_count} bear` : ''}
            </Badge>
            {match.sector && (
              <span className="font-mono text-[10px] text-d-text-muted">{match.sector}</span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-d-text-muted line-clamp-1">
            {match.name}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm tabular-nums text-d-text-primary">
            ₹{match.last_price.toFixed(2)}
          </div>
          <ChangeBadge value={match.change_pct} kind="percent" />
        </div>
      </header>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
        {match.hits.slice(0, 6).map((h) => (
          <span
            key={h.scanner_id}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${
              h.bullish
                ? `border-${CATEGORY_TONE[h.category]}/40 text-d-text-secondary`
                : 'border-down/40 text-down'
            }`}
            title={`${h.scanner_name} (${h.category}, weight ${h.weight}×)`}
          >
            {h.scanner_name.split(' ').slice(0, 3).join(' ')}
          </span>
        ))}
        {match.hits.length > 6 && (
          <span className="font-mono text-[10px] text-d-text-muted">
            +{match.hits.length - 6}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-[11px] text-primary">
          <Brain className="h-3.5 w-3.5" />
          Deep dive →
        </span>
      </div>
    </article>
  )
}


// ─────────────────────────────────────────────────────────────────────
// Deep-dive drawer
// ─────────────────────────────────────────────────────────────────────

function ExplainDrawer({ match, onClose }: { match: Match; onClose: () => void }) {
  const [data, setData] = useState<Explain | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.screener.powerExplain(match.symbol, {
      use_llm: true, use_news: true, use_earnings: true,
    })
      .then((r) => { if (!cancelled) setData(r) })
      .catch((e) => { if (!cancelled) setError(handleApiError(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [match.symbol])

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-main shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-semibold text-d-text-primary">
              <SymbolLogo symbol={match.symbol} size={24} />
              {match.symbol}
            </h3>
            <p className="text-[11px] text-d-text-muted line-clamp-1">{match.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-d-text-muted hover:text-d-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Scanner hits */}
          <section>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              Matched {match.hit_count} scanners across {match.category_diversity} categories
            </p>
            <div className="flex flex-wrap gap-1">
              {match.hits.map((h) => (
                <Badge key={h.scanner_id} tone={h.bullish ? 'up' : 'down'}>
                  {h.scanner_name}
                </Badge>
              ))}
            </div>
          </section>

          {/* Suggested levels */}
          {data?.suggested_levels && (
            <section>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                Suggested levels (ATR-derived)
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-md border border-line bg-wrap p-3 text-xs">
                <Stat label="Entry" value={`₹${data.suggested_levels.entry}`} />
                <Stat label={`Stop · ${data.suggested_levels.stop_basis}`}
                      value={<span className="text-down">₹{data.suggested_levels.stop}</span>} />
                <Stat label="Target" value={<span className="text-up">₹{data.suggested_levels.target1}</span>} />
              </div>
              <div className="mt-1 text-right font-mono text-[11px] text-d-text-muted">
                R:R {data.suggested_levels.risk_reward}:1
              </div>
            </section>
          )}

          {/* Indicators firing */}
          {data?.indicators_firing && data.indicators_firing.length > 0 && (
            <section>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                Indicators firing
              </p>
              <ul className="space-y-1.5 rounded-md border border-line bg-wrap p-3 text-xs">
                {data.indicators_firing.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                      i.status === 'bullish' ? 'bg-up'
                        : i.status === 'bearish' ? 'bg-down'
                          : 'bg-d-text-muted'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-d-text-primary">{i.name}</span>
                        <span className="font-mono text-[11px] text-d-text-secondary">
                          {i.value}
                        </span>
                      </div>
                      {i.note && <p className="text-[10px] text-d-text-muted">{i.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sector breadth */}
          {data?.sector_breadth && (
            <section>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                Sector context
              </p>
              <div className="rounded-md border border-line bg-wrap p-3 text-xs">
                <span className="text-d-text-secondary">
                  {data.sector_breadth.up_today}/{data.sector_breadth.peer_count} {data.sector_breadth.sector}{' '}
                  peers up &gt;1% today (
                  <span className={data.sector_breadth.breadth_pct >= 60 ? 'text-up' : 'text-d-text-muted'}>
                    {data.sector_breadth.breadth_pct}% breadth
                  </span>)
                </span>
              </div>
            </section>
          )}

          {/* News */}
          {data?.top_headlines && data.top_headlines.length > 0 && (
            <section>
              <p className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                <Newspaper className="h-3 w-3" />
                News (sentiment{' '}
                {data.news_sentiment != null
                  ? <span className={data.news_sentiment > 0 ? 'text-up' : data.news_sentiment < 0 ? 'text-down' : ''}>
                      {data.news_sentiment >= 0 ? '+' : ''}{data.news_sentiment.toFixed(2)}
                    </span>
                  : '—'})
              </p>
              <ul className="space-y-1.5">
                {data.top_headlines.map((h, i) => (
                  <li key={i}>
                    <a href={h.link} target="_blank" rel="noopener noreferrer"
                       className="block rounded-md border border-line bg-wrap p-2 text-xs text-d-text-secondary hover:text-d-text-primary">
                      {h.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Earnings */}
          {data?.earnings_in_days != null && (
            <section>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                Earnings
              </p>
              <p className="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
                {data.earnings_note ?? `Earnings in ${data.earnings_in_days} day(s)`}
              </p>
            </section>
          )}

          {/* AI thesis */}
          {data?.ai_thesis && (
            <section>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                AI thesis
              </p>
              <p className="rounded-md border border-line bg-wrap p-3 text-xs leading-relaxed text-d-text-secondary">
                {data.ai_thesis}
              </p>
              <p className="mt-1 text-[10px] text-d-text-muted">
                Factual narration — not a trade recommendation.
              </p>
            </section>
          )}

          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} w="100%" h="60px" />)}
            </div>
          )}

          {error && (
            <p className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-xs text-down">
              {error}
            </p>
          )}

          <Link href={stockHref(match.symbol)} className="block" onClick={onClose}>
            <Button className="w-full">
              Open chart
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-wider text-d-text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-d-text-primary">{value}</p>
    </div>
  )
}
