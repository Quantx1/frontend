'use client'

/**
 * MarketPanel — the six faces behind [Details] on the market card.
 *
 * Everything that used to be stacked down `/markets` lives here: internals,
 * flows, sectors, the regime gauge, movers and headlines. The page answers the
 * question; this holds the evidence.
 *
 * ── Why the fetching lives HERE and not on the page ────────────────────────
 * `/markets` ran seven `useSWR` hooks at page level. Once the answer moved to
 * the template renderer, nothing on the page consumed six of them — but SWR
 * fetches on mount regardless, so the page was still paying nineteen requests
 * to render two sentences and a card.
 *
 * `ContextPanel` returns null while closed, so this component never mounts and
 * none of these hooks run until someone actually asks for the detail. Opening
 * the panel is what pays for the data, which is the same bargain the whole
 * redesign makes: the default is the answer, the depth is a choice.
 */

import useSWR from 'swr'

import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { numMax } from '@/lib/format'
import { Skeleton } from '@/components/foundation'

import MarketPulseCard from './MarketPulseCard'
import AiRadarStrip from './AiRadarStrip'
import OrderFlowAnalysis from './OrderFlowAnalysis'
import SectorRotationCard from './SectorRotationCard'
import { RegimeGauge, regimeToScore } from './RegimeGauge'
import { MoversColumns, type Mover } from './MoversColumns'
import { SectorHeatmap } from './SectorHeatmap'
import type { PanelFace } from '@/components/shell/ContextPanel'

const SWR_OPTS = { revalidateOnFocus: false, dedupingInterval: 30_000 }
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '--')
const pct = (n?: number | null, d = 2) =>
  n == null || Number.isNaN(n) ? '--' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`
const num = (n?: number | null) => (n == null || Number.isNaN(n) ? '--' : numMax(n, 2))

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-meta text-d-text-muted">{children}</p>
}

/**
 * Build the panel's faces.
 *
 * A hook rather than a component so the caller owns the `<ContextPanel>` and
 * can decide which face opens — tapping a "Sectors" chip should land on
 * Sectors, not on Overview with a second tap required.
 */
export function useMarketPanelFaces(dataEntitled: boolean): PanelFace[] {
  const regime = useSWR('mkt-regime', () => api.publicTrust.regimeHistory(60).catch(() => null), SWR_OPTS)
  const sectors = useSWR('mkt-sectors', () => api.screener.sectorHeatmap().catch(() => null), SWR_OPTS)
  const global = useSWR('mkt-global', () => api.market.getGlobal().catch(() => null), SWR_OPTS)
  const news = useSWR('mkt-news', () => api.screener.newsScan({ universe: 'nifty100', limit: 12 }).catch(() => null), SWR_OPTS)
  const headlines = useSWR('mkt-headlines', () => api.market.news().catch(() => null), SWR_OPTS)
  // Same key as MarketPulseCard → one shared cache entry, not a second request.
  const pulse = useSWR('mkt-pulse', () => api.screener.marketPulse().catch(() => null), SWR_OPTS)

  const cur = (regime.data as any)?.current
  const regimeConf = cur ? Math.round(Math.max(cur.prob_bull, cur.prob_sideways, cur.prob_bear) * 100) : null
  const sectorList = (((sectors.data as any)?.sectors ?? []) as any[])
    .slice()
    .sort((a, b) => b.avg_change_pct - a.avg_change_pct)
  const globalItems = (((global.data as any)?.items ?? []) as any[]).filter((g) => g.last != null)
  const newsItems = ((headlines.data as any)?.items ?? []) as any[]

  const niftyHist = (((regime.data as any)?.history ?? []) as any[])
    .map((h: any) => h.nifty_close)
    .filter((x: any): x is number => x != null)
  const momentumPct = niftyHist.length >= 22
    ? ((niftyHist[niftyHist.length - 1] / niftyHist[niftyHist.length - 22]) - 1) * 100
    : null
  const gaugeScore = regimeToScore(cur, {
    breadthScore: ((pulse.data as any)?.breadth?.score ?? null) as number | null,
    momentumPct,
  })

  // Per-stock change% is a raw NSE quote — gated by emptying the list, not by
  // rendering a placeholder number.
  const movers: Mover[] = dataEntitled
    ? (((news.data as any)?.hits ?? []) as any[])
        .filter((h) => h.change_pct_today != null)
        .map((h) => ({
          symbol: h.symbol,
          changePct: h.change_pct_today ?? null,
          sub: h.top_headline || h.setup_tag || undefined,
        }))
    : []

  return [
    {
      value: 'overview',
      label: 'Overview',
      content: (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center">
            <RegimeGauge
              score={gaugeScore}
              caption={cur ? `Regime ${cap(cur.regime)} · ${regimeConf}% confidence` : undefined}
              size="lg"
            />
          </div>
          <div>
            <p className="mb-2 text-micro uppercase text-d-text-muted">Global cues</p>
            {globalItems.length ? (
              <div className="flex flex-col gap-1.5">
                {globalItems.map((g: any) => (
                  <div key={g.key || g.label} className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-meta text-d-text-secondary">{g.label}</span>
                    <span className="shrink-0">
                      <span className={`${MONO} text-meta text-d-text-primary`}>{num(g.last)}</span>
                      <span className={`${MONO} ml-2 text-meta ${(g.change_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
                        {pct(g.change_pct)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : global.data === undefined ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <Empty>Global cues unavailable right now.</Empty>
            )}
          </div>
        </div>
      ),
    },
    { value: 'internals', label: 'Internals', content: <MarketPulseCard /> },
    { value: 'flows', label: 'Flows', content: <OrderFlowAnalysis entitled={dataEntitled} /> },
    {
      value: 'sectors',
      label: 'Sectors',
      content: (
        <div className="flex flex-col gap-5">
          {sectorList.length ? (
            <SectorHeatmap sectors={sectorList as any} max={12} />
          ) : sectors.data === undefined ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Empty>Sector data unavailable right now.</Empty>
          )}
          <SectorRotationCard />
        </div>
      ),
    },
    {
      value: 'radar',
      label: 'Radar',
      content: (
        <div className="flex flex-col gap-5">
          <AiRadarStrip />
          {movers.length > 0 && <MoversColumns movers={movers} />}
        </div>
      ),
    },
    {
      value: 'news',
      label: 'News',
      content: newsItems.length ? (
        <ul className="flex flex-col gap-3">
          {newsItems.slice(0, 12).map((n: any, i: number) => (
            <li key={n.link || i}>
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-meta text-d-text-secondary transition-colors hover:text-d-text-primary"
              >
                {n.title}
              </a>
              <p className="mt-0.5 text-micro text-d-text-muted">
                {[n.source, n.region].filter(Boolean).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      ) : headlines.data === undefined ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Empty>No fresh headlines right now.</Empty>
      ),
    },
  ]
}
