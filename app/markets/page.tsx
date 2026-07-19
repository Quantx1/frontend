'use client'

/* ============================================================================
   QUANT X — Markets (PR-V4 · pre-market research hub)
   The trader's morning research desk: global cues (US/Asia/commodities/DXY/BTC,
   real via /api/market/global) · market state · smart money (FII/DII) · the Mood
   agent (news + sentiment AI, auth-gated) · sector rotation · headlines ·
   earnings calendar. All public DATA tiles (cheap, no LLM); the Mood agent is
   the only LLM, user-triggered. Each is a research view; the deep feature pages
   live elsewhere. Glass design, both themes, real engine names, SEBI footer.
   ============================================================================ */

import useSWR from 'swr'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  LineChart, Newspaper, BellPlus, TrendingUp, Download, Grid3x3, Sparkles,
  ArrowUpRight, Globe, Calendar, Activity,
} from '@/lib/icons'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { AppShell } from '@/components/shell/AppShell'
import { Reveal, Card, Spark, Skeleton, Badge, DisclaimerFooter, EyebrowMono } from '@/components/foundation'
import { MONO, AI } from '@/lib/tokens'
import { EmbeddedAgent } from '@/components/copilot/EmbeddedAgent'
import StockMoodLookup from '@/components/markets/StockMoodLookup'
import OrderFlowAnalysis from '@/components/markets/OrderFlowAnalysis'
import SectorRotationCard from '@/components/markets/SectorRotationCard'
import BreadthCard from '@/components/markets/BreadthCard'
import MarketExplainerCard from '@/components/markets/MarketExplainerCard'
import { IndexStrip } from '@/components/markets/IndexStrip'
import { RegimeGauge, regimeToScore } from '@/components/markets/RegimeGauge'
import { MoversColumns, type Mover } from '@/components/markets/MoversColumns'
import { SectorHeatmap } from '@/components/markets/SectorHeatmap'
import { ChipRow, ArtifactCard, Gauge, ActionRow } from '@/components/copilot/artifacts'
import type { ChipItem } from '@/components/copilot/types'

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '--')
const pct = (n?: number | null, d = 2) => (n == null || Number.isNaN(n) ? '--' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`)
const num = (n?: number | null) => (n == null || Number.isNaN(n) ? '--' : n.toLocaleString('en-IN', { maximumFractionDigits: 2 }))
const crore = (n?: number) => (n == null ? '--' : `${n >= 0 ? '+' : '−'}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`)
const QUERY = "What's driving the market today, and what's the mood into tomorrow?"
const SWR_OPTS = { revalidateOnFocus: false, dedupingInterval: 30_000 }

export default function MarketsPage() {
  const regime = useSWR('mkt-regime', () => api.publicTrust.regimeHistory(30).catch(() => null), SWR_OPTS)
  const sectors = useSWR('mkt-sectors', () => api.screener.sectorHeatmap().catch(() => null), SWR_OPTS)
  const news = useSWR('mkt-news', () => api.screener.newsScan({ universe: 'nifty100', limit: 12 }).catch(() => null), SWR_OPTS)
  const indices = useSWR('mkt-indices', () => api.publicTrust.indices().catch(() => null), SWR_OPTS)
  const global = useSWR('mkt-global', () => api.market.getGlobal().catch(() => null), SWR_OPTS)
  const fno = useSWR('mkt-fno', () => api.screener.fnoStockScanners().catch(() => null), SWR_OPTS)
  const earn = useSWR('mkt-earn', () => api.earnings.upcoming(7).catch(() => null), SWR_OPTS)

  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session)).catch(() => setAuthed(false)) }, [])

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
  const idx: any[] = (indices.data as any)?.indices ?? []
  const nifty = idx.find((i) => i.key === 'nifty')
  const sectorList = (((sectors.data as any)?.sectors ?? []) as any[]).slice().sort((a, b) => b.avg_change_pct - a.avg_change_pct)
  const avgBreadth = sectorList.length ? Math.round(sectorList.reduce((a, s) => a + (s.breadth_pct || 0), 0) / sectorList.length) : null
  const regimeConf = cur ? Math.round(Math.max(cur.prob_bull, cur.prob_sideways, cur.prob_bear) * 100) : null
  const hits = ((news.data as any)?.hits ?? []) as any[]
  const avgSent = hits.length ? hits.reduce((a, h) => a + (h.news_sentiment || 0), 0) / hits.length : null
  const moodScore = avgSent == null ? null : Math.round(Math.max(0, Math.min(1, (avgSent + 1) / 2)) * 100)
  const movers = hits.slice().sort((a, b) => Math.abs(b.change_pct_today || 0) - Math.abs(a.change_pct_today || 0)).slice(0, 5)
  const gaugeScore = regimeToScore(cur)
  // normalized movers for the gainers/losers/active widget (from the news scan)
  const moverItems: Mover[] = hits
    .filter((h) => h.change_pct_today != null)
    .map((h) => ({ symbol: h.symbol, changePct: h.change_pct_today ?? null, sub: h.top_headline || h.setup_tag || undefined }))
  const niftyHist = ((regime.data as any)?.history ?? []).map((h: any) => h.nifty_close).filter((x: any): x is number => x != null)
  const globalItems = ((global.data as any)?.items ?? []) as any[]
  const fiiDii = (fno.data as any)?.fii_dii
  const buckets = (fno.data as any)?.buckets
  const earnings = ([...(((earn.data as any) ?? []) as any[])]).sort((a, b) => String(a.announce_date || '').localeCompare(String(b.announce_date || ''))).slice(0, 6)

  const drivers = [
    cur && { k: 'Regime', v: cap(cur.regime) },
    avgBreadth != null && { k: 'Breadth', v: `${avgBreadth}%` },
    cur?.vix != null && { k: 'India VIX', v: cur.vix.toFixed(1) },
    sectorList[0] && { k: sectorList[0].sector, v: pct(sectorList[0].avg_change_pct, 1) },
  ].filter(Boolean) as ChipItem[]
  const moodTone = moodScore == null ? 'var(--color-primary)' : moodScore >= 60 ? 'var(--color-up)' : moodScore < 40 ? 'var(--color-down)' : 'var(--color-warning)'

  const KPIS = [
    { label: 'NIFTY 50', v: num(nifty?.last), sub: nifty ? pct(nifty.change_pct) : '--', up: (nifty?.change_pct ?? 0) >= 0 },
    { label: 'Regime', v: cur ? cap(cur.regime) : '--', sub: regimeConf != null ? `${regimeConf}% confidence` : '--', up: null as boolean | null },
    { label: 'India VIX', v: cur?.vix != null ? cur.vix.toFixed(2) : '--', sub: 'volatility', up: null as boolean | null },
    { label: 'Breadth', v: avgBreadth != null ? `${avgBreadth}%` : '--', sub: 'sector breadth', up: avgBreadth != null ? avgBreadth >= 50 : null },
  ]

  // Chat unification (2026-07-11): the Mood narration is composed
  // deterministically from data this page ALREADY fetched — the old version
  // fired a real copilotChat call on every page load, silently burning a chat
  // credit per visit. Interrogating the tape is the dock's job (⌘/).
  const run = async () => {
    const parts: [string, number][] = []
    if (cur) parts.push(['Regime reads ', 0], [cap(cur.regime), 1], [regimeConf != null ? ` at ${regimeConf}% confidence. ` : '. ', 0])
    if (nifty?.last != null) parts.push(['NIFTY ', 0], [`${num(nifty.last)} (${pct(nifty.change_pct)})`, 1], ['. ', 0])
    if (cur?.vix != null) parts.push([`India VIX ${cur.vix.toFixed(1)}. `, 0])
    if (avgBreadth != null) parts.push(['Sector breadth ', 0], [`${avgBreadth}%`, 1], ['. ', 0])
    if (sectorList[0]) parts.push([`${sectorList[0].sector} leads at ${pct(sectorList[0].avg_change_pct, 1)}. `, 0])
    if (moverItems[0]?.sub) parts.push(['On the tape: ', 0], [`${moverItems[0].symbol}`, 1], [` — ${moverItems[0].sub}. `, 0])
    parts.push(['Ask the Copilot for the read on any name, sector or flow.', 0])
    return { narration: parts, trace: <>Regime · breadth · sectors · movers — live board data, zero tokens</> }
  }
  const dot = (s: number) => (s >= 0.05 ? 'bg-up' : s <= -0.05 ? 'bg-down' : 'bg-d-text-muted')

  return (
    <AppShell>
      <div className="w-full space-y-4 p-4 md:p-6 xl:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <EyebrowMono>Regime-aware desk</EyebrowMono>
            <h1 className="heading-display mt-1 flex items-center gap-2 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-d-text-primary"><LineChart size={22} className="text-primary" /> Markets</h1>
            <p className="mt-1 text-[12.5px] text-d-text-muted">Regime-detected, real-time NSE. Global cues, smart money, the news tape and the day ahead, before the bell.</p>
          </div>
          {mktLabel && <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-wrap px-2.5 py-1.5 text-[11.5px]"><span className={`h-2 w-2 rounded-full ${mktLabel === 'Live' ? 'bg-up' : mktLabel === 'Pre-open' ? 'bg-warning' : 'bg-d-text-muted'}`} /><span className="font-semibold text-d-text-secondary">Market {mktLabel}</span></span>}
        </Reveal>

        {/* ── index ticker strip (top-of-page row): NSE indices + global cues ── */}
        <Reveal delay={0.02}><IndexStrip global={globalItems} /></Reveal>

        {/* ── HERO bento row: market gauge (Fear&Greed-style) + KPIs + global cues ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
          <Reveal delay={0.03}>
            <Card variant="glass" className="flex h-full flex-col p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-d-text-primary"><LineChart size={14} className="text-primary" /> Regime gauge</div>
              <div className="flex flex-1 flex-col items-center justify-center py-3">
                <RegimeGauge score={gaugeScore} caption={cur ? `Regime ${cap(cur.regime)} · ${regimeConf}% confidence` : undefined} size="lg" />
              </div>
            </Card>
          </Reveal>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {KPIS.map((k, i) => (
                <Reveal key={k.label} delay={0.04 + 0.03 * i}><Card variant="glass" className="p-4">
                  <div className="text-[11px] text-d-text-secondary">{k.label}</div>
                  <div className={`mt-1 text-[22px] font-semibold leading-none text-d-text-primary ${MONO}`}>{k.v}</div>
                  <div className={`mt-1.5 text-[11px] ${MONO} ${k.up === true ? 'text-up' : k.up === false ? 'text-down' : 'text-d-text-muted'}`}>{k.sub}</div>
                </Card></Reveal>
              ))}
            </div>
            <Reveal delay={0.05}>
              <Card variant="glass" className="p-4">
                <div className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><Globe size={14} className="text-primary" /> Global cues<span className="text-[10.5px] font-normal text-d-text-muted">overnight + Asia, live. This sets the India open.</span></div>
                {globalItems.length === 0 ? (
                  <div className="flex gap-2 overflow-x-auto">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-[120px] shrink-0" />)}</div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {globalItems.map((g) => (
                      <div key={g.key} className="flex min-w-[116px] shrink-0 flex-col rounded-lg border border-line bg-main px-3 py-2">
                        <span className="truncate text-[10px] uppercase tracking-wide text-d-text-muted">{g.label}</span>
                        <span className={`text-[13px] font-semibold text-d-text-primary ${MONO}`}>{num(g.last)}</span>
                        <span className={`text-[11px] ${MONO} ${(g.change_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{pct(g.change_pct)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Reveal>
          </div>
        </div>

        {/* ── sector heatmap (treemap-style) — market-monitor archetype ── */}
        <Reveal delay={0.055}>
          <Card variant="glass" className="p-4">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><Grid3x3 size={14} className="text-primary" /> Sector heatmap<span className="text-[10.5px] font-normal text-d-text-muted">every NSE sector, ranked by avg change</span></div>
            {sectorList.length ? <SectorHeatmap sectors={sectorList as any} max={12} /> : <Skeleton className="h-40 w-full" />}
          </Card>
        </Reveal>

        {/* ── AI Market Explainer (deterministic drivers + on-click narrative) ── */}
        <Reveal delay={0.06}><MarketExplainerCard /></Reveal>

        {/* ── market movers (gainers / losers / active) ── */}
        <Reveal delay={0.065}>
          <div className="flex items-center gap-2 text-d-text-primary"><TrendingUp size={16} className="text-primary" /><h2 className="text-sm font-semibold">Market movers</h2></div>
        </Reveal>
        <Reveal delay={0.07}><MoversColumns movers={moverItems} /></Reveal>

        {/* ── Mood agent + smart money + indices ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Reveal delay={0.06}>
            {/* Mount once the regime fetch SETTLES (data or null-on-error) so
                run() narrates real numbers; every line degrades gracefully. */}
            {authed === null || (authed && regime.data === undefined) ? (
              <Card variant="glass" className="p-6"><Skeleton className="h-40 w-full" /></Card>
            ) : authed ? (
              <EmbeddedAgent
                name="Mood" scope="Sentiment agent reads the news tape across NSE" query={QUERY} run={run}
                askPrompt="What's driving the market today — sectors, flows and the tape?"
                renderArtifacts={(step) => (
                  <>
                    {step >= 3 && (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="shrink-0 rounded-xl border border-line bg-main p-3">{moodScore != null ? <Gauge value={moodScore} label="Market mood" tone={moodTone} /> : <Skeleton className="h-[54px] w-[120px]" />}</div>
                        {drivers.length > 0 && <div className="min-w-0 flex-1"><ChipRow label="Drivers" addable={false} items={drivers} /></div>}
                      </div>
                    )}
                    {step >= 4 && movers.length > 0 && (
                      <ArtifactCard title="Top movers & why" meta="intraday">
                        <div className="grid grid-cols-[1fr_0.6fr_1.5fr] gap-1.5 px-3 py-1.5 text-[9px] font-medium uppercase tracking-wide text-d-text-muted"><span>Symbol</span><span>Chg</span><span>Driver</span></div>
                        <div className="divide-y divide-line">
                          {movers.map((m) => (
                            <div key={m.symbol} className="grid grid-cols-[1fr_0.6fr_1.5fr] items-center gap-1.5 px-3 py-[7px] hover:bg-hover">
                              <span className="truncate text-[11.5px] font-semibold text-d-text-primary">{m.symbol}</span>
                              <span className={`text-[10.5px] ${MONO} ${(m.change_pct_today || 0) >= 0 ? 'text-up' : 'text-down'}`}>{pct(m.change_pct_today, 1)}</span>
                              <span className="flex items-center gap-1.5 truncate text-[11px] text-d-text-secondary"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot(m.news_sentiment || 0)}`} /><span className="truncate">{m.top_headline || m.setup_tag}</span></span>
                            </div>
                          ))}
                        </div>
                      </ArtifactCard>
                    )}
                    {step >= 5 && <ActionRow items={[[Newspaper, 'Full news feed'], [BellPlus, 'Sentiment alerts'], [TrendingUp, 'Sentiment movers'], [Download, 'Export wrap']]} />}
                  </>
                )}
              />
            ) : (
              <div className="lg-surface lg-ring rounded-xl p-8 text-center">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl text-ai" style={{ background: `${AI}22` }}><Sparkles size={20} /></div>
                <h3 className="mt-3 text-[15px] font-semibold text-d-text-primary">What&rsquo;s moving today? Ask the Mood agent.</h3>
                <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-d-text-muted">The Mood agent reads the news tape across NSE, sentiment-scores it, and tells you what&rsquo;s moving and why. Sign in to ask.</p>
                <Link href="/login?redirect=/markets" className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white" style={{ background: AI }}>Sign in to ask Mood <ArrowUpRight size={14} /></Link>
              </div>
            )}
          </Reveal>

          <div className="space-y-4">
            {/* smart money */}
            <Reveal delay={0.09}><Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><Activity size={14} className="text-highlight" /> Smart money</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                <div><div className="text-d-text-muted">FII (net)</div><div className={`text-[15px] font-semibold ${MONO} ${(fiiDii?.fii_net ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{fiiDii ? crore(fiiDii.fii_net) : '--'}</div></div>
                <div><div className="text-d-text-muted">DII (net)</div><div className={`text-[15px] font-semibold ${MONO} ${(fiiDii?.dii_net ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{fiiDii ? crore(fiiDii.dii_net) : '--'}</div></div>
              </div>
              {buckets && (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11px]">
                  <div className="flex justify-between"><span className="text-d-text-muted">Long build-up</span><span className={`${MONO} text-up`}>{buckets.long_buildup?.length ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-d-text-muted">Short build-up</span><span className={`${MONO} text-down`}>{buckets.short_buildup?.length ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-d-text-muted">Short cover</span><span className={`${MONO} text-up`}>{buckets.short_covering?.length ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-d-text-muted">Long unwind</span><span className={`${MONO} text-down`}>{buckets.long_unwinding?.length ?? 0}</span></div>
                </div>
              )}
            </Card></Reveal>

            {/* indices */}
            <Reveal delay={0.12}><Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><LineChart size={14} className="text-primary" /> Indices</div>
              {niftyHist.length > 1 && <div className="mt-2"><Spark data={niftyHist} w={244} h={36} /></div>}
              <div className="mt-3 space-y-2">
                {idx.length ? idx.map((r) => (
                  <div key={r.key} className="flex items-center justify-between text-[11.5px]"><span className="text-d-text-secondary">{r.label}</span><span className="flex items-center gap-2"><span className={`text-d-text-primary ${MONO}`}>{num(r.last)}</span><span className={`${MONO} ${(r.change_pct ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>{pct(r.change_pct)}</span></span></div>
                )) : <Skeleton className="h-20 w-full" />}
              </div>
            </Card></Reveal>

            {/* per-stock Mood lookup — standalone news sentiment for any stock */}
            <Reveal delay={0.15}>
              <div>
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><Newspaper size={14} className="text-highlight" /> Stock Mood<span className="ml-auto text-[10px] font-normal text-d-text-muted">sentiment-scored, any NSE stock</span></div>
                <StockMoodLookup />
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── breadth + multi-period sector rotation ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal delay={0.11}><BreadthCard /></Reveal>
          <Reveal delay={0.12}><SectorRotationCard /></Reveal>
        </div>

        {/* ── headlines + earnings ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal delay={0.15}><Card variant="glass" className="h-full p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><Newspaper size={14} className="text-highlight" /> Top headlines</div>
            {hits.length ? (
              <div className="mt-3 space-y-2.5">
                {hits.filter((h) => h.top_headline).slice(0, 5).map((h) => (
                  <div key={h.symbol} className="flex gap-2.5"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot(h.news_sentiment || 0)}`} /><div className="min-w-0"><p className="truncate text-[11.5px] leading-snug text-d-text-secondary">{h.top_headline}</p><p className="truncate text-[10px] text-d-text-muted">{h.symbol}</p></div></div>
                ))}
              </div>
            ) : <Skeleton className="mt-3 h-24 w-full" />}
          </Card></Reveal>

          <Reveal delay={0.17}><Card variant="glass" className="h-full p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary"><Calendar size={14} className="text-primary" /> Earnings & events</div>
            {earnings.length ? (
              <div className="mt-3 space-y-1.5">
                {earnings.map((e) => { const t = e.direction === 'bullish' ? 'buy' : e.direction === 'bearish' ? 'sell' : 'hold'; const l = e.direction === 'bullish' ? 'Bull' : e.direction === 'bearish' ? 'Bear' : 'Neutral'; let dt = '--'; try { dt = e.announce_date ? new Date(e.announce_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '--' } catch {}; return (
                  <Link key={e.symbol} href={`/stock/${e.symbol}`} className="flex items-center justify-between rounded-md border border-line bg-main px-3 py-2 transition-colors hover:bg-wrap-hover">
                    <div className="min-w-0"><p className="truncate text-[12px] font-medium text-d-text-primary">{e.symbol}</p><p className="text-[10px] text-d-text-muted">{dt}</p></div>
                    {e.direction && <Badge tone={t as any}>{l}</Badge>}
                  </Link>) })}
              </div>
            ) : <div className="mt-3 py-6 text-center text-[12px] text-d-text-muted">Quiet week. No earnings in the next 7 days.</div>}
          </Card></Reveal>
        </div>

        {/* ── institutional order-flow (FII/DII flow · big deals · shorts) ── */}
        <Reveal delay={0.19}>
          <OrderFlowAnalysis />
        </Reveal>

        <DisclaimerFooter />
      </div>
    </AppShell>
  )
}
