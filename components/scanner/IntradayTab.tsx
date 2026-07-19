'use client'

/**
 * IntradayTab (PR-P2) — 5m/15m setup scanner UI.
 *
 * Fetches `/api/screener/intraday/scan`, renders ranked matches with
 * setup name, entry/stop/target, R:R, confidence, and the human-readable
 * "why fired" reason. Setup-id filter pills let the user narrow to
 * ORB / VWAP / IB Failure / Power Hour / etc.
 *
 * Time-of-day suppression is enforced server-side (lunch lull
 * 12:30-13:30 IST and closing auction 15:20-15:30 IST never emit).
 */

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  AlertTriangle,
  Clock,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from '@/lib/icons'

import { Badge, Button, DataTable, EmptyState, Skeleton, type Column } from '@/components/foundation'
import { SymbolLogo } from '@/components/ui/BrandLogo'
import { api, handleApiError } from '@/lib/api'

type IntradayMatch = NonNullable<
  Awaited<ReturnType<typeof api.screener.intradayScan>>
>['matches'][number]

const UNIVERSE_OPTIONS = [
  { value: 'nifty50',  label: 'Nifty 50' },
  { value: 'nifty100', label: 'Nifty 100' },
  { value: 'nifty500', label: 'Nifty 500' },
] as const


export default function IntradayTab() {
  const [universe, setUniverse] = useState<(typeof UNIVERSE_OPTIONS)[number]['value']>('nifty50')
  const [selectedSetups, setSelectedSetups] = useState<string[]>([])

  const { data: catalog } = useSWR('intraday_catalog', () => api.screener.intradayCatalog(), {
    revalidateOnFocus: false, dedupingInterval: 3_600_000,
  })

  const { data, error, isLoading, mutate } = useSWR(
    ['intraday_scan', universe, selectedSetups.join(',')],
    () => api.screener.intradayScan({
      universe,
      setups: selectedSetups.length ? selectedSetups : undefined,
      limit: 50,
    }),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  const matches = data?.matches ?? []

  const columns: Column<IntradayMatch>[] = useMemo(() => [
    {
      key: 'symbol', header: 'Symbol', sticky: true, sortable: true,
      cell: (m) => (
        <div className="flex items-center gap-2">
          <SymbolLogo symbol={m.symbol} size={24} />
          <span className="font-medium text-d-text-primary">{m.symbol}</span>
          {m.direction === 'bullish' && <TrendingUp className="h-3 w-3 text-up" />}
          {m.direction === 'bearish' && <TrendingDown className="h-3 w-3 text-down" />}
        </div>
      ),
    },
    {
      key: 'setup_id', header: 'Setup',
      cell: (m) => (
        <div className="flex flex-col">
          <Badge tone={m.direction === 'bullish' ? 'up' : m.direction === 'bearish' ? 'down' : 'muted'}>
            {m.setup_id.replace(/_/g, ' ')}
          </Badge>
          <span className="font-mono text-[10px] text-d-text-muted">{m.timeframe}</span>
        </div>
      ),
    },
    {
      key: 'confidence', header: 'Conf',
      cell: (m) => (
        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] capitalize ${
          m.confidence === 'high' ? 'border-up bg-up/10 text-up'
            : m.confidence === 'medium' ? 'border-primary/60 bg-primary/5 text-primary'
              : 'border-line bg-main text-d-text-muted'
        }`}>{m.confidence}</span>
      ),
    },
    {
      key: 'entry', header: 'Entry', align: 'right',
      cell: (m) => `₹${m.entry.toFixed(2)}`,
    },
    {
      key: 'stop', header: 'Stop', align: 'right', hideOnMobile: true,
      cell: (m) => <span className="text-down">₹{m.stop.toFixed(2)}</span>,
    },
    {
      key: 'target', header: 'Target', align: 'right', hideOnMobile: true,
      cell: (m) => <span className="text-up">₹{m.target.toFixed(2)}</span>,
    },
    {
      key: 'risk_reward', header: 'R:R', align: 'right', sortable: true,
      sortValue: (m) => m.risk_reward,
      cell: (m) => `${m.risk_reward.toFixed(1)}:1`,
    },
    {
      key: 'volume_ratio', header: 'Vol×', align: 'right',
      hideOnMobile: true,
      cell: (m) => (
        <span className={m.volume_ratio >= 1.5 ? 'text-up' : 'text-d-text-secondary'}>
          {m.volume_ratio.toFixed(1)}×
        </span>
      ),
    },
    {
      key: 'reason', header: 'Reason',
      cell: (m) => (
        <span className="text-[11px] text-d-text-secondary">{m.reason}</span>
      ),
    },
  ], [])

  const toggleSetup = (id: string) => {
    setSelectedSetups((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter strip — universe + setup pills */}
      <div className="space-y-2 rounded-md border border-line bg-wrap/60 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">
            Universe
          </span>
          {UNIVERSE_OPTIONS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => setUniverse(u.value)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                universe === u.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              {u.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-[10px] text-d-text-muted">
            {data && (
              <Badge tone="muted">
                {data.count} hits · {data.symbols_scanned} scanned
              </Badge>
            )}
            <Button size="sm" variant="ghost" onClick={() => mutate()} aria-label="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {catalog?.setups && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-d-text-muted">Setup</span>
            <button
              type="button"
              onClick={() => setSelectedSetups([])}
              className={`rounded-md border px-1.5 py-0.5 text-[10px] ${
                selectedSetups.length === 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
              }`}
            >
              All ({catalog.setups.length})
            </button>
            {catalog.setups.map((s) => {
              const active = selectedSetups.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSetup(s.id)}
                  title={`${s.tf} · ${s.direction}`}
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] capitalize transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
                  }`}
                >
                  {s.id.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Session-window note */}
      <div className="flex items-center gap-2 rounded-md border border-line bg-wrap/40 px-3 py-1.5 text-[10px] text-d-text-muted">
        <Clock className="h-3 w-3" />
        <span>
          5m/15m setups suppress signals during lunch lull (12:30-13:30 IST) and
          closing auction (15:20-15:30 IST). NSE bars feed via Kite primary / yfinance fallback.
        </span>
      </div>

      {error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Intraday scan failed"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : (
        <DataTable
          ariaLabel="Intraday setup matches"
          data={matches}
          columns={columns}
          loading={isLoading && matches.length === 0}
          loadingRows={6}
          empty={
            <EmptyState
              icon={<Loader2 className="h-6 w-6" />}
              title="No intraday setups firing right now"
              description="Outside market hours signals stay flat. Try Nifty 500 universe for wider coverage, or wait for the next 5m bar."
              size="sm"
            />
          }
        />
      )}

      <p className="text-[10px] text-d-text-muted">
        Intraday detectors source: ORB (Crabel) · VWAP family (Bulls on Wall Street, Brian Shannon) ·
        Open Drive (Dalton Market Profile) · Hikkake (Linda Raschke) · Power Hour fade (Edgeful) ·
        Squeeze (John Carter). Verified formulas — see scanner docstrings.
      </p>
    </div>
  )
}
