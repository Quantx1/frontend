'use client'

/**
 * PrebuiltScreeners — the curated screener gallery, grouped by trading style.
 *
 * Pure navigation surface (Tradomate's screen-library pattern): every card
 * links to its own page at /scanner/[key] where the screen runs with full
 * details. Cards carry the screen's REAL out-of-sample stats — a win-rate
 * gauge in a fixed right rail so nothing floats or misaligns.
 */

import { useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight } from '@/lib/icons'

import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { PREBUILT_STYLES } from '@/lib/prebuilt-screeners'
import { WinRateGauge } from '@/components/scanner/WinRateGauge'

type Stat = NonNullable<Awaited<ReturnType<typeof api.screener.scannerStats>>>['stats'][number]

/** Pick the holding period (5d/10d) with the stronger hit rate — "best hold". */
export function bestHold(s: Stat): { days: number; wr: number; ret: number } {
  const w5 = s.win_rate_5d ?? 0
  const w10 = s.win_rate_10d ?? 0
  return w10 > w5
    ? { days: 10, wr: w10, ret: s.avg_return_10d_pct ?? 0 }
    : { days: 5, wr: w5, ret: s.avg_return_5d_pct ?? 0 }
}

export function PrebuiltScreeners() {
  // Per-scanner historical stats (real OOS) — shared SWR key across screener surfaces.
  const { data: statsData } = useSWR('scanner_stats_all', () => api.screener.scannerStats(), {
    revalidateOnFocus: false,
    dedupingInterval: 600_000,
  })
  const statBySid = useMemo(() => {
    const m = new Map<number, Stat>()
    for (const s of statsData?.stats ?? []) m.set(s.scanner_id, s)
    return m
  }, [statsData])

  return (
    <div className="space-y-8">
      {PREBUILT_STYLES.map((style) => (
        <section key={style.key} className="space-y-3">
          <div>
            <h2 className="text-[15px] font-semibold text-d-text-primary">{style.label}</h2>
            <p className="text-[12.5px] text-d-text-muted">{style.tagline}</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {style.screeners.map((s) => {
              const stat = statBySid.get(s.scanners[0])
              const hold = stat && stat.total_hits >= 10 ? bestHold(stat) : null
              return (
                <Link
                  key={s.key}
                  href={`/scanner/${s.key}`}
                  className="group grid min-h-[104px] grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-line bg-wrap p-4 transition-colors hover:border-d-text-muted/40 hover:bg-wrap-hover"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-semibold text-d-text-primary">
                        {s.name}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-d-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="line-clamp-2 text-[11.5px] leading-relaxed text-d-text-muted">{s.blurb}</p>
                    {hold && (
                      <p className={`text-[10.5px] ${MONO} text-d-text-muted`}>
                        {hold.days}d hold · {hold.ret >= 0 ? '+' : ''}
                        {hold.ret.toFixed(1)}% avg · {stat!.total_hits} signals
                      </p>
                    )}
                  </div>
                  <div className="w-[64px] shrink-0">
                    {hold ? (
                      <WinRateGauge winRate={hold.wr} size={64} />
                    ) : (
                      <div className="flex h-[48px] items-center justify-center">
                        <span className="text-[9px] uppercase tracking-wide text-d-text-muted/60">
                          no history
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
