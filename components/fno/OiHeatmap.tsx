'use client'

/**
 * OiHeatmap (PR-S20) — strike-wise OI bar chart for F&O dashboard.
 *
 * Renders horizontal-bar visualization of CE OI (resistance, red) and
 * PE OI (support, green) per strike, with the spot price marked + ATM
 * band highlighted. Top of stack carries the OI-change overlay so a
 * trader can see today's institutional positioning at a glance.
 *
 * Reads from /api/screener/fno/oi-heatmap/{symbol}.
 */

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { AlertTriangle, RefreshCw } from '@/lib/icons'

import { Badge, Button, EmptyState, Skeleton } from '@/components/foundation'
import { api, handleApiError } from '@/lib/api'
import { useBrokerStatus } from '@/lib/hooks/useBrokerStatus'
import BrokerLock, { OptionChainPreview } from '@/components/broker/BrokerLock'

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'] as const

export default function OiHeatmap() {
  const [symbol, setSymbol] = useState<(typeof INDICES)[number]>('NIFTY')
  const { isConnected } = useBrokerStatus()

  const { data, error, isLoading, mutate } = useSWR(
    ['fno_oi_heatmap', symbol],
    () => api.screener.fnoOiHeatmap(symbol),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const maxOi = useMemo(() => {
    if (!data?.rows?.length) return 1
    return data.rows.reduce((m, r) => Math.max(m, r.call_oi, r.put_oi), 1)
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-wrap/60 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-d-text-muted">Index</span>
        {INDICES.map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSymbol(idx)}
            className={`rounded-md border px-3 py-1 text-[11px] font-medium transition-colors ${
              symbol === idx
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-line bg-main text-d-text-secondary hover:text-d-text-primary'
            }`}
          >
            {idx}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-d-text-muted">
          {data && (
            <>
              <Badge tone="muted">Spot ₹{data.spot.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Badge>
              <Badge tone="muted">{data.strike_count} strikes</Badge>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => mutate()} aria-label="Refresh">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {(error || (!isLoading && !data)) && !isConnected ? (
        // No live chain AND no broker → the frosted-glass "connect your broker"
        // lock (per-user broker OAuth is the licence-clean options source).
        <BrokerLock
          feature="Live option chain"
          description="Strike-wise OI, PCR, max pain and support/resistance stream from your own broker. Connect Zerodha, Upstox or Angel to unlock the live chain."
          className="min-h-[320px]"
        >
          <OptionChainPreview />
        </BrokerLock>
      ) : error ? (
        <EmptyState
          tone="error"
          icon={<AlertTriangle className="h-6 w-6" />}
          title="OI heatmap unavailable"
          description={handleApiError(error)}
          action={<Button onClick={() => mutate()}>Retry</Button>}
        />
      ) : isLoading || !data ? (
        <Skeleton w="100%" h="400px" />
      ) : (
        <div className="rounded-xl border border-line bg-wrap">
          <header className="flex items-center justify-between border-b border-line px-3 py-2 text-[10px] uppercase tracking-wider text-d-text-muted">
            <span>Put OI · support</span>
            <span>Strike</span>
            <span>Call OI · resistance</span>
          </header>
          <div className="max-h-[600px] overflow-y-auto">
            {data.rows.map((r) => {
              const callPct = (r.call_oi / maxOi) * 100
              const putPct = (r.put_oi / maxOi) * 100
              const atm = r.distance_pct != null && Math.abs(r.distance_pct) < 0.5
              return (
                <div
                  key={r.strike}
                  className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line/40 px-3 py-1 text-[11px] ${
                    atm ? 'bg-primary/5' : ''
                  }`}
                >
                  {/* Put OI — green, right-aligned bar */}
                  <div className="relative flex h-5 items-center justify-end">
                    <div
                      className="absolute right-0 h-3 rounded-l bg-up/40"
                      style={{ width: `${putPct}%`, maxWidth: '100%' }}
                    />
                    <span className="relative z-10 mr-1 font-mono tabular-nums text-d-text-secondary">
                      {(r.put_oi / 1000).toFixed(0)}k
                      {r.put_oi_change !== 0 && (
                        <span className={r.put_oi_change > 0 ? 'ml-1 text-up' : 'ml-1 text-down'}>
                          {r.put_oi_change > 0 ? '+' : ''}{(r.put_oi_change / 1000).toFixed(0)}k
                        </span>
                      )}
                    </span>
                  </div>
                  {/* Strike */}
                  <div className="text-center font-mono font-medium tabular-nums">
                    {r.strike.toLocaleString('en-IN')}
                  </div>
                  {/* Call OI — red, left-aligned bar */}
                  <div className="relative flex h-5 items-center">
                    <div
                      className="absolute left-0 h-3 rounded-r bg-down/40"
                      style={{ width: `${callPct}%`, maxWidth: '100%' }}
                    />
                    <span className="relative z-10 ml-1 font-mono tabular-nums text-d-text-secondary">
                      {(r.call_oi / 1000).toFixed(0)}k
                      {r.call_oi_change !== 0 && (
                        <span className={r.call_oi_change > 0 ? 'ml-1 text-down' : 'ml-1 text-up'}>
                          {r.call_oi_change > 0 ? '+' : ''}{(r.call_oi_change / 1000).toFixed(0)}k
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <footer className="border-t border-line px-3 py-2 text-[10px] text-d-text-muted">
            Highlighted row = ATM. Put OI bars (green) flag support, Call OI bars (red) flag resistance.
            ΔOI overlay shows today's institutional flow per strike.
          </footer>
        </div>
      )}
    </div>
  )
}
