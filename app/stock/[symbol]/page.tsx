'use client'

/**
 * /stock/[symbol] — entity-terminal (the reference archetype F, re-skinned to v2).
 *
 * Bloomberg-style single-stock terminal. Replaces the old hardcoded-dark,
 * 18-panel "firehose" drawer with the the reference entity-terminal structure:
 *
 *   1. Breadcrumb + header band — symbol · name · exchange/sector, live price +
 *      duotone change %, inline quick-stats, Add-to-Watchlist + Ask-AI actions.
 *   2. Primary chart — full-width LightweightChart, THEME-AWARE (tri-theme via
 *      the resolved next-themes value, not a hardcoded "dark").
 *   3. AI tabs — the signature the reference move: "Technical Analysis ·
 *      Why It Moves · Forecast". The ~18 AI panels are regrouped under these
 *      three tabs instead of one ungrouped drawer.
 *   4. Data modules grid — fundamentals / news+mood / microstructure as a clean
 *      2-col module grid of hairline `bg-wrap` cards with mono-caps titles.
 *   5. SEBI disclaimer footer.
 *
 * Theme-aware, brand-firewalled (no model names), honest (no fabricated metrics).
 */

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import useSWR from 'swr'
import { useTheme } from 'next-themes'
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from '@/lib/icons'

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ChangeBadge,
  DisclaimerFooter,
  EyebrowMono,
  Reveal,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@/components/foundation'
import { useAuth } from '@/contexts/AuthContext'
import { usePriceUpdates } from '@/hooks/useWebSocket'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import { api } from '@/lib/api'
import { TradeTicketButton } from '@/components/trade/TradeTicketButton'
import { DataBadge } from '@/components/common/DataBadge'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'

// Lightweight Charts (PR-S16) — TradingView free embed paywall'd NSE data,
// so we switched to TV's self-hostable Lightweight Charts library fed by our
// own /api/screener/prices/{sym}/history endpoint.
const TradingViewWidget = dynamic(
  () => import('@/components/charts/LightweightChart').then((m) => m.LightweightChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] w-full items-center justify-center rounded-[20px] border border-line bg-wrap text-d-text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="font-mono text-[11px] uppercase tracking-wider">Loading chart…</p>
        </div>
      </div>
    ),
  },
)

// AI / data panels — code-split; they hydrate when their tab/module mounts.
const AIDossierPanel = dynamic(() => import('@/components/stock/AIDossierPanel'), { ssr: false })
const AITradeDeskCard = dynamic(() => import('@/components/stock/AITradeDeskCard'), { ssr: false })
const ChartVisionCard = dynamic(() => import('@/components/stock/ChartVisionCard'), { ssr: false })
const NewsIntelligenceCard = dynamic(() => import('@/components/stock/NewsIntelligenceCard'), { ssr: false })
const FundamentalsCard = dynamic(() => import('@/components/stock/FundamentalsCard'), { ssr: false })
const VolumeProfilePanel = dynamic(
  () => import('@/components/charts/VolumeProfilePanel').then((m) => m.VolumeProfilePanel),
  { ssr: false },
)
const OrderBookCard = dynamic(() => import('@/components/stock/OrderBookCard'), { ssr: false })
const WhyMovingCard = dynamic(() => import('@/components/stock/WhyMovingCard'), { ssr: false })
const EarningsPreviewCard = dynamic(() => import('@/components/stock/EarningsPreviewCard'), { ssr: false })
const FusionVerdictCard = dynamic(() => import('@/components/stock/FusionVerdictCard'), { ssr: false })
const RelativeStrengthCard = dynamic(() => import('@/components/stock/RelativeStrengthCard'), { ssr: false })
const VolumeIntelCard = dynamic(() => import('@/components/stock/VolumeIntelCard'), { ssr: false })
const TechnicalsPanelCard = dynamic(() => import('@/components/stock/TechnicalsPanelCard'), { ssr: false })
const SentimentCard = dynamic(() => import('@/components/stock/SentimentCard'), { ssr: false })
const TabAiRead = dynamic(() => import('@/components/stock/TabAiRead'), { ssr: false })
const ProbabilityCard = dynamic(() => import('@/components/stock/ProbabilityCard'), { ssr: false })

interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  change_percent: number
  open: number
  high: number
  low: number
  volume: number
  prev_close?: number
  week_52_high?: number
  week_52_low?: number
  market_cap?: number
  pe_ratio?: number
  sector?: string
  industry?: string
}

interface TechnicalData {
  rsi: number
  macd: number
  macd_signal: number
  sma_20: number
  sma_50: number
  sma_200?: number
  trend: string
  volume_ratio: number
}

const fmtInr = (n?: number | null, decimals = 0) =>
  n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: decimals })}`

const fmtCompact = (n?: number | null) => {
  if (n == null) return '—'
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)} L`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`
  return n.toLocaleString('en-IN')
}

export default function StockTerminalPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const symbol = (params.symbol as string)?.toUpperCase()

  const [stockData, setStockData] = useState<StockData | null>(null)
  const [technicals, setTechnicals] = useState<TechnicalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [mounted, setMounted] = useState(false)

  // next-themes resolves on the client only; until mounted, render the chart
  // in dark (matches the SSR boot class) and re-key it to the real theme once
  // mounted. The page chrome itself is token-driven so it re-themes for free.
  useEffect(() => setMounted(true), [])
  const chartTheme: 'light' | 'dark' = mounted && resolvedTheme === 'light' ? 'light' : 'dark'

  const { prices: wsPrices, isConnected: wsConnected } = usePriceUpdates(symbol ? [symbol] : [])
  const { isConnected: brokerConnected } = useBrokerStatus()

  // One fundamentals fetch for the whole page — the header stats (Mkt Cap,
  // P/E) and FundamentalsCard share it via the SWR key, so the number the
  // header shows is ALWAYS the same one the card shows.
  const { data: fndData } = useSWR(
    symbol ? `fundamentals:${symbol}` : null,
    () => api.screener.fundamentals(symbol).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )
  const fnd = fndData?.fundamentals ?? null

  // AI Picks link-up — when this symbol sits in today's Alpha Picks or
  // Momentum Picks book, the header shows a live pick badge that deep-links
  // to the signal. Shares the 'signals:today' SWR key with the signals hub.
  const { data: todayBook } = useSWR(
    symbol ? 'signals:today' : null,
    () => api.signals.getToday().catch(() => null),
    { revalidateOnFocus: false, refreshInterval: 60_000, dedupingInterval: 30_000 },
  )
  const activePick = useMemo(() => {
    const row = (todayBook?.all_signals ?? []).find(
      (r: any) => r?.symbol === symbol && ['active', 'triggered'].includes(r?.status),
    ) as any
    if (!row) return null
    const book = (row.signal_type || '').includes('momentum') ? 'Momentum Picks' : 'Alpha Picks'
    const rank = String((row.reasons ?? [])[0] ?? '').match(/#(\d+)/)?.[1]
    return { id: row.id as string, book, rank, direction: row.direction as string }
  }, [todayBook, symbol])

  // Initial fetch + polling fallback (WebSocket is primary).
  useEffect(() => {
    if (!symbol) return
    fetchStockData()
    checkWatchlist()
    const id = window.setInterval(() => {
      if (!document.hidden) fetchStockData()
    }, 30_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  // Apply live WebSocket ticks.
  useEffect(() => {
    const update = wsPrices?.[symbol]
    if (!update) return
    setStockData((prev) =>
      prev
        ? {
            ...prev,
            price: update.ltp ?? prev.price,
            change: update.change ?? prev.change,
            change_percent: update.change_percentage ?? prev.change_percent,
          }
        : prev,
    )
  }, [wsPrices, symbol])

  const fetchStockData = async () => {
    try {
      const [priceData, techData] = await Promise.all([
        api.screener.getStockPrice(symbol),
        api.screener.getTechnicals(symbol),
      ])
      if ((priceData as any).success) {
        setStockData({
          symbol,
          name: (priceData as any).name || symbol,
          price: (priceData as any).price,
          change: (priceData as any).change,
          change_percent: (priceData as any).change_percent,
          open: (priceData as any).open,
          high: (priceData as any).high,
          low: (priceData as any).low,
          volume: (priceData as any).volume,
          prev_close: (priceData as any).prev_close,
          week_52_high: (priceData as any).week_52_high,
          week_52_low: (priceData as any).week_52_low,
          market_cap: (priceData as any).market_cap,
          pe_ratio: (priceData as any).pe_ratio,
          sector: (priceData as any).sector,
          industry: (priceData as any).industry,
        })
      }
      if ((techData as any).success) {
        setTechnicals({
          rsi: (techData as any).rsi,
          macd: (techData as any).macd,
          macd_signal: (techData as any).macd_signal,
          sma_20: (techData as any).sma_20,
          sma_50: (techData as any).sma_50,
          sma_200: (techData as any).sma_200,
          trend: (techData as any).trend,
          volume_ratio: (techData as any).volume_ratio,
        })
      }
    } catch (e: any) {
      toast.error(`Couldn't refresh ${symbol}`, { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  const checkWatchlist = async () => {
    if (!user?.id) return
    try {
      const data = await api.watchlist.getAll()
      if (data.watchlist) {
        setIsInWatchlist(data.watchlist.some((i: any) => i.symbol === symbol))
      }
    } catch {
      /* non-fatal */
    }
  }

  const toggleWatchlist = async () => {
    const prev = isInWatchlist
    setIsInWatchlist(!prev)
    try {
      if (prev) {
        await api.watchlist.remove(symbol)
        toast.success(`${symbol} removed from watchlist`)
      } else {
        await api.watchlist.add(symbol, 'EQUITY')
        toast.success(`${symbol} added to watchlist`)
      }
    } catch (e: any) {
      setIsInWatchlist(prev)
      toast.error('Could not update watchlist', { description: e?.message })
    }
  }

  if (loading && !stockData) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        <Skeleton w="40%" h="36px" />
        <Skeleton w="60%" h="24px" />
        <Skeleton w="100%" h="520px" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton w="100%" h="200px" />
          <Skeleton w="100%" h="200px" />
        </div>
      </div>
    )
  }

  const trendTone: 'up' | 'down' | 'neutral' =
    technicals?.trend?.includes('Up') ? 'up'
    : technicals?.trend?.includes('Down') ? 'down'
    : 'neutral'
  const rsiTone: 'up' | 'down' | 'neutral' =
    technicals?.rsi == null ? 'neutral'
    : technicals.rsi > 70 ? 'down'
    : technicals.rsi < 30 ? 'up'
    : 'neutral'

  const up = (stockData?.change ?? 0) >= 0

  return (
    <div className="min-h-screen bg-main" data-testid="stock-detail-page">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        {/* ────────────────────────────────────────────────────────────
            BREADCRUMB
           ──────────────────────────────────────────────────────────── */}
        <Reveal>
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-d-text-muted"
          >
            <button onClick={() => router.push('/markets')} className="hover:text-d-text-secondary">
              Markets
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-d-text-secondary">{symbol}</span>
          </nav>
        </Reveal>

        {/* ────────────────────────────────────────────────────────────
            HEADER BAND — entity identity + price + actions
           ──────────────────────────────────────────────────────────── */}
        <Reveal delay={0.05}>
        <header className="mb-5 flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {/* Symbol + name + exchange/sector */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <SymbolLogo symbol={symbol} size={40} />
              <h1 className="heading-display text-3xl font-semibold tracking-tight text-d-text-primary md:text-4xl">
                {symbol}
              </h1>
              <span className="truncate text-sm text-d-text-secondary">
                {stockData?.name && stockData.name !== symbol ? stockData.name : 'NSE'}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-d-text-muted">
                NSE{stockData?.sector ? ` · ${stockData.sector}` : ''}
              </span>
            </div>

            {/* Price + duotone change */}
            {stockData && (
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-3xl font-semibold tabular-nums text-d-text-primary">
                  ₹{stockData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
                <span className={`font-mono text-base font-medium tabular-nums ${up ? 'text-up' : 'text-down'}`}>
                  {up ? '+' : ''}
                  {stockData.change.toFixed(2)}
                </span>
                <ChangeBadge value={stockData.change_percent} kind="percent" size="sm" />
                <DataBadge mode={brokerConnected ? 'live' : 'eod'} />
                {wsConnected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-up/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-up">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" />
                    Streaming
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-d-text-muted">
                    At close
                  </span>
                )}
                {/* AI Picks badge — this symbol is in a live book today */}
                {activePick && (
                  <button
                    type="button"
                    onClick={() => router.push(`/signals/${activePick.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ai/40 bg-ai/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ai transition-colors hover:bg-ai/20"
                  >
                    <Sparkles className="h-3 w-3" />
                    {activePick.book}
                    {activePick.rank ? ` · #${activePick.rank}` : ''} · {activePick.direction}
                  </button>
                )}
              </div>
            )}

            {/* Inline quick-stats — the the reference "key stats inline" row */}
            {stockData && (
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
                <QuickStat label="Open" value={fmtInr(stockData.open, 2)} />
                <QuickStat label="Prev Close" value={fmtInr(stockData.prev_close, 2)} />
                <QuickStat
                  label="Day Range"
                  value={`${fmtInr(stockData.low, 2)} – ${fmtInr(stockData.high, 2)}`}
                />
                <QuickStat
                  label="52W Range"
                  value={`${fmtInr(stockData.week_52_low, 0)} – ${fmtInr(stockData.week_52_high, 0)}`}
                />
                <QuickStat
                  label="Volume"
                  value={fmtCompact(stockData.volume)}
                  sub={technicals?.volume_ratio != null ? `${technicals.volume_ratio.toFixed(1)}× avg` : undefined}
                />
                {/* Mkt Cap + P/E come from the SAME cached fundamentals
                    snapshot the FundamentalsCard renders — one source, no
                    beginner/pro duplication. price-payload P/E is fallback. */}
                <QuickStat
                  label="Mkt Cap"
                  value={
                    fnd?.market_cap_cr
                      ? fnd.market_cap_cr >= 1e5
                        ? `₹${(fnd.market_cap_cr / 1e5).toFixed(2)} L Cr`
                        : `₹${fnd.market_cap_cr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
                      : stockData.market_cap
                        ? `₹${(stockData.market_cap / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`
                        : '—'
                  }
                />
                {/* pe_ratio comes back 0 when the source has no P/E — treat as missing */}
                <QuickStat
                  label="P/E"
                  value={fnd?.pe ? fnd.pe.toFixed(1) : stockData.pe_ratio ? stockData.pe_ratio.toFixed(1) : '—'}
                />
                <QuickStat label="RSI 14" value={technicals?.rsi != null ? technicals.rsi.toFixed(1) : '—'} tone={rsiTone} />
              </dl>
            )}

            {/* 52-week position strip — where price sits in its yearly range,
                the first thing a swing trader anchors on. Pure client calc. */}
            {stockData?.week_52_low != null && stockData?.week_52_high != null &&
              stockData.week_52_high > stockData.week_52_low && (
              (() => {
                const lo = stockData.week_52_low!
                const hi = stockData.week_52_high!
                const posPct = Math.max(0, Math.min(100, ((stockData.price - lo) / (hi - lo)) * 100))
                const offHigh = ((stockData.price - hi) / hi) * 100
                return (
                  <div className="mt-3 max-w-md">
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-d-text-muted">
                      <span>52W position</span>
                      <span>
                        {posPct.toFixed(0)}% of range · <span className={offHigh >= -3 ? 'text-up' : 'text-d-text-secondary'}>{offHigh.toFixed(1)}% vs high</span>
                      </span>
                    </div>
                    <div className="relative mt-1 h-1.5 rounded-full bg-surface-2">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${posPct}%`, background: 'linear-gradient(90deg, var(--color-down), var(--color-highlight), var(--color-up))', opacity: 0.55 }}
                      />
                      <span
                        className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-d-text-primary"
                        style={{ left: `calc(${posPct}% - 1px)` }}
                      />
                    </div>
                  </div>
                )
              })()
            )}
          </div>

          {/* Actions — Trade · Add to Watchlist · Ask AI · Refresh */}
          <div className="flex shrink-0 items-center gap-2">
            <TradeTicketButton symbol={symbol} currentPrice={stockData?.price} />
            <Button
              variant={isInWatchlist ? 'secondary' : 'ghost'}
              size="sm"
              onClick={toggleWatchlist}
              aria-pressed={isInWatchlist}
            >
              {isInWatchlist ? (
                <BookmarkCheck className="h-4 w-4 text-up" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </span>
            </Button>
            <Button
              variant="ai"
              size="sm"
              onClick={() =>
                dispatchCopilotOpen(`Give me a full read on ${symbol}: setup, key levels, and risks.`)
              }
            >
              <Sparkles className="h-4 w-4" />
              <span className="ml-1.5">Ask Copilot</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStockData}
              aria-label="Refresh"
              disabled={loading}
              className="px-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>
        </Reveal>

        {/* ────────────────────────────────────────────────────────────
            PRIMARY CHART — full-width, theme-aware (tri-theme via tokens)
           ──────────────────────────────────────────────────────────── */}
        <Reveal delay={0.1}>
        <section className="mb-6">
          <ErrorBoundary label="Price chart">
            {/* key forces a clean re-mount when the resolved theme flips so the
                chart's canvas palette tracks light/dark. */}
            <TradingViewWidget key={chartTheme} symbol={symbol} height={520} theme={chartTheme} />
          </ErrorBoundary>
        </section>
        </Reveal>

        {/* ────────────────────────────────────────────────────────────
            AI TRADE DESK — the hero. One deep-reasoning synthesis over
            every deterministic read below. No chat box: questions go to
            the Copilot dock (one brain, one conversation surface).
           ──────────────────────────────────────────────────────────── */}
        <Reveal delay={0.12}>
        <section className="mb-6">
          <ErrorBoundary label="AI Trade Desk">
            <AITradeDeskCard symbol={symbol} />
          </ErrorBoundary>
        </section>
        </Reveal>

        {/* ────────────────────────────────────────────────────────────
            AI TABS — Engine Read · Why It Moves · Forecast.
            Deterministic evidence only (the Trade Desk synthesizes it);
            duplicate cards consolidated 2026-07-21: NewsMood folded into
            News Intelligence, MarketProfile into Volume Profile, CVD
            footprint into Volume Intelligence.
           ──────────────────────────────────────────────────────────── */}
        <Reveal delay={0.15}>
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" />
            <EyebrowMono className="text-ai">AI engines read {symbol}</EyebrowMono>
          </div>

          <Tabs defaultValue="technical">
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="technical">Engine Read</TabsTrigger>
              <TabsTrigger value="why">Why It Moves</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>

            {/* ── ENGINE READ ─────────────────────────────────────────
                Fused setup + dossier, the FULL technicals system (all
                indicators + votes + S/R levels — supersedes the old
                KeyLevels and IndicatorInterpreter cards), then strength /
                sentiment / volume, and chart vision. */}
            <TabsContent value="technical" className="pt-5">
              <div className="space-y-4">
                <ErrorBoundary label="AI engine read">
                  <TabAiRead
                    symbol={symbol}
                    title="AI engine read"
                    fetchNarrative={() => api.screener.verdict(symbol, true).then((r) => r?.narrative ?? null)}
                  />
                </ErrorBoundary>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <ErrorBoundary label="Fusion verdict">
                    <FusionVerdictCard symbol={symbol} />
                  </ErrorBoundary>
                  <ErrorBoundary label="AI Dossier">
                    <AIDossierPanel symbol={symbol} />
                  </ErrorBoundary>
                </div>

                <ErrorBoundary label="Technicals and levels">
                  <TechnicalsPanelCard symbol={symbol} />
                </ErrorBoundary>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <ErrorBoundary label="Relative strength">
                    <RelativeStrengthCard symbol={symbol} />
                  </ErrorBoundary>
                  <ErrorBoundary label="Sentiment">
                    <SentimentCard symbol={symbol} />
                  </ErrorBoundary>
                  <ErrorBoundary label="Volume intelligence">
                    <VolumeIntelCard symbol={symbol} />
                  </ErrorBoundary>
                </div>

                <ErrorBoundary label="Chart vision">
                  <ChartVisionCard symbol={symbol} anywhere />
                </ErrorBoundary>
              </div>
            </TabsContent>

            {/* ── WHY IT MOVES ────────────────────────────────────────
                Grounded move attribution + multi-source news intelligence
                (aggregate mood lives inside News Intelligence now). */}
            <TabsContent value="why" className="pt-5">
              <div className="space-y-4">
                <ErrorBoundary label="AI move read">
                  <TabAiRead
                    symbol={symbol}
                    title="AI move read"
                    fetchNarrative={() => api.screener.whyMoving(symbol, true).then((r) => r?.narrative ?? null)}
                  />
                </ErrorBoundary>
                <ErrorBoundary label="Why moving">
                  <WhyMovingCard symbol={symbol} />
                </ErrorBoundary>
                <ErrorBoundary label="News Intelligence">
                  <NewsIntelligenceCard symbol={symbol} />
                </ErrorBoundary>
              </div>
            </TabsContent>

            {/* ── FORECAST ────────────────────────────────────────────
                Setup probabilities (base rates) + earnings preview. Honest:
                base rates / scenarios, not a fabricated price target. */}
            <TabsContent value="forecast" className="pt-5">
              <div className="space-y-4">
                <ErrorBoundary label="AI forecast read">
                  <TabAiRead
                    symbol={symbol}
                    title="AI forecast read"
                    fetchNarrative={() => api.screener.forecastRead(symbol, true).then((r) => r?.narrative ?? null)}
                  />
                </ErrorBoundary>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <ErrorBoundary label="Setup probabilities">
                    <ProbabilityCard symbol={symbol} />
                  </ErrorBoundary>
                  <ErrorBoundary label="Earnings preview">
                    <EarningsPreviewCard symbol={symbol} />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
        </Reveal>

        {/* ────────────────────────────────────────────────────────────
            DATA MODULES GRID — fundamentals + volume-at-price. The order
            book renders ONLY with a connected broker feed (SEBI Path-A);
            without one it would just be an empty card.
           ──────────────────────────────────────────────────────────── */}
        <Reveal delay={0.2}>
        <section className="mb-6">
          <EyebrowMono className="mb-3">Data Modules</EyebrowMono>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <ErrorBoundary label="Fundamentals">
                <FundamentalsCard symbol={symbol} />
              </ErrorBoundary>
            </div>
            <div className={brokerConnected ? '' : 'lg:col-span-2'}>
              <ErrorBoundary label="Volume profile">
                <VolumeProfilePanel symbol={symbol} lookbackDays={30} bins={20} />
              </ErrorBoundary>
            </div>
            {brokerConnected && (
              <ErrorBoundary label="Order book">
                <OrderBookCard symbol={symbol} />
              </ErrorBoundary>
            )}
          </div>
        </section>
        </Reveal>

        <DisclaimerFooter />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

/** Inline header quick-stat: mono-caps label over a tabular-nums value. */
function QuickStat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'up' | 'down' | 'neutral'
}) {
  const color = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-d-text-primary'
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-d-text-muted">{label}</dt>
      <dd className={`mt-0.5 truncate font-mono text-xs font-semibold tabular-nums ${color}`}>{value}</dd>
      {sub && <dd className="truncate font-mono text-[9px] text-d-text-muted">{sub}</dd>}
    </div>
  )
}

