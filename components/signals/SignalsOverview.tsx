'use client'

/**
 * SignalsOverview — the cross-horizon SIGNAL ANALYSIS body (Overview tab of the
 * /signals hub). Extracted verbatim from the old app/signals/page.tsx so it can
 * be embedded inside SignalsHub, which owns the single AppShell. This component
 * renders body-only (NO AppShell).
 *
 * It analyses the WHOLE published book in one place —
 *   · KPI strip (active count, avg confidence, long/short, R:R)
 *   · distributions (by horizon, by direction, by confidence band)
 *   · a filterable + sortable master blotter of every open signal, each row
 *     drilling into its detail (/signals/[id]; momentum -> its weekly book).
 *
 * Data: getToday() — both books (Alpha Picks + Momentum Picks) with real row
 * ids. Brand firewall: only the public engine names ever surface. Honest:
 * open signals only, no fabricated stats.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'

import { Activity, ArrowRight, Sparkles } from '@/lib/icons'
import {
  Badge,
  Button,
  Card,
  ControlTower,
  DataTable,
  DisclaimerFooter,
  EmptyState,
  Input,
  InsightRail,
  MetricCard,
  MetricGrid,
  Reveal,
  Select,
} from '@/components/foundation'
import type { Column, SelectOption } from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { TradeTicketButton } from '@/components/trade/TradeTicketButton'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import {
  CATEGORIES,
  CATEGORY_LIST,
  categoryOf,
  isOpen,
  normalize,
  type CategoryId,
} from '@/components/signals/categories'
import { AutomationPanel } from '@/components/signals/AutomationPanel'
import { expectedMovePct, type DisplaySignal } from '@/components/signals/SignalCard'
import { api } from '@/lib/api'
import { DataBadge } from '@/components/common/DataBadge'
import { MONO } from '@/lib/tokens'

// ── helpers ─────────────────────────────────────────────────────────────────

const horizonOf = (s: DisplaySignal): CategoryId => categoryOf(s)

const inr = (n: number | undefined): string =>
  n ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: n < 100 ? 2 : 0 })}` : '—'

const CONF_BANDS: { label: string; test: (c: number) => boolean }[] = [
  { label: '90%+', test: (c) => c >= 90 },
  { label: '75–89%', test: (c) => c >= 75 && c < 90 },
  { label: '60–74%', test: (c) => c >= 60 && c < 75 },
  { label: 'Below 60%', test: (c) => c < 60 },
]

/** A labelled proportion bar — the building block of the distribution cards. */
function DistroRow({ label, value, max, barClass }: { label: string; value: number; max: number; barClass: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-[12px] text-d-text-secondary">{label}</span>
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-wrap">
        <span className={`absolute inset-y-0 left-0 rounded-full ${barClass} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`w-8 shrink-0 text-right text-[12px] font-semibold text-d-text-primary ${MONO}`}>{value}</span>
    </div>
  )
}

// ── overview ──────────────────────────────────────────────────────────────────

export function SignalsOverview() {
  const router = useRouter()
  const [horizon, setHorizon] = useState<'all' | CategoryId>('all')
  const [dir, setDir] = useState<'all' | 'LONG' | 'SHORT'>('all')
  const [q, setQ] = useState('')

  // One source of truth: /today carries EVERY horizon now (the style-engine
  // momentum + swing books bridge into the signals table daily with real row
  // ids + generated_at) — no more separate momentum fetch double-counting
  // the book with fabricated "just now" timestamps.
  const today = useSWR('signals:today', () => api.signals.getToday(), {
    revalidateOnFocus: false,
    refreshInterval: 30_000,
    dedupingInterval: 10_000,
    keepPreviousData: true,
  })

  const loading = today.isLoading && !today.data

  // The full open book across every horizon.
  const open = useMemo<DisplaySignal[]>(() => {
    const t = today.data
    const rows = t?.all_signals ?? [...(t?.long_signals ?? []), ...(t?.short_signals ?? [])]
    return rows.map(normalize).filter(isOpen)
  }, [today.data])

  const stats = useMemo(() => {
    const total = open.length
    const longCount = open.filter((s) => s.direction === 'LONG').length
    const rrs = open.map((s) => s.risk_reward).filter((n) => Number.isFinite(n) && n > 0)
    const byHorizon: Record<CategoryId, number> = { swing: 0, momentum: 0, momentum30: 0 }
    for (const s of open) byHorizon[horizonOf(s)] += 1
    const byConf = CONF_BANDS.map((b) => ({ label: b.label, n: open.filter((s) => b.test(s.confidence)).length }))
    return {
      total,
      longCount,
      shortCount: total - longCount,
      avgConf: total ? Math.round(open.reduce((a, s) => a + s.confidence, 0) / total) : null,
      avgRR: rrs.length ? rrs.reduce((a, n) => a + n, 0) / rrs.length : null,
      bestRR: rrs.length ? Math.max(...rrs) : null,
      byHorizon,
      byConf,
    }
  }, [open])

  const filtered = useMemo(
    () =>
      open.filter((s) => {
        if (horizon !== 'all' && horizonOf(s) !== horizon) return false
        if (dir !== 'all' && s.direction !== dir) return false
        if (q && !s.symbol.toLowerCase().includes(q.toLowerCase())) return false
        return true
      }),
    [open, horizon, dir, q],
  )

  const HORIZON_OPTS: SelectOption[] = [
    { value: 'all', label: 'All horizons' },
    ...CATEGORY_LIST.map((c) => ({ value: c.id, label: c.label })),
  ]
  const DIR_OPTS: SelectOption[] = [
    { value: 'all', label: 'Both sides' },
    { value: 'LONG', label: 'Long only' },
    { value: 'SHORT', label: 'Short only' },
  ]

  const maxHorizon = Math.max(1, ...Object.values(stats.byHorizon))
  const maxConf = Math.max(1, ...stats.byConf.map((b) => b.n))

  // ── AI read of the open book (drives the InsightRail) ───────────────────────
  const longPct = stats.total ? Math.round((stats.longCount / stats.total) * 100) : 0
  const highConf = open.filter((s) => s.confidence >= 90).length
  const topHorizon = (Object.entries(stats.byHorizon).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'swing') as CategoryId
  const bookTone: 'up' | 'down' | 'neutral' = longPct >= 60 ? 'up' : longPct <= 40 ? 'down' : 'neutral'
  const insightRail = (
    <InsightRail
      title="Book read"
      verdict={{ label: longPct >= 60 ? 'Long-tilted' : longPct <= 40 ? 'Short-tilted' : 'Balanced', tone: bookTone }}
      summary={
        stats.total
          ? `The open book holds ${stats.total} signals at ${stats.avgConf ?? '—'}% average confidence, tilted ${longPct}% long. Mean reward-to-risk is ${stats.avgRR != null ? `1:${stats.avgRR.toFixed(1)}` : '—'} with the best setup at ${stats.bestRR != null ? `1:${stats.bestRR.toFixed(1)}` : '—'}.`
          : 'No open signals right now — the scans publish the strongest setups through the session.'
      }
      drivers={[
        `${CATEGORIES[topHorizon].label} is the deepest book (${stats.byHorizon[topHorizon]} signals)`,
        `${stats.longCount} long · ${stats.shortCount} short`,
        highConf ? `${highConf} high-conviction (90%+) setups` : `Avg confidence ${stats.avgConf ?? '—'}%`,
      ]}
      watch={[
        stats.shortCount ? `${stats.shortCount} short setups — confirm the broader tape` : null,
        stats.byConf.find((b) => b.label === 'Below 60%')?.n ? `${stats.byConf.find((b) => b.label === 'Below 60%')!.n} low-confidence signals — size down` : null,
      ].filter(Boolean) as string[]}
      footer="Delayed EOD research · not investment advice"
    />
  )

  const columns: Column<DisplaySignal>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      sticky: true,
      sortable: true,
      sortValue: (r) => r.symbol,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <SymbolLogo symbol={r.symbol} size={26} />
          <span className="font-semibold text-d-text-primary">{r.symbol}</span>
        </span>
      ),
    },
    {
      key: 'horizon',
      header: 'Horizon',
      sortable: true,
      sortValue: (r) => horizonOf(r),
      cell: (r) => <Badge tone="muted">{CATEGORIES[horizonOf(r)].label}</Badge>,
    },
    {
      key: 'direction',
      header: 'Side',
      sortable: true,
      sortValue: (r) => r.direction,
      cell: (r) => <Badge tone={r.direction === 'LONG' ? 'buy' : 'sell'}>{r.direction}</Badge>,
    },
    { key: 'entry_price', header: 'Entry', align: 'right', sortable: true, cell: (r) => <span className={MONO}>{inr(r.entry_price)}</span> },
    {
      key: 'stop_loss',
      header: 'Stop',
      align: 'right',
      hideOnMobile: true,
      cell: (r) => <span className={`${MONO} text-d-text-secondary`}>{inr(r.stop_loss)}</span>,
    },
    {
      key: 'target_price',
      header: 'Target',
      align: 'right',
      hideOnMobile: true,
      cell: (r) => <span className={`${MONO} text-d-text-secondary`}>{inr(r.target_price)}</span>,
    },
    {
      key: 'move',
      header: 'Exp. move',
      align: 'right',
      hideOnMobile: true,
      sortable: true,
      sortValue: (r) => expectedMovePct(r),
      cell: (r) => {
        const m = expectedMovePct(r)
        return <span className={`${MONO} ${m >= 0 ? 'text-up' : 'text-down'}`}>{m >= 0 ? '+' : ''}{m.toFixed(1)}%</span>
      },
    },
    {
      key: 'confidence',
      header: 'Confidence',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.confidence,
      cell: (r) => (
        <span className="flex items-center justify-end gap-2">
          <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-wrap sm:inline-block">
            <span className="block h-full rounded-full bg-signature" style={{ width: `${Math.min(100, Math.max(0, r.confidence))}%` }} />
          </span>
          <span className={`${MONO} text-d-text-primary`}>{Math.round(r.confidence)}%</span>
        </span>
      ),
    },
    {
      key: 'risk_reward',
      header: 'R:R',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.risk_reward,
      cell: (r) => <span className={MONO}>{r.risk_reward > 0 ? `1:${r.risk_reward.toFixed(1)}` : '—'}</span>,
    },
  ]

  return (
    <div className="w-full space-y-4 p-4 md:p-6 xl:px-8">
      {/* sub-header — compact; DeskTopbar carries the main title on desktop */}
      <Reveal className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-[12px] text-d-text-muted">
          <DataBadge mode="eod" />
          <span>Delayed end-of-day research · not investment advice</span>
        </div>
        <div className="flex gap-2">
          <TradeTicketButton label="Trade" size="md" />
          <Button variant="ai" onClick={() => dispatchCopilotOpen("Analyse today's signal book across all horizons — where's the strongest edge?")}>
            <Sparkles className="mr-1 h-4 w-4" /> Ask AI
          </Button>
        </div>
      </Reveal>

      {/* KPI strip — pro-finance MetricCards with semantic accent borders */}
      <Reveal>
        <MetricGrid min={150}>
          <MetricCard label="Open signals" value={loading ? '—' : stats.total} tone="ai" hint="across all horizons" />
          <MetricCard label="Avg confidence" value={loading || stats.avgConf == null ? '—' : stats.avgConf} suffix={stats.avgConf != null ? '%' : ''} tone={stats.avgConf != null && stats.avgConf >= 75 ? 'up' : 'neutral'} />
          <MetricCard label="Long / Short" value={loading ? '—' : `${stats.longCount} / ${stats.shortCount}`} tone={bookTone} hint={`${longPct}% long`} />
          <MetricCard label="Avg R:R" value={loading || stats.avgRR == null ? '—' : `1:${stats.avgRR.toFixed(1)}`} tone="neutral" hint="reward-to-risk" />
          <MetricCard label="Best R:R" value={loading || stats.bestRR == null ? '—' : `1:${stats.bestRR.toFixed(1)}`} tone="up" />
        </MetricGrid>
      </Reveal>

      <ControlTower rail={insightRail}>
      {/* automation — trade the books manually (per-signal) or via the bot */}
      <Reveal>
        <AutomationPanel />
      </Reveal>

      {/* distributions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Reveal>
          <Card className="h-full p-5">
            <div className="text-[12.5px] font-semibold text-d-text-primary">By horizon</div>
            <div className="mt-4 space-y-2.5">
              {CATEGORY_LIST.map((c) => (
                <DistroRow key={c.id} label={c.label} value={stats.byHorizon[c.id]} max={maxHorizon} barClass="bg-signature" />
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.04}>
          <Card className="h-full p-5">
            <div className="text-[12.5px] font-semibold text-d-text-primary">By direction</div>
            <div className="mt-4 space-y-2.5">
              <DistroRow label="Long" value={stats.longCount} max={Math.max(1, stats.total)} barClass="bg-up" />
              <DistroRow label="Short" value={stats.shortCount} max={Math.max(1, stats.total)} barClass="bg-down" />
            </div>
            <div className="mt-4 text-[11px] text-d-text-muted">
              {stats.total ? `${Math.round((stats.longCount / stats.total) * 100)}% of the book leans long.` : 'No open signals to weigh.'}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="h-full p-5">
            <div className="text-[12.5px] font-semibold text-d-text-primary">By confidence</div>
            <div className="mt-4 space-y-2.5">
              {stats.byConf.map((b) => (
                <DistroRow key={b.label} label={b.label} value={b.n} max={maxConf} barClass="bg-signature" />
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      {/* filter bar */}
      <Reveal className="flex flex-wrap items-center gap-2">
        <div className="w-40"><Select value={horizon} onValueChange={(v) => setHorizon(v as 'all' | CategoryId)} options={HORIZON_OPTS} /></div>
        <div className="w-36"><Select value={dir} onValueChange={(v) => setDir(v as 'all' | 'LONG' | 'SHORT')} options={DIR_OPTS} /></div>
        <Input className="w-44" placeholder="Search symbol…" value={q} onChange={(e) => setQ(e.target.value.toUpperCase())} />
        <span className="ml-auto text-[12px] text-d-text-muted">
          <span className={`font-semibold text-d-text-primary ${MONO}`}>{filtered.length}</span> of {stats.total} open
        </span>
      </Reveal>

      {/* master blotter */}
      <Reveal>
        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          ariaLabel="Open signals across all horizons"
          onRowClick={(r) => router.push(`/signals/${r.id}`)}
          empty={
            <EmptyState
              icon={<Activity className="h-8 w-8" />}
              title={stats.total ? 'No signals match these filters' : 'No open signals right now'}
              description={
                stats.total
                  ? 'Loosen the horizon, side or symbol filter to see more of the book.'
                  : "Today's scans publish through the session — the strongest setups land here as they clear the gate. Meanwhile, every past call is on the public track record."
              }
            />
          }
        />
      </Reveal>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-d-text-muted">
        <span>Open signals only · entry, stop and target on every row · tap a row for the full breakdown.</span>
        <Link href="/proof?tab=track-record" className="inline-flex items-center gap-1 font-semibold text-d-text-primary hover:underline underline-offset-4">
          Public track record <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      </ControlTower>

      <DisclaimerFooter />
    </div>
  )
}
