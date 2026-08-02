'use client'

/**
 * /watchlist — active monitoring surface for tracked symbols.
 *
 * v2 redesign (Wave 5 — the reference "D" list/table archetype, re-skinned to
 * the xAI tokens): foundation PageHeader → KPI strip → add-symbol toolbar →
 * filter chips + a Table/Cards view toggle. The DEFAULT view is now a dense,
 * sortable foundation DataTable (mono-caps headers, hairline rows, duotone
 * change + consensus). The Cards view keeps the rich WatchCard (alerts editor,
 * regime-conflict warning, earnings row) for users who want the full dossier.
 *
 * Each item joins a live quote with engine consensus + regime warning +
 * sentiment + upcoming events. Free tier capped at 5; Pro+ unlimited.
 * Add / remove stay fully wired through both views.
 */

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight,
  Eye,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TableProperties,
} from '@/lib/icons'

import {
  Badge,
  Button,
  ChangeBadge,
  DataTable,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Reveal,
  UsageMeter,
  toast,
  type Column,
} from '@/components/foundation'
import { dispatchCopilotOpen } from '@/components/copilot/CopilotProvider'
import { DataBadge } from '@/components/common/DataBadge'
import { TradeTicketButton } from '@/components/trade/TradeTicketButton'
import { AppShell } from '@/components/shell/AppShell'
import { DeskTopbar } from '@/components/shell/DeskTopbar'
import { Card, CardContent } from '@/components/ui/card'
import { stockHref } from '@/lib/stock-href'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import { api, handleApiError, ApiError } from '@/lib/api'
import { MONO } from '@/lib/tokens'

import WatchCard from './_components/WatchCard'
import WatchlistDigestCard from './_components/WatchlistDigestCard'
import type { Item } from './_components/types'

type FilterTab = 'all' | 'bullish' | 'bearish' | 'warnings'
type ViewMode = 'table' | 'cards'

const CONSENSUS_TONE: Record<string, 'up' | 'down' | 'warning' | 'muted'> = {
  bullish: 'up',
  bearish: 'down',
  mixed: 'warning',
  neutral: 'muted',
}

export default function WatchlistPage() {
  const router = useRouter()
  const { isConnected } = useBrokerStatus()
  const [addSymbol, setAddSymbol] = useState('')
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [view, setView] = useState<ViewMode>('table')
  const [refreshing, setRefreshing] = useState(false)

  // PR-AS — SWR cache: keeps the last response across navigation so
  // back/forward renders instantly. 60s refresh matches the prior
  // setInterval cadence (watchlist quotes refresh slower than signals
  // since each card carries engine consensus + sentiment + events).
  const { data, isLoading, mutate } = useSWR(
    'watchlist:live',
    () => api.watchlist.live(),
    {
      revalidateOnFocus: false,
      refreshInterval: 60_000,
      dedupingInterval: 15_000,
      keepPreviousData: true,
    },
  )
  const loading = isLoading && !data

  const refresh = async (spinner = false) => {
    if (spinner) setRefreshing(true)
    try {
      await mutate()
    } catch (err) {
      toast.error('Could not refresh watchlist', { description: handleApiError(err) })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Cross-device per-symbol pin hydration (PR 123) — fires once
    // alongside the SWR initial fetch.
    import('@/lib/watchlistPresetMemory').then(({ hydrateSymbolPinsFromServer }) => {
      void hydrateSymbolPinsFromServer()
    }).catch(() => {})
  }, [])

  const counts = useMemo(() => {
    const items = data?.items ?? []
    return {
      all: items.length,
      bullish: items.filter((i) => i.engines?.consensus === 'bullish').length,
      bearish: items.filter((i) => i.engines?.consensus === 'bearish').length,
      warnings: items.filter((i) => i.engines?.regime_warning).length,
    }
  }, [data])

  // Watchlist cap state — used to grey out the Add button before the
  // user hits the 402 from the backend. Pro/Elite return cap=null so
  // atCap stays false. Admin bypass is handled server-side.
  const atCap = !!data && data.cap !== null && data.count >= data.cap

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === 'all') return data.items
    if (filter === 'warnings') return data.items.filter((i) => i.engines?.regime_warning)
    return data.items.filter((i) => i.engines?.consensus === filter)
  }, [data, filter])

  const onAdd = async () => {
    const sym = addSymbol.trim().toUpperCase().replace(/\.NS$/, '')
    if (!sym) return
    setAdding(true)
    try {
      await api.watchlist.add(sym)
      setAddSymbol('')
      await refresh()
      toast.success(`${sym} added to watchlist`)
    } catch (err) {
      // 402 from the watchlist cap → render the upgrade prompt instead
      // of a generic "could not add" toast. Backend emits structured
      // detail { error, message, current_tier, required_tier, ... }.
      if (err instanceof ApiError && err.status === 402) {
        toast.error('Watchlist limit reached', {
          description: `Free tier is capped at ${data?.cap ?? 5} symbols. Upgrade to Pro for unlimited.`,
          action: {
            label: 'Upgrade',
            onClick: () => {
              window.location.href = '/pricing'
            },
          },
        })
      } else {
        toast.error(`Could not add ${sym}`, { description: handleApiError(err) })
      }
    } finally {
      setAdding(false)
    }
  }

  const onRemove = async (sym: string) => {
    try {
      await api.watchlist.remove(sym)
      await refresh()
      toast.success(`${sym} removed`)
    } catch (err) {
      toast.error('Could not remove', { description: handleApiError(err) })
    }
  }

  // KPI data derived from live watchlist
  const KPIS = [
    { label: 'Tracked', v: loading ? '—' : String(data?.count ?? 0) },
    { label: 'Bullish', v: loading ? '—' : String(counts.bullish) },
    { label: 'Bearish', v: loading ? '—' : String(counts.bearish) },
    { label: 'Warnings', v: loading ? '—' : String(counts.warnings) },
  ]

  // ── DataTable columns (mono-caps headers + hairline rows + duotone)
  const columns: Column<Item>[] = [
    {
      key: 'symbol', header: 'Symbol', sortable: true, sticky: true,
      cell: (i) => (
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-d-text-primary">{i.symbol}</span>
          {i.engines?.regime_warning && (
            <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-warning">
              Warn
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'last_price', header: 'LTP', align: 'right', sortable: true,
      sortValue: (i) => i.last_price ?? 0,
      cell: (i) =>
        i.last_price != null
          ? <span className={`text-d-text-primary ${MONO}`}>₹{i.last_price.toFixed(2)}</span>
          : <span className="text-d-text-muted">—</span>,
    },
    {
      key: 'change_pct', header: 'Change', align: 'right', sortable: true,
      sortValue: (i) => i.change_pct ?? 0,
      cell: (i) =>
        i.change_pct != null
          ? <ChangeBadge value={i.change_pct} kind="percent" />
          : <span className="text-d-text-muted">—</span>,
    },
    {
      key: 'consensus', header: 'Consensus',
      sortValue: (i) => i.engines?.consensus ?? 'zzz',
      cell: (i) => {
        const c = i.engines?.consensus || 'neutral'
        return <Badge tone={CONSENSUS_TONE[c] ?? 'muted'}>{c}</Badge>
      },
    },
    {
      key: 'regime', header: 'Regime', hideOnMobile: true,
      cell: (i) =>
        i.engines?.regime
          ? <span className="text-[12px] capitalize text-d-text-secondary">{i.engines.regime}</span>
          : <span className="text-d-text-muted">—</span>,
    },
    {
      key: 'sentiment', header: 'Mood', align: 'right', hideOnMobile: true,
      sortValue: (i) => i.engines?.sentiment_score ?? -2,
      cell: (i) => {
        const s = i.engines?.sentiment_score
        if (s == null) return <span className="text-d-text-muted">—</span>
        const tone = s > 0.05 ? 'text-up' : s < -0.05 ? 'text-down' : 'text-d-text-secondary'
        return <span className={`${MONO} ${tone}`}>{s >= 0 ? '+' : ''}{s.toFixed(2)}</span>
      },
    },
    {
      key: 'signal', header: 'Signal', align: 'right', hideOnMobile: true,
      cell: (i) =>
        i.latest_signal
          ? (
            <span className="inline-flex items-center gap-1 text-[11px]">
              <span className={i.latest_signal.direction === 'LONG' ? 'text-up' : 'text-down'}>
                {i.latest_signal.direction}
              </span>
              <span className={`text-d-text-muted ${MONO}`}>{Math.round(i.latest_signal.confidence)}%</span>
            </span>
          )
          : <span className="text-d-text-muted">—</span>,
    },
    {
      key: 'actions', header: '', align: 'right', width: '88px',
      cell: (i) => (
        <div className="inline-flex items-center justify-end gap-1.5">
          <span onClick={(e) => e.stopPropagation()} className="inline-flex">
            <TradeTicketButton
              symbol={i.symbol}
              currentPrice={i.last_price ?? undefined}
              label=""
              size="sm"
              variant="ghost"
            />
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(i.symbol) }}
            aria-label={`Remove ${i.symbol}`}
            className="rounded-full glass-control p-1 text-d-text-muted transition-colors hover:text-down"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppShell>
      <DeskTopbar
        title="Watchlist"
        eyebrow="AI is watching"
        actions={
          <>
            <DataBadge mode={isConnected ? 'live' : 'eod'} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refresh(true)}
              disabled={refreshing || loading}
              aria-label="Refresh watchlist"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ai"
              size="sm"
              onClick={() => dispatchCopilotOpen('Suggest 5 symbols for my watchlist based on the current regime.')}
            >
              <Sparkles className="mr-1 h-4 w-4" /> Ask AI
            </Button>
          </>
        }
      />
      <div className="w-full pb-8">
        {/* Mobile-only page title */}
        <div className="border-b border-border px-4 py-4 lg:hidden">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">AI is watching</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">Watchlist</h1>
        </div>

        <div className="space-y-4 px-4 py-4 md:px-6">
          {/* KPI strip */}
          <Reveal>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {KPIS.map((k) => (
                <Card key={k.label} className="border-border bg-card">
                  <CardContent className="p-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{k.label}</p>
                    <p className={`mt-1.5 text-[22px] font-semibold leading-none text-foreground ${MONO}`}>{k.v}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>

          {/* Add symbol toolbar */}
          <Reveal delay={0.05}>
            <form
              onSubmit={(e) => { e.preventDefault(); onAdd() }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  value={addSymbol}
                  onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                  placeholder="Add symbol, e.g. TCS, RELIANCE, HDFCBANK"
                  aria-label="Add a symbol to your watchlist"
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={adding || !addSymbol.trim() || atCap}
                title={atCap ? `Free tier limit of ${data?.cap ?? 5} reached. Upgrade to Pro for unlimited.` : undefined}
              >
                {adding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline ml-1">{atCap ? 'At cap' : 'Add'}</span>
              </Button>
            </form>
          </Reveal>

          {/* Cap-truncation banner */}
          {data?.capped && data.cap !== null && (
            <section
              role="status"
              className="flex items-center justify-between gap-3 rounded-[20px] border border-highlight/40 bg-highlight/10 px-4 py-3"
            >
              <p className="text-xs text-highlight">
                The engines are watching the first {data.cap} of your {data.count} symbols. Upgrade to Pro to
                put every name under watch + unlock regime alerts.
              </p>
              <Link
                href="/pricing"
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-highlight hover:underline"
              >
                Upgrade
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </section>
          )}

          {/* Watchlist Daily Digest — deterministic bullets instantly; AI narrative on demand */}
          <Reveal delay={0.1}><WatchlistDigestCard /></Reveal>

          {/* Filter / toolbar row — D archetype: filter chips + view toggle */}
          <Reveal delay={0.15}>
            <div className="flex flex-col gap-3 border-y border-line py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'bullish', 'bearish', 'warnings'] as const).map((f) => {
                const active = filter === f
                const n = counts[f]
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] capitalize transition-colors ${
                      active
                        ? 'glass-control-accent'
                        : 'glass-control text-d-text-secondary hover:text-d-text-primary'
                    }`}
                  >
                    {f}
                    <span className={`text-[10px] ${MONO} ${active ? 'text-d-text-secondary' : 'text-d-text-muted'}`}>{n}</span>
                  </button>
                )
              })}
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-wrap p-0.5">
              <button
                type="button"
                onClick={() => setView('table')}
                aria-label="Table view"
                aria-pressed={view === 'table'}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                  view === 'table' ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-secondary'
                }`}
              >
                <TableProperties className="h-3.5 w-3.5" /> Table
              </button>
              <button
                type="button"
                onClick={() => setView('cards')}
                aria-label="Cards view"
                aria-pressed={view === 'cards'}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                  view === 'cards' ? 'glass-control-accent' : 'text-d-text-muted hover:text-d-text-secondary'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Cards
              </button>
            </div>
            </div>
          </Reveal>

          {/* Results */}
          {loading ? (
            view === 'table' ? (
              <DataTable ariaLabel="Watchlist" data={[]} columns={columns} loading loadingRows={6} />
            ) : (
              <Grid>
                {Array.from({ length: 6 }).map((_, i) => <SkelCard key={i} />)}
              </Grid>
            )
          ) : filtered.length === 0 ? (
            !data?.items?.length || filter === 'all' ? (
              <EmptyState
                icon={<Eye className="h-6 w-6" />}
                title="Put the AI on watch"
                description="Add a symbol and the engines watch it every session: live quote, engine consensus, regime warning, and news mood. Or let the Copilot suggest starters from your portfolio and the current regime."
                action={
                  <Button
                    variant="ai"
                    onClick={() => dispatchCopilotOpen('Suggest 5 symbols for my watchlist based on the current regime.')}
                  >
                    <Sparkles className="mr-1 h-4 w-4" />
                    Ask the Copilot
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Eye className="h-6 w-6" />}
                title={`No ${filter === 'warnings' ? 'warnings' : filter + ' symbols'}`}
                description="Switch filters to see other groupings."
                size="sm"
              />
            )
          ) : view === 'table' ? (
            <Reveal delay={0.2}>
              <DataTable
                ariaLabel="Watchlist"
                data={filtered}
                columns={columns}
                rowKey={(i) => i.symbol}
                onRowClick={(i) => router.push(stockHref(i.symbol))}
              />
            </Reveal>
          ) : (
            <Grid>
              {filtered.map((it, i) => (
                <Reveal key={it.symbol} delay={Math.min(i, 8) * 0.04}>
                  <WatchCard
                    i={it}
                    onRemove={() => onRemove(it.symbol)}
                    onAlertSaved={() => refresh()}
                  />
                </Reveal>
              ))}
            </Grid>
          )}

          <DisclaimerFooter />
        </div>
      </div>
    </AppShell>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">{children}</div>
}

function SkelCard() {
  return (
    <div className="space-y-3 rounded-[20px] border border-line bg-wrap p-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-wrap-hover" />
        <div className="h-3 w-12 animate-pulse rounded bg-wrap-hover/70" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="h-8 animate-pulse rounded bg-wrap-hover/70" />
        <div className="h-8 animate-pulse rounded bg-wrap-hover/70" />
        <div className="h-8 animate-pulse rounded bg-wrap-hover/70" />
      </div>
    </div>
  )
}
