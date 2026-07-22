'use client'

/**
 * Sector Rotation (RRG) — leaders/laggards by relative strength + momentum vs
 * the market, over short (~5d) and long (~20d) windows. Real candle data (no
 * LLM by default); honest-empty when the candle history is too thin.
 */

import useSWR from 'swr'
import { RefreshCw } from '@/lib/icons'

import { api } from '@/lib/api'

interface Row {
  sector: string; count: number; rs_short: number; rs_long: number; quadrant: string
}

const QUAD: Record<string, { label: string; color: string }> = {
  leading: { label: 'Leading', color: 'var(--color-up)' },
  improving: { label: 'Improving', color: 'var(--color-primary-text)' },
  weakening: { label: 'Weakening', color: 'var(--color-warning)' },
  lagging: { label: 'Lagging', color: 'var(--color-down)' },
}

export default function SectorRotationCard() {
  // SWR with retry + keep-last-good (was a one-shot useEffect that rendered
  // null forever after a single transient error).
  const { data, isLoading } = useSWR<Row[] | null>(
    'mkt-sector-rotation',
    () => api.screener.sectorRotation(false).then((r) => (r?.sectors?.length ? (r.sectors as Row[]) : null)).catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 300_000, keepPreviousData: true, errorRetryCount: 4 },
  )
  const rows = data ?? []

  if (isLoading && !data) return <div className="rounded-[20px] bg-wrap h-[160px] animate-pulse" />
  if (!rows.length) return null

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[20px] bg-wrap">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-d-text-primary">
          <RefreshCw className="w-3.5 h-3.5 text-primary" /> Sector Rotation
        </span>
        <span className="text-[10px] text-d-text-muted">RS vs market · 5d / 20d</span>
      </div>
      <div className="max-h-[480px] flex-1 divide-y divide-line overflow-y-auto [scrollbar-width:thin]">
        {rows.map((r) => {
          const q = QUAD[r.quadrant] || { label: r.quadrant, color: 'var(--color-muted)' }
          return (
            <div key={r.sector} className="flex items-center justify-between px-4 py-2">
              <div className="min-w-0">
                <div className="text-[12px] text-d-text-primary truncate">{r.sector}</div>
                <div className="text-[10px] text-d-text-muted">{r.count} names</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] numeric" style={{ color: r.rs_long >= 0 ? 'var(--color-up)' : 'var(--color-down)' }}>
                  {r.rs_long >= 0 ? '+' : ''}{r.rs_long.toFixed(1)}
                </span>
                <span
                  className="text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ color: q.color, background: `color-mix(in srgb, ${q.color} 10%, transparent)` }}
                >
                  {q.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
