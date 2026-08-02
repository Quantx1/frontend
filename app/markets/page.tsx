'use client'

/* ============================================================================
   QUANT X — Markets (PR-V4 · pre-market research hub)
   The complete daily desk, bento-grid: AI briefing hero · Market Pulse
   (internals / flows / positioning / delivery / valuation) · AI Radar ·
   regime gauge + sector heatmap · what's-happening AI analysis · sector
   rotation · headlines · big deals · order-flow (gated). Ad-hoc questions
   go to the Copilot dock (⌘/) — no embedded agent here. Glass design, both
   themes, real engine names, SEBI-labelled data lanes.
   ============================================================================ */

import useSWR from 'swr'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  LineChart, Newspaper, TrendingUp, Grid3x3, ArrowUpRight, Zap,
} from '@/lib/icons'
import { api } from '@/lib/api'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import { AppShell } from '@/components/shell/AppShell'
import { Reveal, Card, Skeleton, DisclaimerFooter, EyebrowMono } from '@/components/foundation'
import { MONO } from '@/lib/tokens'
import MarketPulseCard from '@/components/markets/MarketPulseCard'
import AiRadarStrip from '@/components/markets/AiRadarStrip'
import BigDealsCard from '@/components/markets/BigDealsCard'
import DailyBriefingCard from '@/components/markets/DailyBriefingCard'
import OrderFlowAnalysis from '@/components/markets/OrderFlowAnalysis'
import SectorRotationCard from '@/components/markets/SectorRotationCard'
import BreadthCard from '@/components/markets/BreadthCard'
import MarketExplainerCard from '@/components/markets/MarketExplainerCard'
import { IndexStrip } from '@/components/markets/IndexStrip'
import { RegimeGauge, regimeToScore } from '@/components/markets/RegimeGauge'
import { MoversColumns, type Mover } from '@/components/markets/MoversColumns'
import { SectorHeatmap } from '@/components/markets/SectorHeatmap'

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '--')
const pct = (n?: number | null, d = 2) => (n == null || Number.isNaN(n) ? '--' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`)
const num = (n?: number | null) => (n == null || Number.isNaN(n) ? '--' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 }))
const SWR_OPTS = { revalidateOnFocus: false, dedupingInterval: 30_000 }

/** Impact-first headline order: big stories first, newest first within a tier. */
const headlineOrder = (items: any[]) =>
  items.slice().sort((a, b) => {
    if (!!b.is_big !== !!a.is_big) return b.is_big ? 1 : -1
    return new Date(b.published || 0).getTime() - new Date(a.published || 0).getTime()
  })

/** Compact relative timestamp ("42m ago" / "3h ago"); null when unknown. */
const timeAgo = (iso?: string | null) => {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null
  const m = Math.round(ms / 60_000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

/**
 * MarketDataGate — the unified SEBI Path-A gate card. Shown in place of the
 * live NSE index/price block when the viewer is NOT data-entitled (no connected
 * broker feed and no NSE display licence). Honest + premium, not alarming: the
 * derived analytics (regime, global cues, sector, explainer, mood, news) still
 * render around it, so the page stays valuable.
 */
function MarketDataGate() {
  return (
    <div className="lg-surface lg-ring flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-primary/15 text-primary"><Zap size={20} /></span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-d-text-primary">Live NSE prices &amp; flows — from your broker</h2>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-d-text-muted">
            We show live NSE quotes, FII/DII flows and F&amp;O data straight from your own broker feed. Connect Zerodha, Upstox or Angel One to unlock the live board — free.
          </p>
        </div>
      </div>
      <Link
        href="/onboarding/broker-connect"
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:self-auto"
      >
        Connect broker <ArrowUpRight size={14} />
      </Link>
    </div>
  )
}

export default function MarketsPage() {
  // 60 calendar days ≈ 40 sessions — enough history for the gauge's
  // 21-session momentum tilt AND the sidebar NIFTY sparkline.
  const regime = useSWR('mkt-regime', () => api.publicTrust.regimeHistory(60).catch(() => null), SWR_OPTS)
  const sectors = useSWR('mkt-sectors', () => api.screener.sectorHeatmap().catch(() => null), SWR_OPTS)
  const news = useSWR('mkt-news', () => api.screener.newsScan({ universe: 'nifty100', limit: 12 }).catch(() => null), SWR_OPTS)
  // Top-headlines card: fast, cached RSS market-news feed (NOT the slow per-symbol
  // news scanner above). Resilient — keeps the last-good list across a blip.
  const headlines = useSWR('mkt-headlines', () => api.market.news(), { revalidateOnFocus: false, dedupingInterval: 60_000, keepPreviousData: true, errorRetryCount: 4, errorRetryInterval: 4_000 })
  const global = useSWR('mkt-global', () => api.market.getGlobal().catch(() => null), SWR_OPTS)
  // Same key as MarketPulseCard → shared cache entry, no extra request. Feeds
  // the gauge's dynamic tilt (breadth score component).
  const pulse = useSWR('mkt-pulse', () => api.screener.marketPulse().catch(() => null), { revalidateOnFocus: false, dedupingInterval: 120_000, keepPreviousData: true })

  // ── SEBI Path-A data entitlement ──────────────────────────────────────────
  // Raw NSE exchange data (live index/stock quotes, FII/DII rupee flows, F&O OI
  // buckets, delivery, bulk deals, order-flow) may be shown ONLY when it comes
  // from the user's OWN connected broker feed, or under a genuine NSE display
  // licence. We have no licence yet → default is fail-closed to an honest gate.
  const { isConnected } = useBrokerStatus()
  const LICENSED = process.env.NEXT_PUBLIC_LICENSED_MARKET_DATA === 'true'
  const dataEntitled = isConnected || LICENSED

  const [mktLabel, setMktLabel] = useState('')
  useEffect(() => {
    const f = () => {
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const m = ist.getHours() * 60 + ist.getMinutes(), wd = ist.getDay() >= 1 && ist.getDay() <= 5
      setMktLabel(wd && m >= 555 && m < 930 ? 'Live' : wd && m >= 540 && m < 555 ? 'Pre-open' : 'Closed')
    }
    f(); const id = setInterval(f, 60_000); return () => clearInterval(id)
  }, [])

  // ---- derive ----
  const cur = (regime.data as any)?.current
  const sectorList = (((sectors.data as any)?.sectors ?? []) as any[]).slice().sort((a, b) => b.avg_change_pct - a.avg_change_pct)
  const avgBreadth = sectorList.length ? Math.round(sectorList.reduce((a, s) => a + (s.breadth_pct || 0), 0) / sectorList.length) : null
  const regimeConf = cur ? Math.round(Math.max(cur.prob_bull, cur.prob_sideways, cur.prob_bear) * 100) : null
  const hits = ((news.data as any)?.hits ?? []) as any[]
  const newsItems = ((headlines.data as any)?.items ?? []) as any[]
  // normalized movers for the gainers/losers/active widget (from the news scan)
  const moverItems: Mover[] = hits
    .filter((h) => h.change_pct_today != null)
    .map((h) => ({ symbol: h.symbol, changePct: h.change_pct_today ?? null, sub: h.top_headline || h.setup_tag || undefined }))
  const niftyHist = ((regime.data as any)?.history ?? []).map((h: any) => h.nifty_close).filter((x: any): x is number => x != null)
  // Dynamic gauge: regime anchors the needle; breadth score (Market Pulse) +
  // 21-session NIFTY momentum tilt it daily within the regime's band.
  const pulseBreadthScore = ((pulse.data as any)?.breadth?.score ?? null) as number | null
  const momentumPct = niftyHist.length >= 22
    ? ((niftyHist[niftyHist.length - 1] / niftyHist[niftyHist.length - 22]) - 1) * 100
    : null
  const gaugeScore = regimeToScore(cur, { breadthScore: pulseBreadthScore, momentumPct })
  const globalItems = ((global.data as any)?.items ?? []) as any[]

  // Global cues are FOREIGN indices (not NSE) → safe; honest-empty when null.
  const globalLive = globalItems.filter((g) => g.last != null)
  // Per-stock change% is a raw NSE quote → gate the number by emptying the list.
  const moversShown = dataEntitled ? moverItems : []

  return (
    <AppShell>
      <div className="w-full space-y-4 p-4 md:p-6 xl:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <EyebrowMono>Regime-aware desk</EyebrowMono>
            <h1 className="heading-display mt-1 flex items-center gap-2 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-d-text-primary"><LineChart size={22} className="text-primary" /> Markets</h1>
            <p className="mt-1 text-[12.5px] text-d-text-muted">Your AI market desk — the full read before the bell and the wrap after the close.</p>
          </div>
          {mktLabel && <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-wrap px-3 py-1.5 text-[11.5px]"><span className={`h-2 w-2 rounded-full ${mktLabel === 'Live' ? 'bg-up' : mktLabel === 'Pre-open' ? 'bg-warning' : 'bg-d-text-muted'}`} /><span className="font-semibold text-d-text-secondary">Market {mktLabel}</span></span>}
        </Reveal>

        {/* ── AI Daily Briefing (the hero) — built from SAFE data (global cues +
             EOD/derived India context + FII/DII EOD + events), so it shows to
             EVERYONE, logged-out included. No live intraday NSE quotes here. ── */}
        <DailyBriefingCard />

        {/* ── index ticker strip (NSE indices, gated) OR the broker-connect gate ── */}
        {dataEntitled ? (
          <Reveal delay={0.02}><IndexStrip global={globalLive} entitled={dataEntitled} /></Reveal>
        ) : (
          <Reveal delay={0.02}>
            <MarketDataGate />
            {/* Foreign global cues are SEBI-safe — keep them visible even when
                the NSE strip is gated, instead of losing the whole row. */}
            {globalLive.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {globalLive.map((g: any) => (
                  <span key={g.key || g.label} className="tile-tint inline-flex shrink-0 items-baseline gap-2 rounded-xl px-3 py-1.5 text-[11.5px]">
                    <span className="text-d-text-muted">{g.label}</span>
                    <span className={`${MONO} text-d-text-primary`}>{num(g.last)}</span>
                    <span className={`${MONO} ${(g.change_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{pct(g.change_pct)}</span>
                  </span>
                ))}
              </div>
            )}
          </Reveal>
        )}

        {/* ── Market Pulse — EOD-derived internals: what-changed diff chips,
             Breadth Score, %-above-DMA, 52w highs/lows, HV-vs-VIX, FII/DII
             streaks. Safe for everyone (derived + labelled). ── */}
        <Reveal delay={0.025}><MarketPulseCard /></Reveal>

        {/* ── BENTO ROW: AI Radar (8) | Market Breadth (4) ──
             every card stretches (h-full) so the row's bottoms align exactly. */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
          <Reveal delay={0.028} className="h-full lg:col-span-8"><AiRadarStrip /></Reveal>
          <Reveal delay={0.03} className="h-full lg:col-span-4"><BreadthCard /></Reveal>
        </div>

        {/* ── BENTO ROW: Regime gauge (4) | Sector heatmap (8) ──
             The Daily Briefing above owns the global / India / FII-DII summary,
             so the page below is the VISUAL + interactive layer — no duplicated
             stat tiles or global strip. ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
          <Reveal delay={0.03} className="h-full lg:col-span-4">
            <Card className="flex h-full min-h-[240px] flex-col rounded-[20px] border-0 p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-d-text-primary"><LineChart size={14} className="text-primary" /> Regime gauge</div>
              <div className="flex flex-1 flex-col items-center justify-center py-4">
                <RegimeGauge score={gaugeScore} caption={cur ? `Regime ${cap(cur.regime)} · ${regimeConf}% confidence` : undefined} size="lg" />
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.05} className="h-full lg:col-span-8">
            <Card className="flex h-full min-h-[240px] flex-col rounded-[20px] border-0 p-4">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><Grid3x3 size={14} className="text-primary" /> Sector heatmap<span className="text-[10.5px] font-normal text-d-text-muted">every NSE sector, ranked by avg change</span></div>
              {sectorList.length ? (
                <SectorHeatmap sectors={sectorList as any} max={12} />
              ) : sectors.data === undefined ? (
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-full min-h-[64px]" rounded="lg" />)}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center text-[12px] text-d-text-muted">Sector data unavailable right now.</div>
              )}
            </Card>
          </Reveal>
        </div>

        {/* ── AI Market Explainer (deterministic drivers + on-click narrative) ── */}
        <Reveal delay={0.06}><MarketExplainerCard entitled={dataEntitled} /></Reveal>

        {/* ── market movers (gainers / losers / active) — raw NSE %, gated ── */}
        {moversShown.length > 0 && (
          <>
            <Reveal delay={0.065}>
              <div id="market-movers" className="flex scroll-mt-24 items-center gap-2 text-d-text-primary"><TrendingUp size={16} className="text-primary" /><h2 className="text-sm font-semibold">Market movers</h2></div>
            </Reveal>
            <Reveal delay={0.07}><MoversColumns movers={moversShown} /></Reveal>
          </>
        )}

        {/* ── Mood agent + live smart money / indices (gated) ──
             The market-mood AI reads the news tape; the live-flow cards beside it
             stay Path-A gated. When gated away, the row collapses to one column so
             the agent fills the width instead of leaving a tall gap. */}
        {/* (Mood agent + duplicate Smart-money / Indices cards removed
            2026-07-21: the Copilot dock covers ad-hoc questions, IndexStrip
            already shows live indices, and OrderFlowAnalysis below is the
            canonical FII/DII surface — the audit's consolidation call.) */}

        {/* ── market internals + the day ahead ──
             Balanced two-column band: LEFT = Sector Rotation + Market Breadth,
             RIGHT = Headlines + Big Deals — the stacks land at similar heights
             so neither column trails into dead space. */}
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
          <Reveal delay={0.12} className="h-full lg:col-span-4"><SectorRotationCard /></Reveal>

          <Reveal delay={0.14} className="h-full lg:col-span-4">
            <Card id="top-headlines" className="flex h-full scroll-mt-24 flex-col rounded-[20px] border-0 p-4">
              <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-d-text-primary">
                <span className="flex items-center gap-2"><Newspaper size={14} className="text-highlight" /> Top headlines</span>
                <span className="text-[10px] font-normal text-d-text-muted">live · RSS · impact-ranked</span>
              </div>
              {headlines.data === undefined ? (
                <div className="mt-3 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : newsItems.length ? (
                <div className="mt-3 space-y-3">
                  {headlineOrder(newsItems).slice(0, 6).map((h, i) => (
                    <a key={h.link || i} href={h.link} target="_blank" rel="noopener noreferrer" className="group flex gap-2.5">
                      {h.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.image} alt="" loading="lazy" className="dark-media mt-0.5 h-10 w-14 shrink-0 rounded-md border object-cover" />
                      ) : (
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${h.is_big ? 'bg-highlight' : 'bg-d-text-muted/60'}`} />
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[11.5px] font-medium leading-snug text-d-text-secondary transition-colors group-hover:text-d-text-primary">
                          {h.is_big && <span className="mr-1.5 rounded bg-highlight/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-highlight">Big</span>}
                          {h.title}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-d-text-muted">
                          {h.source}{h.region ? ` · ${String(h.region).toUpperCase()}` : ''}{timeAgo(h.published) ? ` · ${timeAgo(h.published)}` : ''}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : <p className="mt-3 text-[11.5px] text-d-text-muted">No fresh headlines right now.</p>}
            </Card>
          </Reveal>

          {/* Big deals — NSE EOD-published bulk/block disclosures + upcoming
              corporate actions. Public lane, labelled. */}
          <Reveal delay={0.16} className="h-full lg:col-span-4"><BigDealsCard /></Reveal>
        </div>

        {/* ── institutional order-flow (FII/DII flow · big deals · shorts) — raw NSE, gated ── */}
        {dataEntitled && (
          <Reveal delay={0.19}>
            <OrderFlowAnalysis entitled={dataEntitled} />
          </Reveal>
        )}

        <DisclaimerFooter />
      </div>
    </AppShell>
  )
}
