'use client'

/**
 * SectorHeatmap (PR-S13) — sector × metric grid with color-coded breadth.
 *
 * Lives inside the Power tab as a collapsible panel above the result list.
 * Auto-refreshes during market hours (60s tick).
 */

import useSWR from 'swr'
import Link from 'next/link'
import { Activity, TrendingDown, TrendingUp } from '@/lib/icons'

import { Badge, Skeleton } from '@/components/foundation'
import { api } from '@/lib/api'
import { stockHref } from '@/lib/stock-href'

function _isMarketHoursIST(): boolean {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  if (ist.getDay() === 0 || ist.getDay() === 6) return false
  const mins = ist.getHours() * 60 + ist.getMinutes()
  return mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30
}

function changeColor(pct: number): string {
  if (pct > 1.5) return 'bg-up/30 text-up'
  if (pct > 0.5) return 'bg-up/15 text-up'
  if (pct > 0) return 'bg-up/5 text-d-text-primary'
  if (pct > -0.5) return 'bg-down/5 text-d-text-primary'
  if (pct > -1.5) return 'bg-down/15 text-down'
  return 'bg-down/30 text-down'
}

export default function SectorHeatmap() {
  const { data, isLoading, error } = useSWR(
    'sector_heatmap',
    () => api.screener.sectorHeatmap(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      refreshInterval: () => (_isMarketHoursIST() ? 60_000 : 0),
    },
  )

  if (error) return null
  if (isLoading && !data) {
    return <Skeleton w="100%" h="280px" />
  }

  const sectors = data?.sectors ?? []
  if (sectors.length === 0) return null

  return (
    <details className="rounded-lg border border-line bg-wrap/60 px-3 py-2" open>
      <summary className="cursor-pointer text-xs font-medium text-d-text-primary">
        <Activity className="inline h-3.5 w-3.5 text-primary mr-1" />
        Sector Heatmap <span className="font-mono text-[10px] text-d-text-muted">({sectors.length} sectors)</span>
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wider text-d-text-muted">
              <th className="text-left py-1.5 px-2">Sector</th>
              <th className="text-right py-1.5 px-2">N</th>
              <th className="text-right py-1.5 px-2">Avg %</th>
              <th className="text-right py-1.5 px-2">Med %</th>
              <th className="text-right py-1.5 px-2">Breadth</th>
              <th className="text-right py-1.5 px-2">Vol Surge</th>
              <th className="text-right py-1.5 px-2">RSI &lt;30 / &gt;70</th>
              <th className="text-left py-1.5 px-2">Top movers</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => (
              <tr key={s.sector} className="border-b border-line/40 hover:bg-wrap-hover">
                <td className="py-1.5 px-2 font-medium text-d-text-primary">{s.sector}</td>
                <td className="py-1.5 px-2 text-right font-mono text-d-text-muted">{s.peer_count}</td>
                <td className={`py-1.5 px-2 text-right font-mono tabular-nums ${changeColor(s.avg_change_pct)}`}>
                  {s.avg_change_pct >= 0 ? '+' : ''}{s.avg_change_pct.toFixed(2)}%
                </td>
                <td className={`py-1.5 px-2 text-right font-mono tabular-nums ${changeColor(s.median_change_pct)}`}>
                  {s.median_change_pct >= 0 ? '+' : ''}{s.median_change_pct.toFixed(2)}%
                </td>
                <td className="py-1.5 px-2 text-right font-mono">
                  <span className={s.breadth_pct >= 60 ? 'text-up' : s.breadth_pct <= 40 ? 'text-down' : 'text-d-text-muted'}>
                    {s.breadth_pct}%
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-d-text-secondary">
                  {s.volume_surge_pct}%
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-d-text-muted">
                  {s.rsi_oversold_count} / {s.rsi_overbought_count}
                </td>
                <td className="py-1.5 px-2">
                  <div className="flex flex-wrap gap-1">
                    {s.top_movers.map((m) => (
                      <Link
                        key={m.symbol}
                        href={stockHref(m.symbol)}
                        className="glass-control inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px]"
                      >
                        <span className="text-d-text-primary">{m.symbol}</span>
                        <span className={m.change_pct > 0 ? 'text-up' : 'text-down'}>
                          {m.change_pct >= 0 ? '+' : ''}{m.change_pct.toFixed(1)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
