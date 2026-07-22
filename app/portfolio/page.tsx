'use client'

/**
 * /portfolio (PR-P) — v4 glass cockpit reskin.
 *
 * IA top → bottom:
 *   1. Glass header — Portfolio + Doctor CTA + Ask AI
 *   2. 4 KPI glass cards (Value · P&L · Positions · Invested)
 *   3. Performance chart (Recharts AreaChart) with period tabs — glass card
 *   4. Positions DataTable — glass card
 *   5. DisclaimerFooter
 *
 * Visual reskin only — all imports, hooks, data fetching, handlers,
 * sub-components, tables, tabs, empty/loading/error states preserved.
 */

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Stethoscope, TrendingUp, Wallet, Briefcase, BarChart3, Inbox, Sparkles } from '@/lib/icons'
import Link from 'next/link'

import {
  Badge,
  Button,
  Card,
  ChangeBadge,
  DataTable,
  DisclaimerFooter,
  EmptyState,
  Reveal,
  Tabs,
  TabsList,
  TabsTrigger,
  type Column,
} from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { TradeTicketButton } from '@/components/trade/TradeTicketButton'
import RebalanceCard from '@/components/portfolio/RebalanceCard'
import { BrokerPositionsPanel } from '@/components/broker/BrokerPositionsPanel'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { AppShell } from '@/components/shell/AppShell'
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

interface HistoryPoint {
  date: string
  value: number
}

const PERIOD_TABS = [
  { id: '7',   label: '1W' },
  { id: '30',  label: '1M' },
  { id: '90',  label: '3M' },
  { id: '365', label: '1Y' },
] as const

const formatInr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function PortfolioPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30')

  // PR-AS — SWR for both data sources keeps prior data on screen
  // during background refetches. Period change just swaps the key.
  const SWR_OPTS = {
    revalidateOnFocus: false,
    refreshInterval: 45_000,
    dedupingInterval: 15_000,
    keepPreviousData: true,
  }
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

  const positions: Position[] = useMemo(
    () =>
      ((posResp as any)?.positions ?? []).map((p: any) => {
        const entry = p.entry_price ?? p.average_price ?? 0
        const current = p.current_price ?? 0
        const qty = p.quantity ?? 0
        return {
          id: String(p.id),
          symbol: p.symbol,
          quantity: qty,
          avg_price: entry,
          current_price: current,
          pnl: p.unrealized_pnl ?? 0,
          pnl_percent: p.unrealized_pnl_percentage ?? p.unrealized_pnl_percent ?? 0,
          value: current * qty,
        }
      }),
    [posResp],
  )

  const history: HistoryPoint[] = useMemo(
    () =>
      ((histResp as any)?.history ?? []).map((h: any) => ({
        date:
          h.date ??
          new Date(h.timestamp ?? h.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          }),
        value: h.portfolio_value ?? h.equity ?? h.value ?? 0,
      })),
    [histResp],
  )

  const loading = posLoading && !posResp
  const chartLoading = histLoading && !histResp

  // Derived
  const totalValue = positions.reduce((s, p) => s + p.value, 0)
  const totalPnL = positions.reduce((s, p) => s + p.pnl, 0)
  const totalInvested = positions.reduce((s, p) => s + p.avg_price * p.quantity, 0)
  const overallPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  const columns: Column<Position>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      sortable: true,
      sticky: true,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <SymbolLogo symbol={r.symbol} size={26} />
          <span className="font-medium text-d-text-primary">{r.symbol}</span>
        </span>
      ),
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.quantity,
      cell: (r) => (
        <span className={MONO}>{r.quantity.toLocaleString('en-IN')}</span>
      ),
    },
    {
      key: 'avg',
      header: 'Avg',
      align: 'right',
      hideOnMobile: true,
      cell: (r) => (
        <span className={MONO}>₹{r.avg_price.toFixed(2)}</span>
      ),
    },
    {
      key: 'price',
      header: 'LTP',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.current_price,
      cell: (r) => (
        <span className={MONO}>₹{r.current_price.toFixed(2)}</span>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.value,
      hideOnMobile: true,
      cell: (r) => (
        <span className={MONO}>{formatInr(r.value)}</span>
      ),
    },
    {
      key: 'pnl',
      header: 'P&L',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.pnl,
      cell: (r) => (
        <div className="flex flex-col items-end">
          <span className={`${MONO} ${r.pnl >= 0 ? 'text-up' : 'text-down'}`}>
            {r.pnl >= 0 ? '+' : ''}{formatInr(r.pnl)}
          </span>
          <ChangeBadge value={r.pnl_percent} kind="percent" size="xs" hideArrow />
        </div>
      ),
    },
  ]

  // KPI strip data (derived from existing state — no new fetches)
  const KPIS = [
    {
      label: 'Portfolio Value',
      value: loading ? '—' : formatInr(totalValue),
      tooltip: 'Current market value of all open positions',
      icon: <Wallet className="h-3.5 w-3.5 text-primary" />,
    },
    {
      label: 'Total P&L',
      value: loading ? '—' : `${totalPnL >= 0 ? '+' : ''}${formatInr(totalPnL)}`,
      valueClass: loading ? '' : totalPnL >= 0 ? 'text-up' : 'text-down',
      tooltip: 'Unrealized P&L across open positions',
      icon: <TrendingUp className="h-3.5 w-3.5 text-primary" />,
    },
    {
      label: 'Open Positions',
      value: loading ? '—' : positions.length.toString(),
      icon: <Briefcase className="h-3.5 w-3.5 text-primary" />,
    },
    {
      label: 'Total Invested',
      value: loading ? '—' : formatInr(totalInvested),
      tooltip: 'Sum of (qty × avg entry) across positions',
      icon: <BarChart3 className="h-3.5 w-3.5 text-primary" />,
    },
  ]

  return (
    <AppShell>
      <div className="w-full space-y-5 p-4 md:p-6 xl:px-8">

        {/* ─── Glass header ─── */}
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-d-text-muted">
              AI on your book
            </div>
            <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-d-text-primary">
              <Briefcase size={18} className="text-primary" />
              Portfolio
            </h1>
            <div className="mt-0.5 text-[12px] text-d-text-muted">
              {loading
                ? 'Loading…'
                : `${positions.length} open positions · ${formatInr(totalValue)}`}
            </div>
          </div>
          <div className="flex gap-2">
            <TradeTicketButton label="New order" size="md" />
            <Link href="/portfolio/doctor">
              <Button variant="secondary">
                <Stethoscope className="mr-1 h-4 w-4" />
                Doctor
              </Button>
            </Link>
            <Button
              variant="ai"
              onClick={() =>
                dispatchCopilotOpen('Review my portfolio and suggest rebalances if needed.')
              }
            >
              <Sparkles className="mr-1 h-4 w-4" />
              Ask AI
            </Button>
          </div>
        </Reveal>

        {/* ─── KPI strip ─── */}
        <div className="grid grid-cols-2 gap-2 rounded-[20px] border border-line bg-wrap p-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Reveal key={k.label} delay={0.03 * i} className="h-full">
              <div className="tile-tint h-full p-4">
                <div className="flex items-center gap-1.5 text-[11px] text-d-text-secondary">
                  {k.icon}
                  {k.label}
                </div>
                <div
                  className={`mt-1 text-[22px] font-semibold leading-none ${MONO} ${
                    (k as any).valueClass ?? 'text-d-text-primary'
                  }`}
                >
                  {k.value}
                </div>
                {/* P&L pct sub-line */}
                {k.label === 'Total P&L' && !loading && (
                  <div className="mt-1">
                    <ChangeBadge value={overallPnLPct} kind="percent" size="xs" hideArrow />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* ─── Performance chart ─── */}
        <Reveal delay={0.06}>
          <Card variant="glass" className="overflow-hidden rounded-[20px]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-d-text-primary">Performance</h2>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
                <TabsList>
                  {PERIOD_TABS.map((p) => (
                    <TabsTrigger key={p.id} value={p.id}>
                      {p.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="p-4">
              {chartLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="h-6 w-6" />}
                  title="Equity curve goes live here"
                  description="Once a few trades close, your agents plot the book's equity curve here."
                  size="sm"
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" className="[stop-color:var(--color-up)] [stop-opacity:0.25]" />
                          <stop offset="100%" className="[stop-color:var(--color-up)] [stop-opacity:0]" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="var(--color-muted)"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="var(--color-muted)"
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          background: 'var(--color-wrap)',
                          border: '1px solid var(--color-line)',
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => formatInr(v)}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-up)"
                        fill="url(#equityFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>
        </Reveal>

        {/* ─── Positions table ─── */}
        <Reveal delay={0.09}>
          <Card variant="glass" className="overflow-hidden rounded-[20px]">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-d-text-primary">Positions</h2>
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
                          <TrendingUp className="mr-1 h-4 w-4" />
                          Browse ML signals
                        </Button>
                      </Link>
                    }
                  />
                }
              />
            </div>
          </Card>
        </Reveal>

        {/* ─── Broker · live positions & orders ─── */}
        <Reveal delay={0.11}>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-d-text-muted">
              Broker · live positions &amp; orders
            </div>
            <BrokerPositionsPanel />
          </div>
        </Reveal>

        {/* AIL v2 P3 — click-triggered AI rebalancing over the live holdings (weights normalized 0..1) */}
        {positions.length >= 2 && totalValue > 0 && (
          <Reveal delay={0.12}>
            <RebalanceCard
              positions={positions.map((p) => ({ symbol: p.symbol, weight: p.value / totalValue }))}
            />
          </Reveal>
        )}

        <DisclaimerFooter />
      </div>
    </AppShell>
  )
}
