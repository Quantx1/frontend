'use client'

/**
 * NewsTab (PR-S4) — news-driven scanner.
 *
 * Surfaces stocks with strong news sentiment paired with notable (or
 * absent) price reaction. Six setup tags:
 *   * positive_news_underreaction  — material +news, flat price
 *   * negative_news_underreaction  — material -news, flat price
 *   * positive_news_continuation   — +news, +price ≥1.5%
 *   * negative_news_continuation   — -news, -price ≤-1.5%
 *   * positive_news_divergence     — +news, -price (rare reversal candidate)
 *   * negative_news_divergence     — -news, +price (rare reversal candidate)
 *
 * Headline + source + sentiment score visible per row. No buy/sell
 * recommendations — strictly descriptive surfaces.
 */

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  AlertTriangle,
  ExternalLink,
  Newspaper,
  RefreshCw,
} from '@/lib/icons'

import {
  Badge,
  Button,
  ChangeBadge,
  EmptyState,
  Skeleton,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

type Hit = NonNullable<
  Awaited<ReturnType<typeof api.screener.newsScan>>
>['hits'][number]

const UNIVERSE_OPTIONS: Array<{
  value: 'nifty50' | 'nifty100' | 'nifty500' | 'nse_all'
  label: string
}> = [
  { value: 'nifty50',  label: 'Nifty 50' },
  { value: 'nifty100', label: 'Nifty 100' },
  { value: 'nifty500', label: 'Nifty 500' },
  { value: 'nse_all',  label: 'NSE All' },
]

const TAG_LABELS: Record<string, { label: string; tone: 'up' | 'down' | 'warning' | 'muted' }> = {
  positive_news_underreaction: { label: 'Positive — underreaction', tone: 'up' },
  negative_news_underreaction: { label: 'Negative — underreaction', tone: 'down' },
  positive_news_continuation:  { label: 'Positive — continuation',  tone: 'up' },
  negative_news_continuation:  { label: 'Negative — continuation',  tone: 'down' },
  positive_news_divergence:    { label: 'Positive — price divergence', tone: 'warning' },
  negative_news_divergence:    { label: 'Negative — price divergence', tone: 'warning' },
}

export default function NewsTab() {
  const [universe, setUniverse] = useState<'nifty50' | 'nifty100' | 'nifty500' | 'nse_all'>('nifty50')
  const [lookback, setLookback] = useState(1)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])

  // Sector list (cached 5min) — shared with PatternsV2Tab via SWR key
  const { data: sectorsData } = useSWR(
    'patterns_v2_sectors',
    () => api.screener.patternsV2Sectors(),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )

  const { data, error, isLoading, mutate } = useSWR(
    ['news_scan', universe, lookback, selectedSectors.join(',')],
    () => api.screener.newsScan({
      universe,
      sectors: selectedSectors.length ? selectedSectors : undefined,
      lookback_days: lookback,
      limit: 30,
    }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      // News doesn't change minute-to-minute; 5min stale is reasonable
      dedupingInterval: 300_000,
    },
  )

  const hits: Hit[] = data?.hits ?? []

  return (
    <div className="space-y-4">
      {/* Filter strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-wrap/60 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Universe
          </span>
          {UNIVERSE_OPTIONS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => setUniverse(u.value)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                universe === u.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Lookback
          </span>
          {[1, 2, 3, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLookback(n)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                lookback === n
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {n}d
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-d-text-muted">
          {data && (
            <span className="font-mono">
              {data.count} hits · {data.symbols_scanned} scanned
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={() => mutate()} aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Sector pre-filter (PR-S2.1) */}
      {sectorsData && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-wrap/40 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Sector
          </span>
          <button
            type="button"
            onClick={() => setSelectedSectors([])}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
              selectedSectors.length === 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
            }`}
          >
            All
          </button>
          {sectorsData.sectors.filter((s) => s.count > 0).map((s) => {
            const active = selectedSectors.includes(s.sector)
            return (
              <button
                key={s.sector}
                type="button"
                onClick={() => {
                  setSelectedSectors((cur) =>
                    cur.includes(s.sector)
                      ? cur.filter((x) => x !== s.sector)
                      : [...cur, s.sector],
                  )
                }}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                {s.sector}
              </button>
            )
          })}
        </div>
      )}

      {error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="News scanner failed"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : isLoading && hits.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="100px" />)}
        </div>
      ) : hits.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="h-7 w-7" />}
          title="No material news today"
          description="Try widening the lookback or switching to a larger universe."
        />
      ) : (
        <div className="space-y-2">
          {hits.map((h) => (
            <HitCard key={h.symbol} hit={h} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-d-text-muted">
        Sentiment scored by Quant X on Google News headlines. Setup tags are descriptive,
        not recommendations — the trade decision is yours.
      </p>
    </div>
  )
}


function HitCard({ hit }: { hit: Hit }) {
  const tag = TAG_LABELS[hit.setup_tag] || { label: hit.setup_tag, tone: 'muted' as const }
  return (
    <article className="rounded-lg border border-line bg-wrap/60 p-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={stockHref(hit.symbol)}
              className="font-semibold text-d-text-primary hover:text-primary"
            >
              {hit.symbol}
            </Link>
            <Badge tone={tag.tone}>{tag.label}</Badge>
            <span className="font-mono text-[10px] text-d-text-muted">
              {hit.headline_count} headlines
            </span>
          </div>
          {hit.top_headline && (
            <p className="mt-1 text-sm text-d-text-secondary">
              {hit.top_headline}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="font-mono text-sm tabular-nums text-d-text-primary">
            ₹{hit.last_price.toFixed(2)}
          </div>
          <ChangeBadge value={hit.change_pct_today} kind="percent" />
        </div>
      </header>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
        <div className="flex items-center gap-3 text-[11px]">
          <div>
            <span className="text-d-text-muted">Sentiment </span>
            <span className={`font-mono ${
              hit.news_sentiment > 0.2 ? 'text-up'
                : hit.news_sentiment < -0.2 ? 'text-down'
                  : 'text-d-text-secondary'
            }`}>
              {hit.news_sentiment >= 0 ? '+' : ''}{hit.news_sentiment.toFixed(2)}
            </span>
          </div>
        </div>
        {hit.headlines.length > 1 && (
          <details className="text-[11px]">
            <summary className="cursor-pointer text-d-text-muted hover:text-d-text-primary">
              All {hit.headlines.length} headlines
            </summary>
            <ul className="mt-1.5 space-y-1">
              {hit.headlines.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-d-text-muted" />
                  <a
                    href={h.link} target="_blank" rel="noopener noreferrer"
                    className="text-d-text-secondary hover:text-primary"
                  >
                    {h.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  )
}
