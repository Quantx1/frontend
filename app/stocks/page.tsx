'use client'

/**
 * /stocks — full NSE universe discovery surface.
 *
 * v2 redesign (Wave 5 — Intellectia "D" list/table archetype, re-skinned to
 * the xAI tokens): a foundation PageHeader (breadcrumb eyebrow + Bricolage
 * title + actions) → a hairline filter/toolbar row (search + index/sector
 * Selects + sort) → a dense, sortable foundation DataTable (mono-caps
 * headers, hairline rows, duotone change). The old hand-rolled <StockList>
 * grid is gone — the audit flagged it; rows now ride DataTable.
 *
 * Browse the WHOLE main-board universe (2,385 equities), by index or sector,
 * with real DB-sourced sectors + market-cap tiers. The per-stock AI view lives
 * at /stock/[symbol].
 *
 *   * Regime banner up top so the table is read with the right mental frame.
 *   * Scope picker: any NSE index (broad-market / sectoral / F&O, 34 in all)
 *     OR a full-universe symbol/name search. Default scope = NIFTY 50.
 *   * Secondary sector filter, derived from the loaded scope's real sectors.
 *   * Live price / change / volume for the scope (chunked, bounded), sortable.
 *   * "Active signal" chip when today's signals include the row. No synthetic
 *     AI scores, no fake sparklines (no-fallbacks rule).
 *
 * Data sources (all real, unchanged):
 *   - api.screener.listIndices()         → index catalog (grouped)
 *   - api.screener.indexConstituents()   → symbols of the selected index
 *   - api.screener.searchInstruments()   → full-universe search (symbol/name/sector)
 *   - api.screener.getLivePrices()       → live quotes for the visible scope
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Search, Sparkles, TableProperties } from '@/lib/icons'

import { api } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'
import { AppShell } from '@/components/shell/AppShell'
import {
  ChangeBadge,
  DataTable,
  DisclaimerFooter,
  EmptyState,
  PageHeader,
  Reveal,
  Select,
  type Column,
} from '@/components/foundation'
import { MONO } from '@/lib/tokens'
import { DataBadge } from '@/components/common/DataBadge'
import ModelBadge from '@/components/ModelBadge'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import ErrorBoundary from '@/components/ErrorBoundary'
import AiTopPicks from '@/components/discover/AiTopPicks'
import StockMoodLookup from '@/components/markets/StockMoodLookup'

// ----------------------------------------------------------------- types

interface StockRow {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  sector: string | null
  mcap: string | null
  hasSignal: boolean
}

interface IndexInfo {
  index_name: string
  category: string // 'broad' | 'sectoral' | 'derivatives'
}

type RegimeCode = 'bull' | 'sideways' | 'bear'

interface CurrentRegime {
  regime: RegimeCode
  prob_bull: number
  prob_sideways: number
  prob_bear: number
  vix: number | null
}

type SortKey = 'changePercent' | 'volume' | 'price' | 'symbol'
type SortDir = 'desc' | 'asc'

const SORT_OPTIONS: { value: string; label: string; key: SortKey; dir: SortDir }[] = [
  { value: 'changePercent', label: 'Change %', key: 'changePercent', dir: 'desc' },
  { value: 'volume', label: 'Volume', key: 'volume', dir: 'desc' },
  { value: 'price', label: 'Price', key: 'price', dir: 'desc' },
  { value: 'symbol', label: 'Alphabetical', key: 'symbol', dir: 'asc' },
]

const CAT_LABEL: Record<string, string> = {
  broad: 'Broad market',
  sectoral: 'Sectoral',
  derivatives: 'Derivatives',
}

const DEFAULT_INDEX = 'NIFTY 50'
const SCOPE_CAP = 250 // max symbols priced per scope (keeps it fast + bounded)
const PAGE_SIZE = 25

// ----------------------------------------------------------------- page

export default function StocksPage() {
  const router = useRouter()
  const [indices, setIndices] = useState<IndexInfo[]>([])
  const [selectedIndex, setSelectedIndex] = useState<string>(DEFAULT_INDEX)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [rows, setRows] = useState<StockRow[]>([])
  const [scopeCount, setScopeCount] = useState(0) // full scope size (pre-cap)
  const [regime, setRegime] = useState<CurrentRegime | null>(null)
  const [signalSymbols, setSignalSymbols] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [sector, setSector] = useState<string>('All')
  const [sortVal, setSortVal] = useState(SORT_OPTIONS[0].value)
  const [page, setPage] = useState(1)

  const sortOpt = SORT_OPTIONS.find((o) => o.value === sortVal) ?? SORT_OPTIONS[0]

  // movers within the loaded scope (top 5 gainers / losers)
  const [topGainers, topLosers] = useMemo(() => {
    const priced = rows.filter((r) => r.price > 0)
    if (!priced.length) return [[], []] as [StockRow[], StockRow[]]
    const sorted = [...priced].sort((a, b) => b.changePercent - a.changePercent)
    return [sorted.slice(0, 5), sorted.slice(-5).reverse()]
  }, [rows])

  // ── one-time: index catalog + regime + today's signals
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [idxRes, regimeRes, signalsRes] = await Promise.all([
        api.screener.listIndices().catch(() => null),
        api.publicTrust.regimeHistory(1).catch(() => null),
        api.signals.getToday().catch(() => null),
      ])
      if (cancelled) return

      if (idxRes?.indices?.length) setIndices(idxRes.indices)

      if (regimeRes?.current) {
        setRegime({
          regime: regimeRes.current.regime,
          prob_bull: regimeRes.current.prob_bull,
          prob_sideways: regimeRes.current.prob_sideways,
          prob_bear: regimeRes.current.prob_bear,
          vix: regimeRes.current.vix,
        })
      }

      const sig = new Set<string>()
      for (const s of ((signalsRes as any)?.signals || [])) {
        if (s?.symbol) sig.add(String(s.symbol).replace('.NS', '').toUpperCase())
      }
      setSignalSymbols(sig)
    })()
    return () => { cancelled = true }
  }, [])

  // ── debounce the search box
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(id)
  }, [search])

  // ── load the active scope (search overrides index) + live prices
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setSector('All')
      setPage(1)
      try {
        const universe = debouncedSearch
          ? await loadSearch(debouncedSearch)
          : await loadIndex(selectedIndex)
        if (cancelled) return
        setScopeCount(universe.length)
        const capped = universe.slice(0, SCOPE_CAP)
        const priced = await withLivePrices(capped, signalSymbols)
        if (cancelled) return
        setRows(priced)
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // signalSymbols intentionally excluded — it hydrates once; rows recompute
    // the chip below via `hasSignal` re-derive when it changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, debouncedSearch])

  // ── re-derive the signal chip when today's signals resolve after the scope
  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        hasSignal: signalSymbols.has(r.symbol.replace('.NS', '').toUpperCase()),
      })),
    )
  }, [signalSymbols])

  // ── grouped index options for the picker
  const indexOptions = useMemo(() => {
    const order = ['broad', 'sectoral', 'derivatives']
    const groups: Record<string, string[]> = {}
    for (const i of indices) (groups[i.category] ||= []).push(i.index_name)
    // Flatten into Select options with a group prefix label (Select has no
    // optgroup; prefix keeps the grouping readable).
    const opts: { value: string; label: string }[] = []
    for (const c of order) {
      if (!groups[c]?.length) continue
      for (const n of groups[c]) opts.push({ value: n, label: `${CAT_LABEL[c]} · ${titleCase(n)}` })
    }
    return opts.length ? opts : [{ value: DEFAULT_INDEX, label: titleCase(DEFAULT_INDEX) }]
  }, [indices])

  // ── sectors present in the loaded scope (for the secondary filter)
  const sectorOptions = useMemo(() => {
    const s = new Set<string>()
    for (const r of rows) if (r.sector) s.add(r.sector)
    return [
      { value: 'All', label: 'All sectors' },
      ...Array.from(s).sort().map((x) => ({ value: x, label: x })),
    ]
  }, [rows])

  // ── filtered + sorted list
  const visible = useMemo(() => {
    const filtered = sector === 'All' ? rows : rows.filter((r) => r.sector === sector)
    const sorted = [...filtered].sort((a, b) => {
      const k = sortOpt.key
      const av: any = (a as any)[k]
      const bv: any = (b as any)[k]
      if (typeof av === 'string') {
        return sortOpt.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortOpt.dir === 'asc' ? (av || 0) - (bv || 0) : (bv || 0) - (av || 0)
    })
    return sorted
  }, [rows, sector, sortOpt])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const pageRows = visible.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  const scopeLabel = debouncedSearch ? `“${debouncedSearch}”` : selectedIndex

  // ── DataTable column model (mono-caps headers + hairline rows + duotone)
  const columns: Column<StockRow>[] = [
    {
      key: 'symbol', header: 'Symbol', sortable: true, sticky: true,
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <SymbolLogo symbol={r.symbol} size={26} />
          <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-medium text-d-text-primary">{r.symbol.replace('.NS', '')}</span>
            {r.sector && (
              <span className="rounded-sm bg-wrap-hover px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-d-text-muted">
                {r.sector}
              </span>
            )}
            {r.mcap && (
              <span className="rounded-sm bg-white/[0.06] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-d-text-secondary">
                {r.mcap}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-d-text-muted">{r.name || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'price', header: 'LTP', align: 'right', sortable: true,
      sortValue: (r) => r.price ?? 0,
      cell: (r) =>
        r.price > 0
          ? <span className={`text-d-text-primary ${MONO}`}>₹{r.price.toFixed(2)}</span>
          : <span className="text-d-text-muted">-</span>,
    },
    {
      key: 'changePercent', header: 'Change', align: 'right', sortable: true,
      sortValue: (r) => r.changePercent ?? 0,
      cell: (r) =>
        r.price > 0
          ? <ChangeBadge value={r.changePercent} kind="percent" />
          : <span className="text-d-text-muted">-</span>,
    },
    {
      key: 'volume', header: 'Volume', align: 'right', sortable: true, hideOnMobile: true,
      sortValue: (r) => r.volume ?? 0,
      cell: (r) => <span className={`text-d-text-secondary ${MONO}`}>{formatVolume(r.volume)}</span>,
    },
    {
      key: 'signal', header: 'AI', align: 'right',
      cell: (r) =>
        r.hasSignal
          ? <ModelBadge modelKey="swing_forecast" size="xs" variant="soft" />
          : <span className="text-[10px] text-d-text-muted">-</span>,
    },
  ]

  return (
    <AppShell>
      <div className="w-full pb-8">
        <Reveal>
          <PageHeader
            eyebrow="AI stock discovery"
            title="Stocks"
            description="The whole NSE board, read by our AI engines. Filter by index or sector, sort on live quotes. Tap any name for the full read: ML signals, news sentiment, technicals, chart."
            actions={
              <>
                <DataBadge mode="eod" />
                <Link
                  href="/signals"
                  className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-wrap-hover px-3 py-1.5 text-[12px] text-d-text-secondary transition-colors hover:text-d-text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Today&apos;s signals
                </Link>
              </>
            }
          />
        </Reveal>

        <div className="space-y-5 px-4 py-5 md:px-6">
          {/* Regime banner */}
          <Reveal delay={0.05}>
            <ErrorBoundary label="Regime">
              <RegimeBanner regime={regime} loading={loading && !regime} />
            </ErrorBoundary>
          </Reveal>

          {/* AI Top Picks — Alpha cross-sectional ranker */}
          <Reveal delay={0.1}>
            <ErrorBoundary label="AI Top Picks">
              <AiTopPicks limit={12} />
            </ErrorBoundary>
          </Reveal>

          {/* AIL v2 P3 — per-stock news mood + digest lookup (Mood engine, on-demand) */}
          <Reveal delay={0.15}>
            <ErrorBoundary label="Stock mood">
              <StockMoodLookup />
            </ErrorBoundary>
          </Reveal>

          {/* Gainers / losers strip (within the loaded scope) */}
          <Reveal delay={0.2}>
            <ErrorBoundary label="Movers">
              <div className="grid gap-4 md:grid-cols-2">
                <MoversCard title={`Top gainers · ${scopeLabel}`} items={topGainers} loading={loading} />
                <MoversCard title={`Top losers · ${scopeLabel}`} items={topLosers} loading={loading} />
              </div>
            </ErrorBoundary>
          </Reveal>

          {/* Filter / toolbar row — D archetype: search + index + sector + sort */}
          <Reveal delay={0.25}>
            <div className="flex flex-col gap-3 border-y border-line py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-d-text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the NSE board for an AI read: symbol or company"
                aria-label="Search stocks"
                className="h-10 w-full rounded-sm border border-line bg-wrap-hover pl-9 pr-3 text-sm text-d-text-primary outline-none transition-colors placeholder:text-d-text-muted focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[220px]">
                <Select
                  value={selectedIndex}
                  onValueChange={setSelectedIndex}
                  options={indexOptions}
                  disabled={!!debouncedSearch}
                  size="md"
                  placeholder="Index"
                />
              </div>
              {sectorOptions.length > 2 && (
                <div className="w-[180px]">
                  <Select
                    value={sector}
                    onValueChange={(v) => { setSector(v); setPage(1) }}
                    options={sectorOptions}
                    size="md"
                  />
                </div>
              )}
              <div className="w-[160px]">
                <Select
                  value={sortVal}
                  onValueChange={(v) => { setSortVal(v); setPage(1) }}
                  options={SORT_OPTIONS}
                  size="md"
                />
              </div>
            </div>
            </div>
          </Reveal>

          {/* Scope label + count */}
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-d-text-muted">
              {scopeLabel} · <span className="text-d-text-secondary">{visible.length}</span> stocks
            </p>
          </div>

          {/* Dense results table */}
          <Reveal delay={0.25}>
            <ErrorBoundary label="Stock list">
              <DataTable
                ariaLabel={`Stocks in ${scopeLabel}`}
                data={pageRows}
                columns={columns}
                loading={loading}
                loadingRows={8}
                onRowClick={(r) => router.push(stockHref(r.symbol))}
                empty={
                  <EmptyState
                    icon={<TableProperties className="h-6 w-6" />}
                    title="Nothing in this scope"
                    description="Pick another index, or search the full NSE board above to get an AI read on any name."
                    size="sm"
                  />
                }
              />
            </ErrorBoundary>
          </Reveal>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={pageClamped}
              totalPages={totalPages}
              onChange={setPage}
              total={visible.length}
              capped={scopeCount > SCOPE_CAP ? scopeCount : 0}
            />
          )}
          <DisclaimerFooter />
        </div>
      </div>
    </AppShell>
  )
}

// --------------------------------------------------------- subcomponents

function RegimeBanner({ regime, loading }: { regime: CurrentRegime | null; loading: boolean }) {
  if (loading && !regime) {
    return <div className="h-[64px] animate-pulse rounded-lg border border-line bg-wrap" />
  }
  if (!regime) return null

  const tone =
    regime.regime === 'bull' ? { fg: 'var(--color-up)', cls: 'text-up', label: 'Bull', copy: 'Risk-on. Size up. Momentum gets paid here.' } :
    regime.regime === 'bear' ? { fg: 'var(--color-down)', cls: 'text-down', label: 'Bear', copy: 'Cut size in half. Cash and defensives win.' } :
      { fg: 'var(--color-warning)', cls: 'text-warning', label: 'Sideways', copy: 'Fade the extremes. Breakouts fail. Tighten stops.' }

  const probs = [
    { label: 'Bull', pct: regime.prob_bull, color: 'var(--color-up)' },
    { label: 'Sideways', pct: regime.prob_sideways, color: 'var(--color-warning)' },
    { label: 'Bear', pct: regime.prob_bear, color: 'var(--color-down)' },
  ]

  return (
    <div className="rounded-lg border px-4 py-3" style={{ background: `color-mix(in srgb, ${tone.fg} 6%, transparent)`, borderColor: `color-mix(in srgb, ${tone.fg} 24%, transparent)` }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ModelBadge modelKey="regime_detector" size="xs" variant="soft" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-d-text-muted">Regime detection</span>
              <span className={`text-[13px] font-semibold ${tone.cls}`}>{tone.label}</span>
              {regime.vix != null && (
                <span className="text-[11px] text-d-text-muted">
                  · VIX <span className={`text-d-text-primary ${MONO}`}>{regime.vix.toFixed(2)}</span>
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-d-text-muted">{tone.copy}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-d-text-muted">
          {probs.map((p) => (
            <div key={p.label} className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
              {p.label} <span className={`text-d-text-primary ${MONO}`}>{(p.pct * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MoversCard({ title, items, loading }: {
  title: string; items: StockRow[]; loading: boolean
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-wrap">
      <div className="border-b border-line px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-d-text-muted">{title}</p>
      </div>
      <div>
        {loading && !items.length ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse border-b border-line px-4 py-2.5 last:border-0">
              <div className="h-3 w-24 rounded bg-wrap-hover" />
            </div>
          ))
        ) : items.length ? (
          items.map((r) => (
            <Link
              key={r.symbol}
              href={stockHref(r.symbol)}
              className="flex items-center justify-between border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-hover"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <SymbolLogo symbol={r.symbol} size={24} />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-d-text-primary">{r.symbol.replace('.NS', '')}</div>
                  <div className="truncate text-[10px] text-d-text-muted">{r.name || '-'}</div>
                </div>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <div className={`text-[12px] text-d-text-primary ${MONO}`}>₹{r.price.toFixed(2)}</div>
                <ChangeBadge value={r.changePercent} kind="percent" size="xs" />
              </div>
            </Link>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-[11px] text-d-text-muted">No live quotes yet</div>
        )}
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onChange, total, capped }: {
  page: number; totalPages: number; onChange: (p: number) => void; total: number; capped: number
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[11px] text-d-text-muted">
        Page <span className={`text-d-text-primary ${MONO}`}>{page}</span> of{' '}
        <span className={MONO}>{totalPages}</span> · {total} stocks
        {capped ? <span className="text-d-text-muted"> · first {SCOPE_CAP} of {capped}, search to reach any name</span> : null}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-sm border border-line px-3 py-1.5 text-[11px] text-d-text-secondary transition-colors hover:text-d-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" /> Previous
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 rounded-sm border border-line px-3 py-1.5 text-[11px] text-d-text-secondary transition-colors hover:text-d-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// --------------------------------------------------------------- helpers

interface UnivRow { symbol: string; name: string; sector: string | null; mcap: string | null }

async function loadIndex(indexName: string): Promise<UnivRow[]> {
  const res = await api.screener.indexConstituents(indexName, 800)
  if (!res?.constituents) return []
  return res.constituents.map((c) => ({
    symbol: c.symbol,
    name: c.name || c.symbol,
    sector: c.sector || null,
    mcap: c.mcap_category || null,
  }))
}

async function loadSearch(q: string): Promise<UnivRow[]> {
  const res = await api.screener.searchInstruments(q, 60)
  if (!res?.instruments) return []
  return res.instruments.map((i) => ({
    symbol: i.symbol,
    name: i.name || i.symbol,
    sector: i.sector || null,
    mcap: i.mcap_category || null,
  }))
}

/** Merge live quotes into the universe rows (chunked so big indices stay safe). */
async function withLivePrices(universe: UnivRow[], signalSymbols: Set<string>): Promise<StockRow[]> {
  const priceMap = new Map<string, any>()
  const syms = universe.map((u) => u.symbol)
  for (let i = 0; i < syms.length; i += 50) {
    const chunk = syms.slice(i, i + 50)
    try {
      const json = await api.screener.getLivePrices(chunk)
      if (json?.success && Array.isArray(json.prices)) {
        for (const p of json.prices) {
          const key = String(p.symbol || '').replace('.NS', '').toUpperCase()
          if (key) priceMap.set(key, p)
        }
      }
    } catch { /* honest-empty: row shows "—" until quotes resolve */ }
  }
  return universe.map((u): StockRow => {
    const clean = u.symbol.replace('.NS', '').toUpperCase()
    const p = priceMap.get(clean) || {}
    return {
      symbol: u.symbol,
      name: u.name,
      sector: u.sector,
      mcap: u.mcap,
      price: Number(p.price || p.last_price || 0),
      change: Number(p.change || 0),
      changePercent: Number(p.change_percent || 0),
      volume: Number(p.volume || 0),
      hasSignal: signalSymbols.has(clean),
    }
  })
}

function titleCase(s: string): string {
  return s.replace(/\b\w+/g, (w) =>
    w.length <= 3 ? w : w.charAt(0) + w.slice(1).toLowerCase())
}

function formatVolume(v: number): string {
  if (!v || !isFinite(v)) return '-'
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return String(v)
}
