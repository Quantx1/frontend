'use client'

/**
 * AI Radar — what the engines see RIGHT NOW, from two already-built 0-token
 * feeds that had no surface: the live alert scanner (volume 3×, 20d-high
 * breakouts, OI shifts, IV-rank extremes) and the Setup Finder (counts for the
 * 4 canonical swing setups). Derived analytics (ratios/flags, not raw quotes)
 * → safe for everyone; honest-empty when nothing fires.
 */

import useSWR from 'swr'
import Link from 'next/link'
import { Radar, Zap, ArrowUpRight } from '@/lib/icons'
import { api } from '@/lib/api'

const SWR_OPTS = { revalidateOnFocus: false, dedupingInterval: 120_000, keepPreviousData: true, errorRetryCount: 3 }

const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-down',
  medium: 'bg-warning',
  low: 'bg-d-text-muted',
}

const TYPE_LABEL: Record<string, string> = {
  volume_spike: 'Vol 3×',
  breakout_20d: '20d breakout',
  oi_spike: 'OI shift',
  iv_rank_high: 'IV extreme',
}

export default function AiRadarStrip() {
  const alerts = useSWR('mkt-live-alerts', () => api.screener.liveAlerts(24).catch(() => null), SWR_OPTS)
  const setups = useSWR('mkt-setups', () => api.screener.setupFinder().catch(() => null), SWR_OPTS)

  const alertItems = ((alerts.data as any)?.alerts ?? []) as Array<{ symbol: string; type: string; severity: string; message: string }>
  const setupItems = (((setups.data as any)?.setups ?? []) as Array<{ key: string; label: string; count: number }>).filter((s) => s.count > 0)

  if (!alertItems.length && !setupItems.length) return null

  return (
    <section aria-label="AI radar" className="flex h-full flex-col rounded-[20px] bg-wrap px-4 py-3.5 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-d-text-primary">
          <Radar className="h-4 w-4 text-primary" /> AI Radar
          <span className="text-[10.5px] font-normal text-d-text-muted">what the engines see right now · derived</span>
        </span>
        <Link href="/signals" className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary transition-opacity hover:opacity-80">
          Today&rsquo;s signals <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="grid flex-1 grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        {/* setup counts — 2-col mini-grid so four setups fill the panel's
            height and sit level with the taller alerts panel beside it */}
        {setupItems.length > 0 && (
          <div className="flex h-full flex-col rounded-xl border border-line bg-surface-2/60 p-3">
            <p className="text-[10px] uppercase tracking-wider text-d-text-muted">Setups on the tape</p>
            <div className="mt-2 grid flex-1 grid-cols-2 content-start gap-1.5">
              {setupItems.map((s) => (
                <Link
                  key={s.key}
                  href="/scanner"
                  className="flex items-center justify-between gap-1.5 rounded-lg border border-line bg-wrap px-2.5 py-1.5 text-[11.5px] text-d-text-secondary transition-colors hover:text-primary"
                >
                  <span className="truncate">{s.label}</span>
                  <span className="numeric font-semibold text-d-text-primary">{s.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* alerts firing now */}
        {alertItems.length > 0 && (
          <div className="flex h-full flex-col rounded-xl border border-line bg-surface-2/60 p-3">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-d-text-muted">
              <Zap className="h-3 w-3" /> Firing now
            </p>
            <div className="mt-2 flex flex-wrap content-start gap-1.5">
              {alertItems.slice(0, 8).map((a, i) => (
                <Link
                  key={`${a.symbol}-${a.type}-${i}`}
                  href={`/stock/${a.symbol}`}
                  title={a.message}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-wrap px-2.5 py-1 text-[11.5px] transition-colors hover:border-primary/40"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[a.severity] ?? 'bg-d-text-muted'}`} />
                  <span className="font-semibold text-d-text-primary">{a.symbol}</span>
                  <span className="text-d-text-muted">{TYPE_LABEL[a.type] ?? a.type.replace(/_/g, ' ')}</span>
                </Link>
              ))}
              {alertItems.length > 8 && (
                <span className="self-center text-[10.5px] text-d-text-muted">+{alertItems.length - 8} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
