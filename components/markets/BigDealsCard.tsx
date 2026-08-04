'use client'

import { Skeleton } from '@/components/foundation'

/**
 * Big Deals — the institutional paper trail: largest bulk/block deals of the
 * last few sessions (ranked by ₹ value) + upcoming corporate actions (ex-dates)
 * for F&O names. NSE EOD-PUBLISHED disclosure reports (public information,
 * labelled — same SEBI lane as the FII/DII EOD card). Honest-empty.
 */

import useSWR from 'swr'
import Link from 'next/link'
import { Landmark } from '@/lib/icons'
import { api } from '@/lib/api'
import { MONO } from '@/lib/tokens'
import { num, qtyCompact } from '@/lib/format'

const fmtQty = (q: number) => qtyCompact(q)

export default function BigDealsCard() {
  const { data, isLoading } = useSWR(
    'mkt-big-deals',
    () => api.market.deals().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 600_000, keepPreviousData: true, errorRetryCount: 3 },
  )

  // Diversity filter: prop-desk churn shows the same symbol many times (buy +
  // sell legs of one player) — cap 2 rows per symbol so the card stays a
  // market-wide read instead of one name repeated.
  const perSymbol: Record<string, number> = {}
  const deals = (data?.deals ?? []).filter((d) => {
    perSymbol[d.symbol] = (perSymbol[d.symbol] ?? 0) + 1
    return perSymbol[d.symbol] <= 2
  })
  const actions = data?.corporate_actions ?? []
  if (isLoading && !data) return <Skeleton h="160px" rounded="lg" className="rounded-lg" />
  if (!deals.length && !actions.length) return null

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-wrap">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <Landmark className="h-3.5 w-3.5 text-primary" /> Big deals
          <span className="text-[10px] font-normal text-d-text-muted">bulk / block · by ₹ value</span>
        </span>
        <span className="text-[10px] text-d-text-muted">NSE · EOD published</span>
      </div>

      {deals.length > 0 && (
        <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto [scrollbar-width:thin]">
          {deals.slice(0, 7).map((d, i) => (
            <Link
              key={`${d.symbol}-${d.client}-${i}`}
              href={`/stock/${d.symbol}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-2 transition-colors hover:bg-hover"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[12px] font-semibold text-d-text-primary">{d.symbol}</span>
                  <span className="rounded bg-surface-2 px-1 py-px text-[8.5px] font-medium uppercase tracking-wide text-d-text-muted">{d.type}</span>
                </div>
                <p className="truncate text-[10.5px] text-d-text-muted">{d.client}</p>
              </div>
              <span className={`text-[11px] font-semibold ${d.side === 'BUY' ? 'text-up' : 'text-down'}`}>{d.side}</span>
              <span className={`text-right text-[11px] ${MONO} text-d-text-secondary`}>
                ₹{num(d.value_cr)} Cr
                <span className="block text-[9.5px] text-d-text-muted">{fmtQty(d.qty)} @ {num(d.price)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="border-t border-line px-4 py-2.5">
          <p className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-d-text-muted">Corporate actions · ex-dates (F&amp;O names)</p>
          <div className="flex flex-wrap gap-1.5">
            {actions.slice(0, 6).map((a, i) => (
              <span key={`${a.symbol}-${i}`} title={a.subject} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-[10.5px]">
                <span className="font-semibold text-d-text-primary">{a.symbol}</span>
                {a.ex_date && <span className="numeric text-d-text-muted">{a.ex_date}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
