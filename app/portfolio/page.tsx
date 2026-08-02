'use client'

/**
 * /portfolio — control-tower redesign (2026-08 pro-finance pass).
 *
 * Layout: DeskTopbar → MetricGrid strip → ControlTower(primary + InsightRail)
 *   Primary: perf chart + positions table + broker panel
 *   Rail:    Portfolio Doctor AI read (derived from live positions)
 *
 * Demo fixtures render when the API returns zero positions so the page never
 * shows a blank grid to new users. The fixture banner mirrors the existing
 * "Demo data" pattern used on Signals.
 */

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts'
import { TrendingUp, Wallet, Briefcase, BarChart3, Inbox, Sparkles } from '@/lib/icons'
import Link from 'next/link'

import {
  Badge,
  Button,
  Card,
  ChangeBadge,
  ControlTower,
  DataTable,
  DisclaimerFooter,
  EmptyState,
  InsightRail,
  MetricCard,
  MetricGrid,
  Reveal,
  Tabs,
  TabsList,
  TabsTrigger,
  type Column,
} from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { TradeTicketButton } from '@/components/trade/TradeTicketButton'
import { BrokerPositionsPanel } from '@/components/broker/BrokerPositionsPanel'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { AppShell } from '@/components/shell/AppShell'
import { DeskTopbar } from '@/components/shell/DeskTopbar'
import { api } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'
import { MONO } from '@/lib/tokens'

interface Position {
  id: string
  symbol: string
  quantity: number
  avg_price: number
  current_price: number
  pnl: number
  pnl_percent: number
  value: number
}
interface HistoryPoint { date: string; value: number }

const PERIOD_TABS = [
  { id: '7',   label: '1W' },
  { id: '30',  label: '1M' },
  { id: '90',  label: '3M' },
  { id: '365', label: '1Y' },
] as const

const formatInr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

// ── Demo fixtures ─────────────────────────────────────────────────────────────
// Shown when the API returns 0 positions so the layout always renders populated.
const DEMO_POSITIONS: Position[] = [
  { id: 'd1', symbol: 'RELIANCE',  quantity: 50,  avg_price: 2820, current_price: 2863, pnl: 2150,  pnl_percent: 1.52, value: 143150 },
  { id: 'd2', symbol: 'INFY',      quantity: 120, avg_price: 1880, current_price: 1907, pnl: 3240,  pnl_percent: 1.44, value: 228840 },
  { id: 'd3', symbol: 'HDFCBANK',  quantity: 80,  avg_price: 1710, current_price: 1688, pnl: -1760, pnl_percent: -1.29, value: 135040 },
  { id: 'd4', symbol: 'TCS',       quantity: 30,  avg_price: 4050, current_price: 4176, pnl: 3780,  pnl_percent: 3.11, value: 125280 },
  { id: 'd5', symbol: 'BAJFINANCE',quantity: 20,  avg_price: 7300, current_price: 7490, pnl: 3800,  pnl_percent: 2.60, value: 149800 },
]
const DEMO_HISTORY: HistoryPoint[] = (() => {
  const pts: HistoryPoint[] = []
  const base = 780000
  let val = base
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    val += (Math.random() - 0.42) * 8000
    pts.push({ date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), value: Math.round(val) })
  }
  return pts
})()

export default function PortfolioPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30')

  const SWR_OPTS = { revalidateOnFocus: false, refreshInterval: 45_000, dedupingInterval: 15_000, keepPreviousData: true }
  const { data: posResp, isLoading: posLoading } = useSWR(
    'portfolio:positions',
    () => api.positions.getOpen().catch(() => ({ positions: [] })),
    SWR_OPTS,
  )
  const { data: histResp, isLoading: histLoading } = useSWR(
    ['portfolio:history', period],
    () => api.portfolio.getHistory(Number(period)).catch(() => ({ history: [] })),
    SWR_OPTS,
  )

  const livePositions: Position[] = useMemo(
    () =>
      ((posResp as any)?.positions ?? []).map((p: any) => {
        const entry = p.entry_price ?? p.average_price ?? 0
        const current = p.current_price ?? 0
        const qty = p.quantity ?? 0
        return { id: String(p.id), symbol: p.symbol, quantity: qty, avg_price: entry, current_price: current, pnl: p.unrealized_pnl ?? 0, pnl_percent: p.unrealized_pnl_percentage ?? p.unrealized_pnl_percent ?? 0, value: current * qty }
      }),
    [posResp],
  )
  const liveHistory: HistoryPoint[] = useMemo(
    () => ((histResp as any)?.history ?? []).map((h: any) => ({ date: h.date ?? new Date(h.timestamp ?? h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), value: h.portfolio_value ?? h.equity ?? h.value ?? 0 })),
    [histResp],
  )

  const loading = posLoading && !posResp
  // Use demo data when API returns nothing (not yet connected / no positions)
  const isDemo = !loading && livePositions.length === 0
  const positions = isDemo ? DEMO_POSITIONS : livePositions
  const history = isDemo ? DEMO_HISTORY : liveHistory.length > 0 ? liveHistory : DEMO_HISTORY
  const chartLoading = !isDemo && histLoading && !histResp

  // Derived totals
  const totalValue    = positions.reduce((s, p) => s + p.value, 0)
  const totalPnL      = positions.reduce((s, p) => s + p.pnl, 0)
  const totalInvested = positions.reduce((s, p) => s + p.avg_price * p.quantity, 0)
  const overallPct    = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
  const winners       = positions.filter((p) => p.pnl > 0).length
  const losers        = positions.filter((p) => p.pnl < 0).length

  // ── AI read for the InsightRail ───────────────────────────────────────────
  const winRate = positions.length ? Math.round((winners / positions.length) * 100) : 0
  const bestPos = positions.reduce((b, p) => (p.pnl_percent > b.pnl_percent ? p : b), positions[0])
  const worstPos = positions.reduce((w, p) => (p.pnl_percent < w.pnl_percent ? p : w), positions[0])
  const bookTone: 'up' | 'down' | 'neutral' =
    totalPnL > 0 ? 'up' : totalPnL < 0 ? 'down' : 'neutral'

  const insightRail = (
    <InsightRail
      title="Portfolio Doctor"
      verdict={{
        label: totalPnL >= 0 ? `+${overallPct.toFixed(1)}%` : `${overallPct.toFixed(1)}%`,
        tone: bookTone,
      }}
      summary={
        positions.length
          ? `Book holds ${positions.length} positions worth ${formatInr(totalValue)} with ${totalPnL >= 0 ? 'an overall gain' : 'an overall loss'} of ${formatInr(Math.abs(totalPnL))} (${overallPct >= 0 ? '+' : ''}${overallPct.toFixed(2)}%). Win rate is ${winRate}% — ${winners} positions in profit, ${losers} in loss.`
          : 'Connect your broker or deploy a signal to populate the portfolio view.'
      }
      drivers={[
        bestPos ? `Best: ${bestPos.symbol} +${bestPos.pnl_percent.toFixed(1)}%` : null,
        `${winners} winners · ${losers} losers`,
        `Invested ${formatInr(totalInvested)} · Current ${formatInr(totalValue)}`,
      ].filter(Boolean) as string[]}
      watch={[
        worstPos && worstPos.pnl < 0 ? `Review ${worstPos.symbol} (${worstPos.pnl_percent.toFixed(1)}%) — consider stop-loss` : null,
        losers > winners ? 'More losing positions than winners — reassess book bias' : null,
      ].filter(Boolean) as string[]}
      footer={isDemo ? 'Demo data — connect broker or deploy signals for live positions' : 'Live via broker feed · unrealized P&L only'}
    />
  )

  const columns: Column<Position>[] = [
    { key: 'symbol', header: 'Symbol', sortable: true, sticky: true, cell: (r) => <span className="flex items-center gap-2.5"><SymbolLogo symbol={r.symbol} size={26} /><span className="font-medium text-d-text-primary">{r.symbol}</span></span> },
    { key: 'qty',   header: 'Qty',   align: 'right', sortable: true, sortValue: (r) => r.quantity,      cell: (r) => <span className={MONO}>{r.quantity.toLocaleString('en-IN')}</span> },
    { key: 'avg',   header: 'Avg',   align: 'right', hideOnMobile: true,                                cell: (r) => <span className={MONO}>₹{r.avg_price.toFixed(2)}</span> },
    { key: 'price', header: 'LTP',   align: 'right', sortable: true, sortValue: (r) => r.current_price, cell: (r) => <span className={MONO}>₹{r.current_price.toFixed(2)}</span> },
    { key: 'value', header: 'Value', align: 'right', sortable: true, sortValue: (r) => r.value, hideOnMobile: true, cell: (r) => <span className={MONO}>{formatInr(r.value)}</span> },
    {
      key: 'pnl', header: 'P&L', align: 'right', sortable: true, sortValue: (r) => r.pnl,
      cell: (r) => (
        <div className="flex flex-col items-end">
          <span className={`${MONO} ${r.pnl >= 0 ? 'text-up' : 'text-down'}`}>{r.pnl >= 0 ? '+' : ''}{formatInr(r.pnl)}</span>
          <ChangeBadge value={r.pnl_percent} kind="percent" size="xs" hideArrow />
        </div>
      ),
    },
  ]

  return (
    <AppShell>
      <DeskTopbar
        title="Portfolio"
        eyebrow="AI on your book"
        actions={
          <div className="flex gap-2">
            <TradeTicketButton label="New order" size="sm" />
            <Button variant="ai" size="sm" onClick={() => dispatchCopilotOpen('Review my portfolio and suggest rebalances if needed.')}>
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Ask AI
            </Button>
          </div>
        }
      />

      <div className="w-full space-y-4 p-4 md:p-6 xl:px-8">

        {/* Demo banner */}
        {isDemo && (
          <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/8 px-3 py-2 text-[12px] text-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Demo data — sample portfolio for design preview. Connect your broker for live positions.
          </div>
        )}

        {/* ── Telemetry strip — MetricCards with accent borders ── */}
        <Reveal>
          <MetricGrid min={160}>
            <MetricCard
              label="Portfolio Value"
              value={loading ? '—' : formatInr(totalValue)}
              tone={bookTone}
              hint="current market value"
            />
            <MetricCard
              label="Total P&L"
              value={loading ? '—' : `${totalPnL >= 0 ? '+' : ''}${formatInr(totalPnL)}`}
              tone={bookTone}
              delta={overallPct}
              hint="unrealized"
            />
            <MetricCard
              label="Positions"
              value={loading ? '—' : positions.length}
              tone="ai"
              hint={`${winners}W · ${losers}L`}
            />
            <MetricCard
              label="Invested"
              value={loading ? '—' : formatInr(totalInvested)}
              tone="neutral"
              hint="cost basis"
            />
          </MetricGrid>
        </Reveal>

        {/* ── Control-tower: chart + table (primary) · Doctor (rail) ── */}
        <ControlTower rail={insightRail}>

          {/* Performance chart */}
          <Reveal delay={0.04}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-[13px] font-semibold text-d-text-primary">Equity curve</span>
                <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
                  <TabsList>
                    {PERIOD_TABS.map((p) => (
                      <TabsTrigger key={p.id} value={p.id}>{p.label}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <div className="p-4">
                {chartLoading ? (
                  <div className="flex h-56 items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-up)" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="var(--color-up)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-muted)" />
                        <YAxis tick={{ fontSize: 10 }} stroke="var(--color-muted)" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <RechartsTooltip
                          contentStyle={{ background: 'var(--color-wrap)', border: '1px solid var(--color-line)', borderRadius: 6, fontSize: 12 }}
                          formatter={(v: number) => formatInr(v)}
                        />
                        <Area type="monotone" dataKey="value" stroke="var(--color-up)" fill="url(#eqFill)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </Card>
          </Reveal>

          {/* Positions table */}
          <Reveal delay={0.07}>
            <Card className="overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <span className="text-[13px] font-semibold text-d-text-primary">
                  Positions
                  {positions.length > 0 && <span className="ml-2 text-[11px] font-normal text-d-text-muted">{positions.length} open</span>}
                </span>
              </div>
              <div className="p-4">
                <DataTable
                  ariaLabel="Open positions"
                  data={positions}
                  columns={columns}
                  loading={loading}
                  loadingRows={5}
                  onRowClick={(p) => router.push(stockHref(p.symbol))}
                  empty={
                    <EmptyState
                      icon={<Inbox className="h-6 w-6" />}
                      title="No open positions"
                      description="Deploy an ML-ranked signal and let the agents track it here."
                      action={
                        <Link href="/signals">
                          <Button variant="secondary">
                            <TrendingUp className="mr-1 h-4 w-4" />Browse ML signals
                          </Button>
                        </Link>
                      }
                    />
                  }
                />
              </div>
            </Card>
          </Reveal>

          {/* Broker live panel */}
          <Reveal delay={0.10}>
            <div>
              <p className="desk-label mb-2">Broker · live positions &amp; orders</p>
              <BrokerPositionsPanel />
            </div>
          </Reveal>

        </ControlTower>

        <DisclaimerFooter />
      </div>
    </AppShell>
  )
}
