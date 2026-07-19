'use client'

/**
 * SectorHeatmap — a treemap-style heatmap of OUR NSE sectors (the
 * market-monitor treemap archetype, mapped to our `sectorHeatmap` data).
 *
 * Each sector is a tile whose tint intensity scales with |avg change| and
 * whose hue is duotone green (up) / red (down). Tiles are sized in a flowing
 * grid (larger span for sectors with more names) to read like a treemap
 * without a layout engine. Theme-aware: tints are `color-mix` on the up/down
 * tokens over the card surface, so the same component works light + dark.
 *
 * Honest-empty: renders nothing (parent handles the skeleton) when no sectors.
 */

import { MONO } from '@/lib/tokens'

export interface SectorTile {
  sector: string
  avg_change_pct: number
  count?: number
  breadth_pct?: number
}

const pct = (n?: number | null, d = 2) =>
  n == null || Number.isNaN(n) ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`

// Bigger sectors (more constituents) get a wider span — a cheap treemap read.
function spanFor(count: number | undefined, rank: number): string {
  if (rank === 0) return 'col-span-2 row-span-2'
  if ((count ?? 0) >= 30 || rank === 1) return 'col-span-2'
  return 'col-span-1'
}

export function SectorHeatmap({ sectors, max = 12 }: { sectors: SectorTile[]; max?: number }) {
  if (!sectors.length) return null
  const sorted = sectors.slice().sort((a, b) => b.avg_change_pct - a.avg_change_pct).slice(0, max)

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5" style={{ gridAutoRows: 'minmax(64px, auto)' }}>
      {sorted.map((s, i) => {
        const up = s.avg_change_pct >= 0
        const inten = Math.min(Math.abs(s.avg_change_pct) / 2.5, 1) // 0..1
        const bg = `color-mix(in srgb, var(--color-${up ? 'up' : 'down'}) ${Math.round(7 + inten * 22)}%, var(--color-wrap))`
        const border = `color-mix(in srgb, var(--color-${up ? 'up' : 'down'}) ${Math.round(18 + inten * 26)}%, var(--color-line))`
        const big = i === 0
        return (
          <div
            key={s.sector}
            className={`group flex flex-col justify-between rounded-lg border p-2.5 transition-transform hover:-translate-y-0.5 ${spanFor(s.count, i)}`}
            style={{ background: bg, borderColor: border }}
            title={`${s.sector} · ${pct(s.avg_change_pct, 2)}${s.count ? ` · ${s.count} names` : ''}`}
          >
            <div className={`truncate font-medium text-d-text-primary ${big ? 'text-[13px]' : 'text-[11px]'}`}>{s.sector}</div>
            <div className="flex items-end justify-between gap-1">
              <span className={`font-semibold ${MONO} ${up ? 'text-up' : 'text-down'} ${big ? 'text-[18px]' : 'text-[12.5px]'}`}>{pct(s.avg_change_pct, 1)}</span>
              {s.count != null && big && <span className="text-[10px] text-d-text-muted">{s.count} names</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
