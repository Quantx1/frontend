'use client'

/**
 * PatternsV2Tab (PR-S5 + PR-S3) — chart-pattern scanner v2.
 *
 * Replaces the legacy `/patterns/{type}` flow (which surfaced rule-only
 * detections gated behind Pro) with the new v2 pipeline:
 *   ml/features/patterns.scan_all_patterns()  → rule engine
 *      + BreakoutMetaLabeler RandomForest      → ML probability
 *      + regime-aware filter                   → drop counter-trend setups
 *      + volume confirm on detection bar       → no thin breakouts
 *
 * Each row shows: composite score, ML probability, direction badge,
 * pattern type, entry/stop/target, regime tag. Click → opens a deep-
 * dive panel that calls /patterns/v2/explain/{symbol} with the full
 * "why matched" indicator breakdown + AI-narrated thesis.
 *
 * Honest output: no marketing "63.6% WR" claim. Score columns are raw
 * model outputs the trader can interpret themselves.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  AlertTriangle,
  Brain,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from '@/lib/icons'

import {
  Badge,
  Button,
  ChangeBadge,
  DataTable,
  EmptyState,
  Skeleton,
  type Column,
} from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

type Match = NonNullable<
  Awaited<ReturnType<typeof api.screener.patternsV2Scan>>
>['matches'][number]

type Explain = Awaited<ReturnType<typeof api.screener.patternsV2Explain>>


// ── SSE streaming hook (PR-S2) ──────────────────────────────────────
// Consumes /api/screener/patterns/v2/scan/stream as a server-sent event
// stream and exposes append-as-you-go matches + progress for the UI.
// Auto-aborts the prior connection when any filter changes.

interface StreamState {
  status: 'idle' | 'streaming' | 'done' | 'error'
  matches: Match[]
  processed: number
  total: number
  regime: string | null
  error: string | null
  elapsedS: number | null
  restart: () => void
  abort: () => void
}

function useStreamingScan(opts: {
  enabled: boolean
  universe: string
  timeframe: '1d' | '1h' | '15m'
  direction?: 'bullish' | 'bearish'
  sectors: string[]
  limit?: number
}): StreamState {
  const { enabled, universe, timeframe, direction, sectors, limit } = opts
  const [status, setStatus] = useState<StreamState['status']>('idle')
  const [matches, setMatches] = useState<Match[]>([])
  const [processed, setProcessed] = useState(0)
  const [total, setTotal] = useState(0)
  const [regime, setRegime] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedS, setElapsedS] = useState<number | null>(null)
  const [nonce, setNonce] = useState(0)
  const sourceRef = useRef<EventSource | null>(null)

  const abort = useCallback(() => {
    sourceRef.current?.close()
    sourceRef.current = null
    setStatus('idle')
  }, [])

  const restart = useCallback(() => {
    abort()
    setNonce((n) => n + 1)
  }, [abort])

  useEffect(() => {
    if (!enabled) {
      abort()
      return
    }
    setMatches([])
    setProcessed(0)
    setTotal(0)
    setError(null)
    setElapsedS(null)
    setStatus('streaming')

    const url = api.screener.patternsV2StreamUrl({
      universe: universe as 'nifty500' | 'nse_all' | 'nifty100' | 'nifty50',
      timeframe,
      direction, sectors: sectors.length ? sectors : undefined, limit,
    })
    const es = new EventSource(url, { withCredentials: false })
    sourceRef.current = es

    es.addEventListener('start', (ev) => {
      try {
        const d = JSON.parse((ev as MessageEvent).data)
        setTotal(d.total ?? 0)
        setRegime(d.regime ?? null)
      } catch {}
    })
    es.addEventListener('progress', (ev) => {
      try {
        const d = JSON.parse((ev as MessageEvent).data)
        setProcessed(d.processed ?? 0)
        if (d.total) setTotal(d.total)
      } catch {}
    })
    es.addEventListener('match', (ev) => {
      try {
        const d = JSON.parse((ev as MessageEvent).data)
        if (Array.isArray(d.matches) && d.matches.length) {
          setMatches((m) => {
            // Keep best-scored copy per (symbol, pattern_type); newest hit wins ties.
            const map = new Map<string, Match>()
            for (const x of m) map.set(`${x.symbol}:${x.pattern_type}`, x)
            for (const x of d.matches) {
              const k = `${x.symbol}:${x.pattern_type}`
              const cur = map.get(k)
              if (!cur || x.composite_score >= cur.composite_score) {
                map.set(k, x)
              }
            }
            const next = Array.from(map.values())
            next.sort((a, b) => b.composite_score - a.composite_score)
            return next
          })
        }
      } catch {}
    })
    es.addEventListener('done', (ev) => {
      try {
        const d = JSON.parse((ev as MessageEvent).data)
        if (typeof d.elapsed_s === 'number') setElapsedS(d.elapsed_s)
      } catch {}
      setStatus('done')
      es.close()
      sourceRef.current = null
    })
    es.addEventListener('error', (ev) => {
      // EventSource raises an unnamed `error` event on disconnect even
      // after our explicit close — only treat as an error if status is
      // still 'streaming'.
      try {
        const d = JSON.parse((ev as MessageEvent).data ?? '{}')
        if (d.error) setError(d.error)
      } catch {}
      if (sourceRef.current === es) {
        setStatus((s) => (s === 'streaming' ? 'error' : s))
        es.close()
        sourceRef.current = null
      }
    })

    return () => {
      es.close()
      if (sourceRef.current === es) sourceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, universe, timeframe, direction, sectors.join(','), limit, nonce])

  return { status, matches, processed, total, regime, error, elapsedS, restart, abort }
}

const UNIVERSE_OPTIONS = [
  { value: 'nifty50',  label: 'Nifty 50' },
  { value: 'nifty100', label: 'Nifty 100' },
  { value: 'nifty500', label: 'Nifty 500' },
  { value: 'nse_all',  label: 'NSE All (~2,136)' },
] as const

const DIRECTION_OPTIONS = [
  { value: undefined as 'bullish' | 'bearish' | undefined, label: 'All' },
  { value: 'bullish' as const, label: 'Bullish' },
  { value: 'bearish' as const, label: 'Bearish' },
]

// Timeframe selector — backend caps at 1d/1h/15m. yfinance allows ~60d
// of intraday so 1h yields ~390 bars, 15m yields ~1,500 bars — both
// well above the rule engine's 100-bar MIN_BARS_REQUIRED.
const TIMEFRAME_OPTIONS: Array<{ value: '1d' | '1h' | '15m'; label: string }> = [
  { value: '1d',  label: 'Daily' },
  { value: '1h',  label: '1H' },
  { value: '15m', label: '15M' },
]

export default function PatternsV2Tab() {
  const [universe, setUniverse] =
    useState<(typeof UNIVERSE_OPTIONS)[number]['value']>('nifty50')
  const [timeframe, setTimeframe] = useState<'1d' | '1h' | '15m'>('1d')
  const [direction, setDirection] = useState<'bullish' | 'bearish' | undefined>(undefined)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selected, setSelected] = useState<Match | null>(null)

  // Sector list — fetched once for the chip row
  const { data: sectorsData } = useSWR(
    'patterns_v2_sectors',
    () => api.screener.patternsV2Sectors(),
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  )

  // Large universes (nifty500 / nse_all) use SSE so the user sees live
  // progress; small universes use the cached blocking endpoint for
  // simplicity. The 60-symbol cap on the blocking endpoint already covers
  // nifty50 / nifty100 in a single warm response.
  const useStream = universe === 'nifty500' || universe === 'nse_all'

  // ── Blocking path (small universes) ──────────────────────────────
  const { data, error, isLoading, mutate } = useSWR(
    useStream ? null : ['patterns_v2_scan', universe, timeframe, direction, selectedSectors.join(',')],
    () => api.screener.patternsV2Scan({
      universe: universe as 'nifty50' | 'nifty100' | 'nifty500',
      timeframe,
      direction, limit: 50,
    }),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 120_000,
    },
  )

  // ── Streaming path (large universes) ────────────────────────────
  const stream = useStreamingScan({
    enabled: useStream,
    universe, timeframe, direction, sectors: selectedSectors, limit: 100,
  })

  const matches: Match[] = useStream
    ? stream.matches
    : (data?.matches ?? [])
  const regime = useStream ? stream.regime : (data?.regime ?? null)
  const symbolsScanned = useStream ? stream.processed : (data?.symbols_scanned ?? 0)
  const total = useStream ? stream.total : (data?.symbols_scanned ?? 0)
  const errStr = useStream ? stream.error : (error ? handleApiError(error) : null)
  const loading = useStream ? stream.status === 'streaming' : isLoading
  const refresh = useCallback(() => {
    if (useStream) stream.restart()
    else void mutate()
  }, [useStream, stream, mutate])

  const columns: Column<Match>[] = useMemo(() => [
    {
      key: 'symbol', header: 'Symbol', sticky: true, sortable: true,
      cell: (m) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-d-text-primary">{m.symbol}</span>
          {m.direction === 'bullish' && <TrendingUp className="h-3 w-3 text-up" />}
          {m.direction === 'bearish' && <TrendingDown className="h-3 w-3 text-down" />}
        </div>
      ),
    },
    {
      key: 'pattern_type', header: 'Pattern',
      cell: (m) => (
        <Badge tone={m.direction === 'bullish' ? 'up' : m.direction === 'bearish' ? 'down' : 'muted'}>
          {m.pattern_type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'composite_score', header: 'Score', align: 'right', sortable: true,
      sortValue: (m) => m.composite_score,
      cell: (m) => (
        <span className={`font-mono tabular-nums ${
          m.composite_score >= 0.7 ? 'text-up'
            : m.composite_score >= 0.5 ? 'text-d-text-primary'
              : 'text-d-text-muted'
        }`}>
          {m.composite_score.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'ml_score', header: 'ML', align: 'right', sortable: true,
      sortValue: (m) => m.ml_score,
      cell: (m) => (
        <span className="font-mono tabular-nums text-d-text-secondary">
          {m.ml_score < 0 ? '—' : (m.ml_score * 100).toFixed(0) + '%'}
        </span>
      ),
    },
    {
      key: 'last_price', header: 'LTP', align: 'right', sortable: true,
      sortValue: (m) => m.last_price,
      cell: (m) => `₹${m.last_price.toFixed(2)}`,
    },
    {
      key: 'entry_price', header: 'Entry', align: 'right', hideOnMobile: true,
      cell: (m) => `₹${m.entry_price.toFixed(2)}`,
    },
    {
      key: 'stop_loss', header: 'Stop', align: 'right', hideOnMobile: true,
      cell: (m) => <span className="text-down">₹{m.stop_loss.toFixed(2)}</span>,
    },
    {
      key: 'take_profit', header: 'Target', align: 'right', hideOnMobile: true,
      cell: (m) => <span className="text-up">₹{m.take_profit.toFixed(2)}</span>,
    },
    {
      key: 'risk_reward', header: 'R:R', align: 'right', sortable: true,
      sortValue: (m) => m.risk_reward, hideOnMobile: true,
      cell: (m) => `${m.risk_reward.toFixed(1)}:1`,
    },
    {
      key: 'volume_ratio', header: 'Vol×', align: 'right', sortable: true,
      sortValue: (m) => m.volume_ratio, hideOnMobile: true,
      cell: (m) => (
        <span className={m.volume_ratio >= 1.5 ? 'text-up' : 'text-d-text-secondary'}>
          {m.volume_ratio.toFixed(1)}×
        </span>
      ),
    },
    {
      key: 'open' as any, header: '', align: 'right',
      cell: (m) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(m) }}>
          <Brain className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [])

  const progressPct = total > 0 ? (symbolsScanned / total) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Filter strip — universe + direction */}
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
              className={`rounded-md px-2 py-1 text-[11px] ${
                universe === u.value
                  ? 'glass-control-accent'
                  : 'glass-control text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Timeframe
          </span>
          {TIMEFRAME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTimeframe(t.value)}
              className={`rounded-md px-2 py-1 text-[11px] ${
                timeframe === t.value
                  ? 'glass-control-accent'
                  : 'glass-control text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Direction
          </span>
          {DIRECTION_OPTIONS.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setDirection(d.value)}
              className={`rounded-md px-2 py-1 text-[11px] ${
                direction === d.value
                  ? 'glass-control-accent'
                  : 'glass-control text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-d-text-muted">
          {regime && <Badge tone="muted">regime · {regime}</Badge>}
          <span className="font-mono">
            {matches.length} matches{useStream ? ` · ${symbolsScanned}/${total} scanned` : ` · ${symbolsScanned} symbols`}
          </span>
          {useStream && stream.status === 'streaming' ? (
            <Button size="sm" variant="ghost" onClick={stream.abort} aria-label="Stop scan">
              <Pause className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={refresh} aria-label="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Sector chips — PR-S2 pre-filter */}
      {sectorsData && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-line bg-wrap/40 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Sector
          </span>
          <button
            type="button"
            onClick={() => setSelectedSectors([])}
            className={`rounded-full px-2.5 py-0.5 text-[11px] ${
              selectedSectors.length === 0
                ? 'glass-control-accent'
                : 'glass-control text-d-text-secondary hover:text-d-text-primary'
            }`}
          >
            All ({sectorsData.tagged_count})
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
                className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors ${
                  active
                    ? 'glass-control-accent'
                    : 'glass-control text-d-text-secondary hover:text-d-text-primary'
                }`}
              >
                {s.sector} <span className="font-mono text-[10px] opacity-70">({s.count})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Streaming progress bar */}
      {useStream && total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-d-text-muted">
            <span>
              {stream.status === 'streaming' ? 'Scanning…' : stream.status === 'done' ? 'Complete' : 'Cancelled'}
              {stream.elapsedS != null && ` · ${stream.elapsedS}s`}
            </span>
            <span className="font-mono">{symbolsScanned}/{total} ({progressPct.toFixed(0)}%)</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-line/30">
            <div
              className={`h-full bg-primary transition-all duration-300 ${
                stream.status === 'streaming' ? 'animate-pulse' : ''
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {errStr ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Pattern scanner failed"
          description={errStr}
          action={<Button onClick={refresh}>Retry</Button>}
        />
      ) : (
        <DataTable
          ariaLabel="Chart pattern v2 matches"
          data={matches}
          columns={columns}
          loading={loading && matches.length === 0}
          loadingRows={6}
          empty={
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No patterns matching the gates right now"
              description="Try a different universe, sector, or direction filter. The scanner requires rule quality ≥0.50, ML ≥0.35, regime-aligned, and volume confirm."
            />
          }
          onRowClick={(m) => setSelected(m)}
        />
      )}

      <p className="text-[10px] text-d-text-muted">
        Rule engine + an ML breakout scorer + regime gate + volume confirm.
        {useStream && ' Streaming via Server-Sent Events — partial results appear as found.'}
        Scores are raw model outputs — not trade recommendations.
      </p>

      {selected && (
        <ExplainDrawer
          match={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────
// Deep-dive drawer (PR-S3)
// ─────────────────────────────────────────────────────────────────────

function ExplainDrawer({ match, onClose }: { match: Match; onClose: () => void }) {
  const [explain, setExplain] = useState<Explain | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.screener.patternsV2Explain(match.symbol, true)
      .then((r) => { if (!cancelled) setExplain(r) })
      .catch((e) => { if (!cancelled) setError(handleApiError(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [match.symbol])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-main shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-semibold text-d-text-primary">
              <Brain className="h-4 w-4 text-primary" />
              {match.symbol}
            </h3>
            <p className="font-mono text-[11px] text-d-text-muted">
              {match.pattern_type.replace(/_/g, ' ')} · {match.detected_at}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-d-text-muted hover:text-d-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* Score chips */}
          <div className="grid grid-cols-3 gap-2">
            <ScoreChip label="Composite" value={match.composite_score} hue="primary" />
            <ScoreChip label="Quality" value={match.quality_score} hue="muted" />
            <ScoreChip label="ML score" value={match.ml_score < 0 ? null : match.ml_score} hue="muted" />
          </div>

          {/* Suggested levels */}
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              Suggested levels
            </p>
            {explain ? (
              <div className="rounded-md border border-line bg-wrap p-3 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Entry" value={`₹${explain.suggested.entry}`} />
                  <Stat label={`Stop · ${explain.suggested.stop_basis}`}
                        value={<span className="text-down">₹{explain.suggested.stop}</span>} />
                  <Stat label={`Target · ${explain.suggested.target1_basis}`}
                        value={<span className="text-up">₹{explain.suggested.target1}</span>} />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[11px] text-d-text-muted">
                  <span>Risk : Reward</span>
                  <span className="font-mono">{explain.suggested.risk_reward}:1</span>
                </div>
              </div>
            ) : loading ? (
              <Skeleton w="100%" h="80px" />
            ) : null}
          </section>

          {/* Why matched */}
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
              Why it matched
            </p>
            {loading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h="36px" />)}
              </div>
            ) : explain?.why_matched && explain.why_matched.length > 0 ? (
              <ul className="space-y-1.5 rounded-md border border-line bg-wrap p-3 text-xs">
                {explain.why_matched.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                      w.fired ? 'bg-up' : 'bg-d-text-muted'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-d-text-primary">{w.name}</span>
                        <span className="font-mono text-[11px] text-d-text-secondary">
                          {w.value}{w.threshold != null && ` ${w.operator} ${w.threshold}`}
                        </span>
                      </div>
                      {w.note && (
                        <p className="text-[10px] text-d-text-muted">{w.note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* AI thesis */}
          {explain?.ai_thesis && (
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                AI thesis
              </p>
              <p className="rounded-md border border-line bg-wrap p-3 text-xs leading-relaxed text-d-text-secondary">
                {explain.ai_thesis}
              </p>
              <p className="mt-1 text-[10px] text-d-text-muted">
                Factual narration — not a trade recommendation.
              </p>
            </section>
          )}

          {/* Pattern context */}
          {explain && (
            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
                Pattern context
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-line bg-wrap p-3 text-xs">
                <Stat label="Height" value={`${explain.pattern_height_pct}%`} />
                <Stat label="Duration" value={`${explain.duration_bars} bars`} />
                <Stat label="Touches" value={String(explain.candle_confirmed_touches)} />
                <Stat label="Regime" value={explain.regime ?? 'unknown'} />
              </div>
            </section>
          )}

          {error && (
            <p className="rounded-md border border-down/30 bg-down/10 px-3 py-2 text-xs text-down">
              {error}
            </p>
          )}

          <Link
            href={stockHref(match.symbol)}
            className="block w-full"
            onClick={onClose}
          >
            <Button className="w-full">
              Open chart
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function ScoreChip({ label, value, hue }: {
  label: string
  value: number | null
  hue: 'primary' | 'up' | 'down' | 'muted'
}) {
  const tone =
    value == null ? 'muted'
      : value >= 0.7 ? 'up'
        : value >= 0.5 ? 'primary'
          : 'muted'
  return (
    <div className="rounded-md border border-line bg-wrap p-2 text-center">
      <p className="text-[9px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className={`mt-0.5 font-mono text-sm tabular-nums ${
        tone === 'up' ? 'text-up'
          : tone === 'primary' ? 'text-primary'
            : 'text-d-text-secondary'
      }`}>
        {value == null ? '—' : (value * 100).toFixed(0) + '%'}
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-wider text-d-text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-d-text-primary">
        {value}
      </p>
    </div>
  )
}
